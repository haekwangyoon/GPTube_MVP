// server.js
const express = require('express');
const path = require('path');

const app = express();

// /public 폴더 정적 파일 (선택)
app.use(express.static(path.join(__dirname, 'public')));

// 루트 응답 (상태 확인용)
app.get('/', (req, res) => {
  res.send('✅ GPTube MVP 서버가 정상 작동 중입니다! (Vercel Serverless OK)');
});

// Vercel의 Node 런타임은 서버 객체가 아니라 "핸들러"를 기대하니
// app 자체를 내보냅니다.
module.exports = app;
