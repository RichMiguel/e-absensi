import prisma from "../config/prismaClient.js";

export const getAllSiswa = async (req, res) => {
  const siswa = await prisma.siswa.findMany({ orderBy: { createdAt: "desc" } });
  res.render("dashboard-siswa", {
    title: "Data Siswa",
    siswa,
  });
};

// Form tambah
export const getSiswaForm = (req, res) => {
  res.render("form-siswa", {
    title: "Form Siswa",
    siswa: null,
    action: `siswa/form`,
  });
};

// Tambah siswa
export const createSiswa = async (req, res) => {
  const { no_induk, nama, tempat_lahir, tanggal_lahir, kelas, rfid_uid } = req.body;
  const existing = await prisma.siswa.findUnique({
    where: { no_induk: no_induk },
  });

  if (existing) {
    req.flash("error", "Nomor induk sudah terdaftar!");
    return res.redirect("/dashboard/siswa");
  }

  try {
    await prisma.siswa.create({
      data: {
        no_induk,
        nama,
        tempat_lahir,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
        kelas,
        rfid_uid,
      },
    });
    req.flash("success", "Berhasil Mendaftarkan Siswa Baru!");
    res.redirect("/dashboard/siswa");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error Menambah Siswa!");
    res.redirect("/dashboard/siswa");
  }
};

// Detail siswa
export const getDetailSiswa = async (req, res) => {
  const { id } = req.params;
  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return res.status(404).send("Siswa tidak ditemukan");
  res.render("detail-siswa", { 
    title: "Detail Siswa",
    siswa,
    action: `siswa/form` });
};

// Form edit
export const getEditForm = async (req, res) => {
  const { id } = req.params;
  const siswa = await prisma.siswa.findUnique({ where: { id: Number(id) } });
  if (!siswa) return res.status(404).send("Siswa tidak ditemukan");
  res.render("form-siswa", { 
    title: "Edit Siswa",
    siswa, 
    action: `siswa/${id}/edit` });
};

// Update siswa
export const updateSiswa = async (req, res) => {
  const { id } = req.params;
  const { no_induk, nama, tempat_lahir, tanggal_lahir, kelas, rfid_uid } =
    req.body;
  try {
    await prisma.siswa.update({
      where: { id: Number(id) },
      data: {
        no_induk,
        nama,
        tempat_lahir,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
        kelas,
        rfid_uid,
      },
    });
    res.redirect("/dashboard/siswa");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error update siswa");
    res.redirect("/dashboard/siswa");
  }
};

// Hapus siswa
export const deleteSiswa = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.siswa.delete({ where: { id: Number(id) } });
    req.flash("success", "Berhasil Menghapus Siswa!")
    res.redirect("/dashboard/siswa");
  } catch (err) {
    console.error(err);
    req.flash("error", "Gagal Menghapus Siswa!")
    res.redirect(`/dashboard/siswa/${id}/edit`);
  }
};