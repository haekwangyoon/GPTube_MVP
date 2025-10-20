// 동일 도메인 서버로 연결
const socket = io(window.location.origin, { transports: ["websocket", "polling"] });

const $ = (id) => document.getElementById(id);
const log = (txt, cls = "") => {
  const div = document.createElement("div");
  if (cls) div.className = cls;
  div.textContent = txt;
  $("log").appendChild(div);
  $("log").scrollTop = $("log").scrollHeight;
};

// 서버 연결 이벤트
socket.on("connect", () => log(`연결됨: ${socket.id}`, "sys"));
socket.on("disconnect", () => log("연결 종료", "sys"));

// 서버에서 오는 시스템 메시지
socket.on("system", (m) => log(`[시스템] ${m.text}`, "sys"));

// 채팅 메시지 받기
socket.on("chat", (m) => log(`${m.from}: ${m.text}`));

// 참가 버튼
$("joinBtn").onclick = () => {
  const nickname = $("nickname").value.trim() || `게스트-${socket.id.slice(0,4)}`;
  const roomId = $("roomId").value.trim() || "room-1";
  socket.emit("join", roomId, nickname);
  log(`방 "${roomId}" 참가 시도…`, "sys");
};

// 전송 버튼
$("sendBtn").onclick = () => {
  const text = $("msg").value.trim();
  if (!text) return;
  socket.emit("chat", { text });
  $("msg").value = "";
};
