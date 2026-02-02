// server.js
// GPTube MVP - Express + React(dist) + WebSocket Signaling Ready

const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

// Railway는 반드시 PORT 환경변수를 사용해야 함
const PORT = process.env.PORT || 3000;

/* ======================================================
   1. Health Check API (Railway 상태 확인)
====================================================== */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GPTube_MVP",
    time: new Date().toISOString(),
  });
});

/* ======================================================
   2. React(Vite) Build 결과 dist 폴더 서빙
====================================================== */
const clientDistPath = path.join(__dirname, "client", "dist");

// dist 폴더 정적 제공
app.use(express.static(clientDistPath));

// React SPA 라우팅 대응
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

/* ======================================================
   3. WebSocket Signaling Server (Step B 핵심)
====================================================== */
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");
  clients.push(ws);

  ws.on("message", (message) => {
    console.log("📩 Signal received:", message.toString());

    // 받은 메시지를 다른 모든 클라이언트에게 전달
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
    clients = clients.filter((c) => c !== ws);
  });
});

/* ======================================================
   4. Start Server
====================================================== */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GPTube MVP running on port ${PORT}`);
});
