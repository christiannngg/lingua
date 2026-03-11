/**
 * Loading skeleton for the dashboard layout.
 *
 * Shown immediately while the Server Component fetches getUserLanguages
 * and any page-level data. Prevents a blank screen during navigation
 * within the dashboard, improving LCP.
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Nav skeleton */}
      <div
        className="flex flex-col gap-3 p-4"
        style={{
          width: "220px",
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--card)",
          flexShrink: 0,
        }}
      >
        {/* Logo / brand */}
        <div
          className="mb-4"
          style={{
            height: "1.5rem",
            width: "70%",
            borderRadius: "0.375rem",
            backgroundColor: "var(--muted)",
          }}
        />
        {/* Nav items */}
        {[55, 70, 60, 65].map((width, i) => (
          <div
            key={i}
            style={{
              height: "2.25rem",
              width: `${width}%`,
              borderRadius: "0.5rem",
              backgroundColor: "var(--muted)",
            }}
          />
        ))}
      </div>

      {/* Page content skeleton */}
      <div className="flex-1 overflow-auto p-6" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Page title */}
        <div
          style={{
            height: "1.75rem",
            width: "30%",
            borderRadius: "0.375rem",
            backgroundColor: "var(--muted)",
          }}
        />
        {/* Content cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "7rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--muted)",
              }}
            />
          ))}
        </div>
        {/* Body block */}
        <div
          style={{
            height: "12rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--muted)",
          }}
        />
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