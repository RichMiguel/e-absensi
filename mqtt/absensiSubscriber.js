import mqtt from "mqtt";
import prisma from "../config/prismaClient.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");

const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";
const TOPIC_SCAN = "eabsensi_man_3/scan";
const TOPIC_MESSAGE = "eabsensi_man_3/message";
const TOPIC_MODE = "eabsensi_man_3/mode";

export let wsServer = null;
let REGISTER_MODE = false;
export let latestScan = null;

const client = mqtt.connect(BROKER_URL);

client.on("connect", () => {
  console.log("[MQTT] Connected to broker:", BROKER_URL);
  client.subscribe(TOPIC_SCAN, (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err);
    else console.log("[MQTT] Subscribed to:", TOPIC_SCAN);
  });
});

client.on("error", (err) => {
  console.error("[MQTT] Error:", err);
});

client.on("message", async (topic, payload) => {
  if (topic !== TOPIC_SCAN) return;

  try {
    const txt = payload.toString();
    const parsed = JSON.parse(txt);
    const { uid, mac } = parsed;

    if (!uid) return;
    console.log(`[MQTT] Scan received uid=${uid} mac=${mac}`);

    // simpan UID terakhir dengan waktu WIB
    latestScan = { uid, mac, time: dayjs().tz("Asia/Jakarta").toDate() };

    // jika sedang mode register, kirim ke WS admin dan abaikan absensi
    if (REGISTER_MODE) {
      console.log("[MQTT] REGISTER_MODE aktif → kirim ke WS admin");
      broadcastToWs({ type: "register-scan", uid, mac });
      client.publish(TOPIC_MODE, "REGISTER_ON");
      return;
    }

    // jika bukan mode register → proses sebagai absensi
    await handleAbsensi(uid, mac);
  } catch (err) {
    console.error("[MQTT] on message error:", err);
  }
});

// publish pesan ke LCD (alat)
function publishMessage(msg) {
  client.publish(TOPIC_MESSAGE, msg);
}

// broadcast object ke semua klien WebSocket
function broadcastToWs(obj) {
  if (!wsServer) return;
  const j = JSON.stringify(obj);
  wsServer.clients.forEach((c) => {
    if (c.readyState === 1) c.send(j);
  });
}

// normalize date → WIB
function normalizeDate(d) {
  return dayjs(d).tz("Asia/Jakarta").startOf("day").toDate();
}

// handle absensi
async function handleAbsensi(uid, mac) {
  // cek siswa terdaftar
  const siswa = await prisma.siswa.findUnique({ where: { rfid_uid: uid } });

  if (!siswa) {
    const msg = `Kartu belum terdaftar: ${uid}`;
    console.log("[MQTT] uid not found -> publish message to LCD & forward to WS");
    publishMessage(msg);
    broadcastToWs({ type: "uid-not-registered", uid, mac, text: msg });
    return;
  }

  // cari jadwal hari ini (berdasarkan WIB)
  const now = dayjs().tz("Asia/Jakarta");
  const start = now.startOf("day").toDate();
  const end = now.endOf("day").toDate();

  const jadwalsToday = await prisma.jadwal.findMany({
    where: { tanggal: { gte: start, lte: end } },
    orderBy: { jam_masuk: "asc" },
  });

  if (!jadwalsToday.length) {
    publishMessage("Tidak ada jadwal hari ini");
    return;
  }

  // fungsi bantu konversi "HH:mm" → Date WIB
  function parseTimeToDate(baseDate, hhmm) {
    const [hh, mm] = hhmm.split(":").map(Number);
    const d = dayjs(baseDate).tz("Asia/Jakarta").hour(hh).minute(mm).second(0).millisecond(0);
    return d.toDate();
  }

  // cari jadwal terdekat
  let best = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const j of jadwalsToday) {
    const jm = parseTimeToDate(now, j.jam_masuk);
    const diff = Math.abs(now.toDate() - jm);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = j;
    }
  }

  const TOLERANCE_MS = 12 * 60 * 60 * 1000; // 12 jam
  const jadwal = bestDiff <= TOLERANCE_MS ? best : null;

  if (!jadwal) {
    publishMessage("Tidak ada jadwal cocok untuk waktu ini");
    return;
  }

  // cek apakah sudah absen
  const exist = await prisma.absensi.findFirst({
    where: { siswa_id: siswa.id, jadwal_id: jadwal.id },
  });

  if (exist) {
    const msg = `Sudah absen: ${siswa.nama}`;
    publishMessage(msg);
    return;
  }

  // tentukan status absensi
  const jamMasukDate = parseTimeToDate(now, jadwal.jam_masuk);
  const status = now.isBefore(jamMasukDate) ? "TEPAT_WAKTU" : "TERLAMBAT";

  // simpan absensi
  await prisma.absensi.create({
    data: {
      waktu_absensi: now.toDate(),
      status,
      siswa_id: siswa.id,
      jadwal_id: jadwal.id,
    },
  });

  const successMsg = `Selamat Datang, ${siswa.nama} (${status})`;
  publishMessage(successMsg);

  broadcastToWs({
    type: "absensi-success",
    uid,
    siswa: { id: siswa.id, nama: siswa.nama, no_induk: siswa.no_induk },
    jadwalId: jadwal.id,
    status,
  });
}

// setter WS dan mode
export default {
  client,
  publishMessage,
  setWsServer: (w) => (wsServer = w),
  setRegisterMode: (state) => {
    REGISTER_MODE = state;
    console.log(`[MODE] REGISTER_MODE = ${REGISTER_MODE}`);
  },
  getRegisterMode: () => REGISTER_MODE,
};
