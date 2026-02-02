// server.js
// GPTube MVP - Express + React(Vite dist) + WebSocket signaling (ready)

const path = require("path");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// Railway는 반드시 PORT 환경변수 사용
const PORT = process.env.PORT || 3000;

// --- 1) Health Check (Railway 확인용)
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GPTube_MVP",
    time: new Date().toISOString(),
  });
});

// --- 2) Static (Vite build output)
// Vite build 결과: client/dist
const distPath = path.join(__dirname, "client", "dist");
app.use(express.static(distPath));

// --- 3) SPA fallback: React Router 대비
// (정적 파일에 해당하지 않는 모든 GET 요청은 index.html로)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// --- 4) WebSocket signaling
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    const text = message.toString();
    console.log("📩 Signal received:", text);

    // 자신 제외 브로드캐스트
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.log("⚠️ WebSocket error:", err?.message || err);
  });
});

// --- 5) Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GPTube MVP running on port ${PORT}`);
  console.log(`📦 Serving dist from: ${distPath}`);
});
