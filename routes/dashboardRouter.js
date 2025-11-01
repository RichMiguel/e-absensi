import { Router } from "express";
import prisma from "../config/prismaClient.js";
import bcrypt from "bcryptjs";
import {
  getAllSiswa,
  createSiswa,
  deleteSiswa,
  getSiswaForm,
  getDetailSiswa,
  getEditForm,
  updateSiswa,
} from "../controllers/siswaController.js";

import {
  getAllJadwal,
  createJadwal,
  getAddJadwalForm,
  getEditJadwalForm,
  updateJadwal,
  deleteJadwal
} from "../controllers/jadwalController.js";

import {
  getAbsensiByJadwal
} from "../controllers/absensiController.js";

import {
  downloadRekapitulasi,
  getRekapitulasi
} from "../controllers/rekapitulasiController.js";

const router = Router();

router.get("/absen", (req, res) => {
  res.render("dashboard", {
    title: "Data Absen",
  });
});

router.get("/siswa", getAllSiswa);

router.get("/siswa/form", getSiswaForm);
router.post("/siswa/form", createSiswa);
router.get("/siswa/:id", getDetailSiswa);
router.get("/siswa/:id/edit", getEditForm);
router.post("/siswa/:id/edit", updateSiswa);
router.post("/siswa/:id/delete", deleteSiswa);

router.get("/jadwal", getAllJadwal);
router.get("/jadwal/add", getAddJadwalForm);
router.post("/jadwal/add", createJadwal);
router.get("/jadwal/edit/:id", getEditJadwalForm);
router.post("/jadwal/edit/:id", updateJadwal);
router.post("/jadwal/delete/:id", deleteJadwal);

router.get("/jadwal/:id/absensi", getAbsensiByJadwal);

router.get("/rekapitulasi", getRekapitulasi);
router.get("/rekapitulasi/download", downloadRekapitulasi);

router.get("/user", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });

  res.render("dashboard-user", {
    title: "User",
    users});
});

router.get("/user/add", (req, res) => {
  res.render("form-user", {
    title: "Form User"
  });
});

router.post("/user/add", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { username, password: hashed },
    });

    res.redirect("/dashboard/user");
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menambahkan user");
  }
});

// POST /user/delete/:id -> hapus user
router.post("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.redirect("/dashboard/user");
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menghapus user");
  }
});

export default router;
