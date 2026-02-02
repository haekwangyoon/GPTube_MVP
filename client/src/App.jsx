export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>GPTube MVP</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        서버는 Railway에서 실행 중이고, 이제 클라이언트(UI)를 붙이는 단계입니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>📡 연결 상태</h3>
          <p style={{ marginBottom: 0 }}>Backend: OK</p>
          <p style={{ marginBottom: 0 }}>Frontend: 준비중</p>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>🎥 다음 목표</h3>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>UI 배포</li>
            <li>서버에서 UI 제공(또는 별도 서비스)</li>
            <li>WebRTC 화면/카메라 단계로 확장</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
