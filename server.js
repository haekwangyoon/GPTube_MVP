const express = require("express");
const app = express();

// Railway에서는 반드시 PORT 환경변수를 그대로 써야 함
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("GPTube MVP Server is running successfully!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
