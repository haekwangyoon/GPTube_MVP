import { useEffect, useRef, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("READY");
  const [env, setEnv] = useState("unknown");
  const [path, setPath] = useState("/");
  const [now, setNow] = useState("");

  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setEnv(import.meta.env.MODE === "production" ? "Railway Production" : "Local Dev");
    setPath(window.location.pathname || "/");
    const tick = () => setNow(new Date().toLocaleString());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const stopMedia = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
    setMicOn(false);
  };

  const startMedia = async () => {
    setErrorMsg("");
    setStatus("CHECKING...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      setCamOn(hasVideo);
      setMicOn(hasAudio);

      setStatus("MEDIA ON");
    } catch (err) {
      console.error(err);
      setStatus("FAILED");
      setErrorMsg(
        "카메라/마이크 권한이 차단되었거나 장치를 찾지 못했습니다. 브라우저 주소창 좌측 자물쇠(권한)에서 카메라/마이크 허용 후 새로고침 해주세요."
      );
    }
  };

  const toggleVideo = () => {
    const s = streamRef.current;
    if (!s) return;
    const track = s.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const toggleAudio = () => {
    const s = streamRef.current;
    if (!s) return;
    const track = s.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const healthCheck = async () => {
    setErrorMsg("");
    setStatus("HEALTH...");
    try {
      const r = await fetch("/health", { cache: "no-store" });
      if (!r.ok) throw new Error("health not ok");
      const j = await r.json();
      setStatus(j?.ok ? "HEALTHY" : "UNHEALTHY");
    } catch (e) {
      setStatus("UNHEALTHY");
      setErrorMsg("'/health' 응답이 없습니다. server.js에 /health 라우트가 있는지 확인하세요.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>GPTube MVP</div>
            <div style={styles.subtitle}>준비단계 통합 서버(Express) + UI(React/Vite)</div>
          </div>
          <div style={styles.badge}>{status}</div>
        </div>

        <div style={styles.row}>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>시간</div>
            <div style={styles.kpiValue}>{now}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>환경</div>
            <div style={styles.kpiValue}>{env}</div>
          </div>
          <div style={styles.kpi}>
            <div style={styles.kpiLabel}>경로</div>
            <div style={styles.kpiValue}>{path} (React dist served)</div>
          </div>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={healthCheck}>서버 상태 확인 (/health)</button>

          {!streamRef.current ? (
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={startMedia}>
              🎥 카메라 테스트 시작
            </button>
          ) : (
            <>
              <button style={styles.btn} onClick={toggleVideo}>
                {camOn ? "📷 카메라 끄기" : "📷 카메라 켜기"}
              </button>
              <button style={styles.btn} onClick={toggleAudio}>
                {micOn ? "🎙 마이크 끄기" : "🎙 마이크 켜기"}
              </button>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={stopMedia}>
                ⛔ 미디어 종료
              </button>
            </>
          )}
        </div>

        <div style={styles.videoWrap}>
          <div style={styles.videoTitle}>Local Preview</div>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          <div style={styles.hint}>
            * 브라우저 권한이 허용되면 내 카메라 화면이 여기에 보여야 합니다.
          </div>
        </div>

        {errorMsg && <div style={styles.err}>{errorMsg}</div>}

        <div style={styles.logBox}>
          <div style={styles.logItem}>✅ Railway 배포 확인</div>
          <div style={styles.logItem}>✅ Server: Express 실행</div>
          <div style={styles.logItem}>✅ Client: Vite build 준비</div>
          <div style={styles.logItem}>⬜ 다음: WebRTC(시그널링) 연결</div>
        </div>

        <div style={styles.footer}>
          다음 단계: WebRTC(시그널링/콜/권한) → SFU 연결 → 스트리밍 UI 확장
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "linear-gradient(180deg, #0b1b44 0%, #07102a 100%)",
    color: "#eaf0ff",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", Arial',
  },
  card: {
    width: "min(980px, 96vw)",
    borderRadius: 18,
    padding: 22,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: 0.2 },
  subtitle: { marginTop: 4, opacity: 0.85 },
  badge: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(120,160,255,0.18)",
    border: "1px solid rgba(120,160,255,0.35)",
    fontWeight: 700,
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 },
  kpi: {
    padding: 14,
    borderRadius: 14,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  kpiLabel: { fontSize: 12, opacity: 0.75 },
  kpiValue: { marginTop: 6, fontSize: 16, fontWeight: 700 },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#eaf0ff",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnPrimary: {
    background: "rgba(90,140,255,0.35)",
    border: "1px solid rgba(90,140,255,0.6)",
  },
  btnDanger: {
    background: "rgba(255,80,100,0.22)",
    border: "1px solid rgba(255,80,100,0.45)",
  },
  videoWrap: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  videoTitle: { fontWeight: 800, marginBottom: 10 },
  video: {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  hint: { marginTop: 8, fontSize: 12, opacity: 0.8 },
  err: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,80,100,0.18)",
    border: "1px solid rgba(255,80,100,0.35)",
    color: "#ffd7dc",
    fontWeight: 700,
  },
  logBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  logItem: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 8,
    fontWeight: 700,
  },
  footer: { marginTop: 10, fontSize: 12, opacity: 0.75 },
};
