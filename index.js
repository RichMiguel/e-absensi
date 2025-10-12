import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import flash from "connect-flash";

import absensiSubscriber from "./mqtt/absensiSubscriber.js";

import authRoutes from "./routes/authRouter.js";
import dashboardRoutes from "./routes/dashboardRouter.js";
import mqttRoutes from "./routes/mqttRouter.js";
import isAuthenticated from "./middleware/auth.js";

// --- ganti __dirname untuk ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(
  session({
    secret: "rahasia-super-kuat",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 jam
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", mqttRoutes);
app.use("/dashboard", isAuthenticated, dashboardRoutes);

app.get("/", (req, res) => {
  if (!req.session.userId) return res.redirect("/auth/login");
  res.redirect("/dashboard/absen");
});

// simpan instance WebSocket ke MQTT subscriber
absensiSubscriber.setWsServer(wss);

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  ws.on("close", () => console.log("❌ WebSocket client disconnected"));
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


