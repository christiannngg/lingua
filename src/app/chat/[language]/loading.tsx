/**
 * Loading skeleton for the chat page.
 *
 * Shown immediately while the Server Component fetches auth + DB data.
 * Prevents a blank screen during the session start data fetch, improving
 * LCP and CLS scores.
 */
export default function ChatLoading() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#0d0d1a",
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: "260px",
          borderRight: "1px solid #2d2d44",
          backgroundColor: "#13131f",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            height: "1.25rem",
            width: "60%",
            borderRadius: "0.375rem",
            backgroundColor: "#2d2d44",
            marginBottom: "0.75rem",
          }}
        />
        {/* Conversation list items */}
        {[80, 65, 72, 55, 68].map((width, i) => (
          <div
            key={i}
            style={{
              height: "2.25rem",
              width: `${width}%`,
              borderRadius: "0.5rem",
              backgroundColor: "#1e1e2e",
            }}
          />
        ))}
      </div>

      {/* Chat area skeleton */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #2d2d44",
            backgroundColor: "#13131f",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "9999px",
              backgroundColor: "#2d2d44",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <div
              style={{ height: "0.875rem", width: "5rem", borderRadius: "0.25rem", backgroundColor: "#2d2d44" }}
            />
            <div
              style={{ height: "0.75rem", width: "7rem", borderRadius: "0.25rem", backgroundColor: "#1e1e2e" }}
            />
          </div>
        </div>

        {/* Message area — alternating assistant/user bubbles */}
        <div
          style={{
            flex: 1,
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Assistant bubble */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                height: "3rem",
                width: "55%",
                borderRadius: "1rem",
                backgroundColor: "#1e1e2e",
              }}
            />
          </div>
          {/* User bubble */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                height: "2.5rem",
                width: "40%",
                borderRadius: "1rem",
                backgroundColor: "#2d2d44",
              }}
            />
          </div>
          {/* Assistant bubble */}
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                height: "4rem",
                width: "65%",
                borderRadius: "1rem",
                backgroundColor: "#1e1e2e",
              }}
            />
          </div>
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid #2d2d44",
            backgroundColor: "#13131f",
          }}
        >
          <div
            style={{
              height: "2.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "#1e1e2e",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        div[style] { animation: pulse 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}