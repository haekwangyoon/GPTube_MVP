// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// --- CORS (간단 허용) ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- 정적 파일 제공 (/public) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 루트 경로 응답: index.html ---
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- HTTP + Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 예시 이벤트(필요시 수정/추가)
io.on('connection', (socket) => {
  socket.on('join', (roomId, nickname) => {
    socket.join(roomId);
    socket.data.nickname = nickname || `guest-${socket.id.slice(0, 4)}`;
    socket.to(roomId).emit('system', {
      text: `${socket.data.nickname} joined`,
      ts: Date.now(),
    });
  });

  socket.on('chat', (roomId, text) => {
    io.to(roomId).emit('chat', {
      from: socket.data.nickname || 'anon',
      text,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    // 필요 시 정리 로직
  });
});

// --- 포트 바인딩(로컬/호스팅 환경 모두 호환) ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
