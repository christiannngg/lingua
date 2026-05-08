export default function ChatLoading() {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: "260px",
          borderRight: "1px solid #f1f5f9",
          backgroundColor: "#FFFFFF",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: "1.25rem",
            width: "60%",
            borderRadius: "0.375rem",
            backgroundColor: "#f1f5f9",
            marginBottom: "0.75rem",
          }}
        />
        {[80, 65, 72, 55, 68].map((width, i) => (
          <div
            key={i}
            style={{
              height: "2.25rem",
              width: `${width}%`,
              borderRadius: "0.5rem",
              backgroundColor: "#f8f4ff",
            }}
          />
        ))}
      </div>

      {/* Chat area skeleton */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ height: "3rem", width: "55%", borderRadius: "1rem", backgroundColor: "#f1f5f9" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ height: "2.5rem", width: "40%", borderRadius: "1rem", backgroundColor: "#f3e8ff" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ height: "4rem", width: "65%", borderRadius: "1rem", backgroundColor: "#f1f5f9" }} />
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ height: "2.75rem", borderRadius: "0.75rem", backgroundColor: "#f8f9fc" }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        div[style] { animation: pulse 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}