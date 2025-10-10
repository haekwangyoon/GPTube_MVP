// =======================// public/client.js
// =====================================================
// GPTube 실시간 방송 MVP - 클라이언트 전체 스크립트
// (WeRTC + Socket.IO + 채팅 + 장치토글 + 화면공유)
// =====================================================

// 0) 서버 주소 설정 -------------------------------
// - 외부접속: const SOCKET_URL = 'https://storiated-ramiro-overelliptically.ngrok-free.dev';
// - 로컬개발만: const SOCKET_URL = '';
const SOCKET_URL = ''; // <= ngrok 쓰면 여기에 넣으세요.

const socket = io(SOCKET_URL || undefined, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// 전역 상태 --------------------------------------
let pc;                   // RTCPeerConnection
let localStream;          // 내 카메라/마이크 스트림
let screenStream;         // 화면공유 스트림
let roomId = '';
let isHost = false;
let isMakingOffer = false;
let ignoreOffer = false;

// DOM 캐시 ---------------------------------------
const $ = (id) => document.getElementById(id);

const els = {
  roomInput: $('roomInput'),
  joinBtn: $('joinBtn'),
  leaveBtn: $('leaveBtn'),
  muteBtn: $('muteBtn'),
  cameraBtn: $('cameraBtn'),
  shareBtn: $('shareBtn'),
  readyBtn: $('readyBtn'),
  localVideo: $('localVideo'),
  remoteVideo: $('remoteVideo'),
  chatBox: $('chatBox'),
  chatInput: $('chatInput'),
  sendBtn: $('sendBtn'),
};

// 유틸 -------------------------------------------
function appendChat({ author = 'system', text, ts = Date.now() }) {
  if (!els.chatBox) return;
  const row = document.createElement('div');
  row.className = 'chat-message';
  const time = new Date(ts).toLocaleTimeString();
  row.innerHTML = `<strong>${author}</strong> <span style="font-size:.8em;color:#aaa">${time}</span><br>${text}`;
  els.chatBox.appendChild(row);
  els.chatBox.scrollTop = els.chatBox.scrollHeight;
}

function logSys(text) {
  appendChat({ author: 'system', text });
  console.log('[SYSTEM]', text);
}

// 장치 준비 --------------------------------------
async function ensureLocal() {
  if (localStream) return localStream;
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
  els.localVideo.srcObject = localStream;
  await els.localVideo.play().catch(() => {});
  return localStream;
}

// PeerConnection 생성 -----------------------------
function createPeer() {
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };
  pc = new RTCPeerConnection(config);

  // 내 트랙 붙이기
  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }

  // 원격 트랙 수신
  pc.ontrack = (e) => {
    const [stream] = e.streams;
    els.remoteVideo.srcObject = stream;
    els.remoteVideo.play().catch(() => {});
  };

  // ICE 후보 전송
  pc.onicecandidate = ({ candidate }) => {
    if (candidate && roomId) {
      socket.emit('ice-candidate', { roomId, candidate });
    }
  };

  // Polite peer 처리용 네고 상태 플래그
  pc.onnegotiationneeded = async () => {
    try {
      isMakingOffer = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { roomId, sdp: pc.localDescription });
    } catch (e) {
      console.error(e);
    } finally {
      isMakingOffer = false;
    }
  };

  return pc;
}

// 방 참여 / 나가기 -------------------------------
async function joinRoom() {
  roomId = (els.roomInput?.value || '').trim();
  if (!roomId) {
    alert('방 코드를 입력하세요 (예: test123)');
    return;
  }
  await ensureLocal();
  if (!pc) createPeer();

  // 서버에 참여 요청
  socket.emit('join', roomId, (ack) => {
    isHost = ack?.host === true;
    logSys(`방(${roomId})에 참가했습니다. 역할: ${isHost ? '방장' : '참가자'}`);
  });
}

