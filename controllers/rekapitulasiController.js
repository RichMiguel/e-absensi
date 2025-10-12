import prisma from "../config/prismaClient.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ------------------ GET REKAP ------------------
export const getRekapitulasi = async (req, res) => {
  try {
    const { kelas, bulan, tahun } = req.query;

    const whereClause = {};
    if (kelas) whereClause.kelas = kelas;

    const whereAbsensi = {};
    const whereJadwal = {};
    if (bulan && tahun) {
      const startDate = new Date(tahun, bulan - 1, 1);
      const endDate = new Date(tahun, bulan, 0, 23, 59, 59);
      whereAbsensi.waktu_absensi = { gte: startDate, lte: endDate };
      whereJadwal.tanggal = { gte: startDate, lte: endDate };
    } else if (tahun) {
      const startDate = new Date(tahun, 0, 1);
      const endDate = new Date(tahun, 11, 31, 23, 59, 59);
      whereAbsensi.waktu_absensi = { gte: startDate, lte: endDate };
      whereJadwal.tanggal = { gte: startDate, lte: endDate };
    }

    // Ambil semua jadwal pada periode itu
    const semuaJadwal = await prisma.jadwal.findMany({
      where: whereJadwal,
    });

    const totalJadwal = semuaJadwal.length;

    const siswaList = await prisma.siswa.findMany({
      where: whereClause,
      include: {
        absensi: {
          where: whereAbsensi,
          include: { jadwal: true },
        },
      },
    });

    const dataRekap = siswaList.map((s, i) => {
      const totalHadir = s.absensi.length;
      const tepatWaktu = s.absensi.filter(a => a.status === "TEPAT_WAKTU").length;
      const terlambat = s.absensi.filter(a => a.status === "TERLAMBAT").length;
      const tidakHadir = Math.max(totalJadwal - totalHadir, 0);

      return {
        no: i + 1,
        nis: s.no_induk,
        nama: s.nama,
        kelas: s.kelas,
        hadir: totalHadir,
        tepat: tepatWaktu,
        terlambat: terlambat,
        tidakHadir: tidakHadir,
      };
    });

    res.render("dashboard-rekapitulasi", {
      title: "Rekapitulasi",
      rekap: dataRekap,
      filter: { kelas, bulan, tahun },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error mengambil data rekapitulasi");
  }
};

// ------------------ DOWNLOAD PDF ------------------
export const downloadRekapitulasi = async (req, res) => {
  try {
    const { kelas, bulan, tahun } = req.query;

    console.log(kelas);
    console.log(bulan);
    console.log(tahun);

    const whereClause = {};
    if (kelas) whereClause.kelas = kelas;

    // Filter tanggal
    let startDate, endDate;
    if (bulan && tahun) {
      startDate = new Date(tahun, bulan - 1, 1);
      endDate = new Date(tahun, bulan, 0, 23, 59, 59);
    } else if (tahun) {
      startDate = new Date(tahun, 0, 1);
      endDate = new Date(tahun, 11, 31, 23, 59, 59);
    }

    // Ambil semua jadwal dalam rentang waktu
    const semuaJadwal = await prisma.jadwal.findMany({
      where: startDate && endDate ? { tanggal: { gte: startDate, lte: endDate } } : {},
    });
    const totalJadwal = semuaJadwal.length;

    // Ambil siswa beserta absensinya (dalam range waktu)
    const siswaList = await prisma.siswa.findMany({
      where: whereClause,
      include: {
        absensi: {
          where: startDate && endDate ? { waktu_absensi: { gte: startDate, lte: endDate } } : {},
        },
      },
    });

    // --- Generate PDF ---
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MAN 3 PEKANBARU", 105, 18, { align: "center" });
    doc.setFontSize(12);
    doc.text("Rekapitulasi Absensi Siswa", 14, 30);

    if (kelas) doc.text(`Kelas: ${kelas}`, 14, 36);
    if (bulan && tahun) doc.text(`Periode: ${bulan}-${tahun}`, 14, 42);

    const tableData = siswaList.map((s, i) => {
      const totalHadir = s.absensi.length;
      const tepatWaktu = s.absensi.filter(a => a.status === "TEPAT_WAKTU").length;
      const terlambat = s.absensi.filter(a => a.status === "TERLAMBAT").length;
      const tidakHadir = Math.max(totalJadwal - totalHadir, 0);

      return [
        i + 1,
        s.no_induk,
        s.nama,
        s.kelas,
        totalHadir,
        tepatWaktu,
        terlambat,
        tidakHadir,
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [["No", "NIS", "Nama", "Kelas", "Hadir", "Tepat Waktu", "Terlambat", "Tidak Hadir"]],
      body: tableData,
    });

    const filename = `rekap_${kelas || "semua"}_${bulan || "all"}_${tahun || "all"}.pdf`;
    const pdfBuffer = doc.output("arraybuffer");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("❌ Gagal membuat PDF:", err);
    res.status(500).send("Gagal membuat PDF");
  }
};




