// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// ✅ 루트 요청 응답 (Vercel "GET /" 오류 방지)
app.get('/', (req, res) => {
  res.status(200).send('✅ GPTube MVP 서버가 정상 작동 중입니다!');
});

// ✅ HTTP 서버 + Socket.IO 설정
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ✅ 실시간 이벤트
io.on('connection', (socket) => {
  console.log('📡 연결됨:', socket.id);

  socket.on('join', (roomId, nickname) => {
    socket.join(roomId);
    socket.data.nickname = nickname || `게스트-${socket.id.slice(0, 4)}`;
    io.to(roomId).emit('system', {
      text: `${socket.data.nickname} 님이 입장했습니다.`,
      ts: Date.now(),
    });
  });

  socket.on('message', (roomId, text) => {
    io.to(roomId).emit('chat', {
      nickname: socket.data.nickname,
      text,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ 연결 종료:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app; // ✅ Vercel이 server.js를 함수처럼 인식하도록 필요
