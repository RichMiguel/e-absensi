import prisma from "../config/prismaClient.js";
import { compare } from "bcryptjs";


export const getLogin = (req, res) => {
  res.render("auth/login", {
    title: "Login",
  });
}

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      req.flash("error", "User tidak ditemukan!");
      return res.redirect("/auth/login");
    }

    const match = await compare(password, user.password);
    if (!match) {
      req.flash("error", "Password Salah!");
      return res.redirect("/auth/login");
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    req.flash("success", "Login berhasil!");
    return res.redirect("/dashboard/jadwal");

  } catch (error) {
    req.flash("error", error.message || "Terjadi error!");
    return res.redirect("/auth/login");
  }
}

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/auth/login");
  });
}
