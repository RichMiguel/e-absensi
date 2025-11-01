import prisma from "../config/prismaClient.js";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezone);

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
  const { nama, hari, tanggal, jam_masuk } = req.body;
  
  // Set tanggal dengan timezone Asia/Jakarta
  const tanggalObj = dayjs.tz(tanggal, 'Asia/Jakarta').toDate();
  
  await prisma.jadwal.create({
    data: {
      nama,
      hari,
      tanggal: tanggalObj,
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