function leaveRoom() {
  if (roomId) socket.emit('leave', roomId);
  roomId = '';
  if (pc) {
    pc.getSenders().forEach((s) => s.track && s.track.stop());
    pc.close();
    pc = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (els.localVideo) els.localVideo.srcObject = null;
  if (els.remoteVideo) els.remoteVideo.srcObject = null;
  logSys('방을 나갔습니다.');
}

// 미디어 컨트롤 -----------------------------------
function toggleMute() {
  if (!localStream) return;
  const audio = localStream.getAudioTracks()[0];
  if (!audio) return;
  audio.enabled = !audio.enabled;
  els.muteBtn && (els.muteBtn.textContent = audio.enabled ? '음소거' : '음소거 해제');
}

function toggleCamera() {
  if (!localStream) return;
  const video = localStream.getVideoTracks()[0];
  if (!video) return;
  video.enabled = !video.enabled;
  els.cameraBtn && (els.cameraBtn.textContent = video.enabled ? '카메라 끄기' : '카메라 켜기');
}

async function shareScreen() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender && screenTrack) {
      await sender.replaceTrack(screenTrack);
      logSys('화면 공유 시작');
    }
    screenTrack.onended = async () => {
      // 카메라로 원복
      const camTrack = (await ensureLocal()).getVideoTracks()[0];
      if (sender && camTrack) {
        await sender.replaceTrack(camTrack);
      }
      logSys('화면 공유 종료');
    };
  } catch (e) {
    console.warn('화면공유 취소/실패', e);
  }
}

// 채팅 -------------------------------------------
function sendChat() {
  const text = (els.chatInput?.value || '').trim();
  if (!text || !roomId) return;
  socket.emit('chat', { roomId, text });
  appendChat({ author: 'me', text });
  els.chatInput.value = '';
}

// Socket 이벤트 처리 ------------------------------
socket.on('system', (msg) => appendChat({ author: 'system', ...msg }));

socket.on('chat', (msg) => {
  appendChat({ author: msg.author || 'user', text: msg.text, ts: msg.ts });
});

// SFU/mesh가 아닌 P2P 시그널링
socket.on('offer', async ({ sdp }) => {
  try {
    const offerCollision = (isMakingOffer || pc.signalingState !== 'stable');
    ignoreOffer = !isHost && offerCollision;
    if (ignoreOffer) return;

    await pc.setRemoteDescription(sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { roomId, sdp: pc.localDescription });
  } catch (e) {
    console.error(e);
  }
});

socket.on('answer', async ({ sdp }) => {
  try {
    await pc.setRemoteDescription(sdp);
  } catch (e) {
    console.error(e);
  }
});

socket.on('ice-candidate', async ({ candidate }) => {
  try {
    await pc.addIceCandidate(candidate);
  } catch (e) {
    console.error(e);
  }
});

// 연결/해제 알림(서버가 보냄)
socket.on('joined', ({ members }) => {
  logSys(`참가자 수: ${members}`);
});
socket.on('left', ({ members }) => {
  logSys(`상대가 나갔습니다. 참가자 수: ${members}`);
});

// 초기 바인딩 -------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  // 버튼들
  els.joinBtn && els.joinBtn.addEventListener('click', joinRoom);
  els.leaveBtn && els.leaveBtn.addEventListener('click', leaveRoom);
  els.muteBtn && els.muteBtn.addEventListener('click', toggleMute);
  els.cameraBtn && els.cameraBtn.addEventListener('click', toggleCamera);
  els.shareBtn && els.shareBtn.addEventListener('click', shareScreen);
  els.sendBtn && els.sendBtn.addEventListener('click', sendChat);
  els.chatInput && els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  // 미디어 미리보기
  try {
    await ensureLocal();
  } catch {
    alert('카메라/마이크 권한을 허용해 주세요.');
  }

  // Peer 준비
  createPeer();
});

