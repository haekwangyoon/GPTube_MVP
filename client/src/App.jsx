import React, { useMemo, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("READY");
  const [log, setLog] = useState([
    "✅ Railway 배포 확인",
    "✅ Server: Express 실행",
    "✅ Client: Vite build 준비",
    "⬜ 다음: WebRTC(SFU/시그널링) 연결"
  ]);

  const now = useMemo(() => new Date().toLocaleString("ko-KR"), []);

  const runCheck = async () => {
    setStatus("CHECKING...");
    try {
      const res = await fetch("/health");
      if (!res.ok) throw new Error("health check failed");
      setStatus("ONLINE ✅");
      setLog((prev) => ["✅ /health 응답 OK", ...prev]);
    } catch (e) {
      setStatus("OFFLINE ❌");
      setLog((prev) => ["❌ /health 실패: 서버/라우팅 점검 필요", ...prev]);
    }
  };

  const reset = () => {
    setStatus("READY");
    setLog([
      "✅ Railway 배포 확인",
      "✅ Server: Express 실행",
      "✅ Client: Vite build 준비",
      "⬜ 다음: WebRTC(SFU/시그널링) 연결"
    ]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>GPTube MVP</div>
            <div style={styles.sub}>준비단계 통합 서버(Express) + UI(React/Vite)</div>
          </div>
          <div style={styles.badge}>{status}</div>
        </div>

        <div style={styles.row}>
          <div style={styles.kv}>
            <div style={styles.k}>시간</div>
            <div style={styles.v}>{now}</div>
          </div>
          <div style={styles.kv}>
            <div style={styles.k}>환경</div>
            <div style={styles.v}>Railway Production</div>
          </div>
          <div style={styles.kv}>
            <div style={styles.k}>경로</div>
            <div style={styles.v}>/ (React dist served)</div>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.btn} onClick={runCheck}>
            서버 상태 확인 (/health)
          </button>
          <button style={styles.btn2} onClick={reset}>
            리셋
          </button>
        </div>

        <div style={styles.sectionTitle}>운영 로그</div>
        <div style={styles.logBox}>
          {log.map((x, i) => (
            <div key={i} style={styles.logItem}>
              {x}
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          다음 단계: WebRTC(시그널링/룸/권한) → SFU 연결 → 스트리밍 UI 확장
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
    background: "#0b1020",
    padding: 24
  },
  card: {
    width: "min(920px, 100%)",
    background: "#111a33",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    color: "white"
  },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: 0.2 },
  sub: { opacity: 0.75, marginTop: 4 },
  badge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(0, 200, 255, 0.15)",
    border: "1px solid rgba(0, 200, 255, 0.35)",
    fontWeight: 700
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 14
  },
  kv: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12
  },
  k: { opacity: 0.7, fontSize: 12 },
  v: { marginTop: 6, fontWeight: 700 },
  actions: { display: "flex", gap: 10, marginTop: 14 },
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
  },
  btn2: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    opacity: 0.9
  },
  sectionTitle: { marginTop: 18, fontWeight: 800, opacity: 0.9 },
  logBox: {
    marginTop: 10,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    maxHeight: 220,
    overflow: "auto"
  },
  logItem: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 8,
    fontSize: 14
  },
  footer: { marginTop: 14, opacity: 0.7, fontSize: 13 }
};
