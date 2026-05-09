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

      </div>      
    </div>
  );
}