// 📡 Socket 자동 재접속 설정
// =======================
const socket = io({
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// =======================
// ⚙️ 전역 변수
// =======================
let pc;
let localStream;
let roomId = '';
let makingOffer = false;

// =======================
// 🔧 디바운스 헬퍼
// =======================
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// =======================
// 🎥 로컬 스트림 확보
// =======================
async function ensureLocal() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;
}

// =======================
// 🧠 하드 리커넥트(전체 복구)
// =======================
async function hardReconnect() {
  try {
    console.log('Hard reconnect…');
    try { pc.getSenders().forEach(s => pc.removeTrack(s)); } catch {}
    try { pc.close(); } catch {}
    pc = null;

    await ensureLocal();
    createPeerConnection();

    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    const offer = await pc.createOffer({ iceRestart: true });
    await pc.setLocalDescription(offer);
    socket.emit('offer', { roomId, sdp: pc.localDescription });
  } catch (e) {
    console.error('Hard reconnect failed:', e);
  }
}

// =======================
// 🔄 안전한 재협상
// =======================
const safeRenegotiate = debounce(async () => {
  if (!pc || pc.signalingState === 'closed') return;
  try {
    makingOffer = true;
    const offer = await pc.createOffer({ iceRestart: false });
    await pc.setLocalDescription(offer);
    socket.emit('offer', { roomId, sdp: pc.localDescription });
  } catch (e) {
    console.warn('renegotiate fail:', e);
  } finally {
    makingOffer = false;
  }
}, 400);

// =======================
// 🎬 피어 연결 생성
// =======================
function createPeerConnection() {
  const cfg = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  pc = new RTCPeerConnection(cfg);

  pc.ontrack = (ev) => {
    const [stream] = ev.streams;
    document.getElementById('remoteVideo').srcObject = stream;
  };

  pc.oniceconnectionstatechange = async () => {
    const s = pc.iceConnectionState;
    console.log('ICE connection:', s);

    if (s === 'disconnected' || s === 'failed') {
      try {
        console.log('Try ICE restart…');
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, sdp: pc.localDescription });
      } catch (err) {
        console.warn('ICE restart failed:', err);
      }
    }
  };

  pc.onconnectionstatechange = () => {
    const cs = pc.connectionState;
    console.log('Connection state:', cs);
    if (cs === 'failed') {
      hardReconnect();
    }
  };

  pc.onnegotiationneeded = () => {
    console.log('negotiationneeded');
    safeRenegotiate();
  };

  return pc;
}

// =======================
// 💬 시그널링 이벤트 처리
// =======================
socket.on('offer', async ({ sdp }) => {
  try {
    const desc = new RTCSessionDescription(sdp);
    const polite = true;
    const ignoreOffer = !polite && (makingOffer || pc.signalingState !== 'stable');

    if (ignoreOffer) {
      console.log('Ignore glare offer');
      return;
    }

    await pc.setRemoteDescription(desc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', { roomId, sdp: pc.localDescription });
  } catch (e) {
    console.error('offer handle error:', e);
  }
});

socket.on('answer', async ({ sdp }) => {
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  } catch (e) {
    console.error('answer handle error:', e);
  }
});

socket.on('candidate', async ({ candidate }) => {
  try {
    if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (e) {
    console.error('candidate error:', e);
  }
});

// =======================
// 🔔 서버 헬스체크 (Ping/Pong)
// =======================
socket.on('ping', () => socket.emit('pong'));

// =======================
// 🌙 페이지/탭 관리
// =======================
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    try { document.getElementById('localVideo').play(); } catch {}
    try { document.getElementById('remoteVideo').play(); } catch {}
  }
});

window.addEventListener('beforeunload', () => {
  socket.emit('leave', roomId);
  try { pc.close(); } catch {}
});

// =======================
// 🚀 초기 실행 (예시)
// =======================
async function init() {
  await ensureLocal();
  pc = createPeerConnection();
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
}

init();
