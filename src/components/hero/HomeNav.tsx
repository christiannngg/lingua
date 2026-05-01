import Link from "next/link";

export default function HomeNav() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "84px",
          maxWidth: "1200px",
          background: "#F7F7FF",
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#CA7DF9",
              letterSpacing: "-0.3px",
            }}
          >
            Lingua
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/sign-in"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#CA7DF9",
              background: "none",
              border: "1px solid rgba(2,1,34,0.12)",
              padding: "6px 18px",
              borderRadius: "20px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Sign in
          </Link>
        </div>
      </nav>
    </div>
  );
}
