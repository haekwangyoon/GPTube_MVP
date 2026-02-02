/**
 * GPTube_MVP - Unified Server (Express)
 * - Serves React(Vite) build output in production
 * - Provides /health endpoint
 * - Keeps a clean place for future signaling/SFU routes (Step B/SFU)
 */

const path = require("path");
const express = require("express");

const app = express();

// Railway에서는 반드시 PORT 환경변수를 그대로 사용해야 함
const PORT = process.env.PORT || 8080;

// --- 기본 미들웨어 ---
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GPTube_MVP",
    time: new Date().toISOString(),
  });
});

// --- (B단계 자리) API/시그널링 라우트는 여기부터 붙이면 됨 ---
// 예: app.use("/api", apiRouter);
// 예: socket.io / ws 서버는 아래 "HTTP server 확장" 섹션에서 처리

// --- Static serving (Vite build) ---
// 로컬 개발: client를 따로 돌릴 수도 있지만,
// Railway 프로덕션: client/build(or dist)를 서버가 직접 서빙하는 구조로 간다.
const clientDistPath = path.join(__dirname, "client", "dist");

// dist 폴더가 존재하면(=빌드 완료) 정적 서빙 활성화
app.use(express.static(clientDistPath));

// SPA 라우팅 대응: 어떤 경로로 들어와도 index.html 반환
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// --- Start server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`GPTube_MVP server running on port ${PORT}`);
});
