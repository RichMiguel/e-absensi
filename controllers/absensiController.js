import prisma from "../config/prismaClient.js";

export const getAbsensiByJadwal = async (req, res) => {
  const { id } = req.params;

  const jadwal = await prisma.jadwal.findUnique({
    where: { id: Number(id) },
    include: {
      absensi: {
        include: { siswa: true },
        orderBy: { waktu_absensi: "asc" },
      },
    },
  });

  if (!jadwal){
    req.flash("error", "Jadwal Tidak Ditemukan!");
    return res.redirect("/dashboard/jadwal");
  } 

  res.render("dashboard-absen", {
    title: `Log Absensi - ${jadwal.nama}`,
    jadwal,
  });
};

async function handleRFID(uid) {
  const now = new Date();
  const hari = getHari(now);

  // cari jadwal aktif hari ini
  const jadwal = await prisma.jadwal.findFirst({
    where: {
      hari,
      tanggal: {
        equals: new Date(now.toDateString()), // hanya tanggal hari ini
      },
    },
    orderBy: { jam_masuk: "asc" },
  });

  if (!jadwal) {
    console.log("Tidak ada jadwal aktif hari ini.");
    return;
  }

  // cari siswa dari UID
  const siswa = await prisma.siswa.findUnique({
    where: { rfid_uid: uid },
  });

  if (!siswa) {
    console.log("Kartu belum terdaftar!");
    return;
  }

  // tentukan status absensi (telat / tepat waktu)
  const status =
    now.toTimeString().slice(0, 5) <= jadwal.jam_masuk
      ? "TEPAT_WAKTU"
      : "TERLAMBAT";

  // simpan log absensi
  await prisma.absensi.create({
    data: {
      waktu_absensi: now,
      status,
      siswa_id: siswa.id,
      jadwal_id: jadwal.id,
    },
  });

  console.log(`Absensi ${siswa.nama} tercatat pada jadwal ${jadwal.nama}`);
}

function getHari(date) {
  const days = [
    "MINGGU",
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
    "SABTU",
  ];
  return days[date.getDay()];
}
