const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// 1) React build 산출물 제공
app.use(express.static(path.join(__dirname, "client", "dist")));

// 2) SPA 라우팅 대응 (중요)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
