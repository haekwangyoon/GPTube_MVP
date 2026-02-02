const express = require("express");
const app = express();

// Railway가 요구하는 PORT 자동 사용
const PORT = process.env.PORT || 8080;

// 기본 루트 응답 (Railway 502 방지)
app.get("/", (req, res) => {
  res.send("GPTube MVP Server is running successfully!");
});

// 서버 실행
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
