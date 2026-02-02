const express = require("express");
const path = require("path");

const app = express();

// Railway에서는 PORT 환경변수를 쓰는 게 정석 (fallback은 로컬용)
const PORT = process.env.PORT || 8080;

// 헬스 체크 (Railway/브라우저 확인용)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "GPTube API is healthy" });
});

// React 정적 파일 서빙
const distPath = path.join(__dirname, "client", "dist");
app.use(express.static(distPath));

// SPA 라우팅 처리 (어떤 경로로 와도 React index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
