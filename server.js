// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// 루트 확인용 (Vercel “GET /” 에러 방지)
app.get('/', (req, res) => {
  res.send('✅ GPTube MVP 서버가 정상 작동 중입니다!');
});

// 서버 및 Socket.IO 설정
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('✅ 사용자 연결됨:', socket.id);

  socket.on('join', (roomId, nickname) => {
    socket.join(roomId);
    socket.data.nickname = nickname || `게스트-${socket.id.slice(0, 4)}`;
    io.to(roomId).emit('system', { text: `${socket.data.nickname} 입장`, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('❌ 사용자 연결 종료:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
