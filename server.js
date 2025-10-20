// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// 루트 경로 응답 (Vercel "GET /" 에러 해결)
// 루트 경로 응답 ("/" 요청 시 메세지 표시)
app.get('/', (req, res) => {
  res.send('✅ GPTube MVP 서버가 정상 작동 중입니다!');
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3001;
app.use(express.static('public'));

// ---- WebRTC + 채팅 + 리액션 이벤트 ----
io.on('connection', (socket) => {

  // 방 입장
  socket.on('join', (roomId, nickname) => {
    socket.join(roomId);
    socket.data.nickname = nickname || `게스트-${socket.id.slice(0,4)}`;
    socket.to(roomId).emit('system', { text: `${socket.data.nickname} 입장`, ts: Date.now() });
  });

  // WebRTC 시그널링
  socket.on('offer', (roomId, sdp) => socket.to(roomId).emit('offer', sdp));
  socket.on('answer', (roomId, sdp) => socket.to(roomId).emit('answer', sdp));
  socket.on('ice-candidate', (roomId, candidate) => socket.to(roomId).emit('ice-candidate', candidate));

  // 채팅
  socket.on('chat', (roomId, text) => {
    io.to(roomId).emit('chat', { user: socket.data.nickname, text, ts: Date.now() });
  });

  // 리액션 (이모지)
  socket.on('reaction', (roomId, emoji) => {
    socket.to(roomId).emit('reaction', { user: socket.data.nickname, emoji, ts: Date.now() });
  });

  // 나가기
  socket.on('leave', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('system', { text: `${socket.data.nickname} 퇴장`, ts: Date.now() });
  });

  // 브라우저 닫힘 시
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('system', { text: `${socket.data.nickname ?? '사용자'} 연결 종료`, ts: Date.now() });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Signaling server running on http://localhost:${PORT}`);
});
