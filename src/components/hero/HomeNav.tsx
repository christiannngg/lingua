import Link from "next/link";
import LinguaLogo from "../ui/LinguaLogo";

export default function HomeNav() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        top: 0,
        zIndex: 10,
        width: "100%",
        background: "rgba(247, 247, 255, 0.75)",
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "84px",
          maxWidth: "1200px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <LinguaLogo size={48} fontSize="24px" />

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/sign-in"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              background: "#CA7DF9",
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