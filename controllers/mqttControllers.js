// routes/mqttController.js
import express from "express";

import absensiSubscriber from "../mqtt/absensiSubscriber.js";

const router = express.Router();

// Aktifkan mode register
export const enableRegisterMode = () => {
  absensiSubscriber.setRegisterMode(true);
  console.log("📲 Mode register RFID diaktifkan");
};

// Nonaktifkan mode register
export const disableRegisterMode = () => {
  absensiSubscriber.setRegisterMode(false);
  console.log("🚫 Mode register RFID dimatikan");
};

export const getLatestScan = () => absensiSubscriber.latestScan;


