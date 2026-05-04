"use client";

import Image from "next/image";
import Link from "next/link";
import LinguaLogoImage from "../../../public/logo-no-bg.png";

interface AuthCardProps {
  heading: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
  children: React.ReactNode;
}

export function AuthCard({
  heading,
  footerText,
  footerLinkLabel,
  footerLinkHref,
  children,
}: AuthCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#fff",
        borderRadius: 20,
        border: "1px solid rgba(202,125,249,0.18)",
        padding: "32px 32px 28px",
        width: "100%",
        maxWidth: 440,
      }}
    >
      {/* Logo badge */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 5,
        }}
      >
        <Image src={LinguaLogoImage} alt="Lingua Logo" />
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#020122",
          letterSpacing: "-0.5px",
          margin: "0 0 40px",
          textAlign: "center",
        }}
      >
        {heading}
      </h1>

      {/* Form content */}
      <div style={{ width: "100%" }}>{children}</div>

      {/* Footer link */}
      <p style={{ marginTop: 24, fontSize: 14, color: "#6b6a84", textAlign: "center" }}>
        {footerText}{" "}
        <Link
          href={footerLinkHref as never}
          style={{ color: "#CA7DF9", fontWeight: 700, textDecoration: "none" }}
        >
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}