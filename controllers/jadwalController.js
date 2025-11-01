import prisma from "../config/prismaClient.js";

export const getAllJadwal = async (req, res) => {
  const jadwal = await prisma.jadwal.findMany({ orderBy: { tanggal: "asc" } });
  res.render("dashboard", {
    title: "Data Jadwal",
    jadwal,
  });
};

export const getAddJadwalForm = (req, res) => {
  res.render("form-jadwal", {
    title: "Tambah Jadwal",
    jadwal: null,
  });
};

export const createJadwal = async (req, res) => {
  const { nama, hari, tanggal, jam_masuk, jam_pulang } = req.body;
  await prisma.jadwal.create({
    data: {
      nama,
      hari,
      tanggal: new Date(tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      jam_masuk,
    },
  });
  res.redirect("/dashboard/jadwal");
};

export const getEditJadwalForm = async (req, res) => {
  const { id } = req.params;
  const jadwal = await prisma.jadwal.findUnique({
    where: { id: Number(id) },
  });

  if (!jadwal) return res.status(404).send("Jadwal tidak ditemukan");

  res.render("form-jadwal", {
    title: "Edit Jadwal",
    jadwal,
  });
};


export const updateJadwal = async (req, res) => {
  const { id } = req.params;
  const { nama, hari, tanggal, jam_masuk } = req.body;

  await prisma.jadwal.update({
    where: { id: Number(id) },
    data: {
      nama,
      hari,
      tanggal: new Date(tanggal),
      jam_masuk,
    },
  });

  res.redirect("/dashboard/jadwal");
};

export const deleteJadwal = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Hapus semua absensi yang terkait dengan jadwal ini
    await prisma.absensi.deleteMany({
      where: { jadwal_id: Number(id) }
    });
    
    // Baru hapus jadwalnya
    await prisma.jadwal.delete({ 
      where: { id: Number(id) } 
    });
    
    res.redirect("/dashboard/jadwal");
  } catch (error) {
    console.error("Error deleting jadwal:", error);
    res.status(500).send("Gagal menghapus jadwal");
  }
};