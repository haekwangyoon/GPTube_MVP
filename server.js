// GPTube MVP Server (WebRTC + Socket.io)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Enable CORS for testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Serve static files from /public
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.send('✅ GPTube MVP server is running successfully.');
});

// HTTP server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket.io events
io.on('connection', (socket) => {
  console.log(`🟢 Connected: ${socket.id}`);

  socket.on('join', (room, nickname) => {
    socket.join(room);
    socket.data.nickname = nickname || `Guest-${socket.id.slice(0, 4)}`;
    socket.to(room).emit('system', {
      text: `${socket.data.nickname} joined the room.`,
      ts: Date.now()
    });
  });

  socket.on('message', (room, text) => {
    io.to(room).emit('chat', {
      nick: socket.data.nickname,
      text,
      ts: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
