const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// React build 결과(dist) 정적 제공
app.use(express.static(path.join(__dirname, "client", "dist")));

// 헬스체크(선택) - Railway 확인용
app.get("/health", (req, res) => res.status(200).send("ok"));

// SPA 라우팅(새로고침 404 방지)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
