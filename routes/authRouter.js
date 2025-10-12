import { Router } from "express";
import { getLogin, postLogin, logout } from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = Router();

router.get("/login", getLogin);
router.post("/login", postLogin);
router.post("/logout", logout);

export default router;
