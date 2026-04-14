const express = require("express");
const path    = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── CORS ──────────────────────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Routes ────────────────────────────────────
app.use(require("./src/routes/questions"));

// ── Health check ─────────────────────────────
app.get("/health", (req, res) => res.send("OK"));

app.get("/", (req, res) => res.redirect("/index.html"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`QA 問題回報系統啟動，port ${PORT}`);

  // ── 自我 ping（每 14 分鐘，防止 Render 免費方案休眠）──
  const BASE = process.env.BASE_URL || "https://meetbot-qa-system.onrender.com";
  setInterval(() => {
    require("https").get(`${BASE}/health`, () => {}).on("error", () => {});
  }, 14 * 60 * 1000);
});
