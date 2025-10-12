import express from "express";
import {
    disableRegisterMode,
    enableRegisterMode,
    getLatestScan
} from "../controllers/mqttControllers.js";

const router = express.Router();

router.post("/mode/register/on", enableRegisterMode);

router.post("/mode/register/off", disableRegisterMode);

router.get("/latest-scan", getLatestScan);

export default router;
