/**
 * server.js
 * GPTube MVP - Express + React(dist) + WebSocket(ws) Signaling 준비
 *
 * ✅ Railway 안정 운영 포인트
 *  - 반드시 process.env.PORT 사용
 *  - /api/health 는 JSON (React 라우팅에 안 잡히게 분리)
 *  - React dist 정적 서빙 + SPA 캐치올은 맨 마지막
 *  - WebSocket(ws) 는 /ws 경로로 분리
 */

const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

/**
 * 1) API Health (JSON)
 *    - 기존 /health 대신 /api/health 사용 권장 (SPA와 충돌 방지)
 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GPTube_MVP",
    time: new Date().toISOString()
  });
});

/**
 * 2) WebSocket Signaling (ws)
 *    - 경로를 /ws 로 분리
 *    - 받은 메시지를 다른 클라이언트들에게 브로드캐스트
 */
const wss = new WebSocket.Server({ server, path: "/ws" });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    const data = message.toString();
    console.log("📩 Signal received:", data);

    // 받은 메시지를 나를 제외한 다른 클라이언트에게 전달
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
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

/**
 * 3) React dist 서빙
 *    - client/dist 가 존재하면 정적 서빙
 *    - 빌드 전/실패 시에도 서버가 죽지 않도록 보호
 */
const distPath = path.join(__dirname, "client", "dist");

// dist 폴더가 없으면(빌드 전/실패) 최소한 health라도 살아있게
app.use((req, res, next) => {
  next();
});

app.use(express.static(distPath));

/**
 * 4) SPA Catch-all (반드시 맨 마지막!)
 *    - /api/* 는 위에서 이미 처리됨
 *    - 그 외 모든 경로는 React index.html
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

/**
 * 5) Start server
 */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GPTube MVP running on port ${PORT}`);
  console.log(`✅ Health: /api/health`);
  console.log(`✅ WS: wss://<domain>/ws`);
});
