import Link from "next/link";
import LinguaLogo from "../ui/LinguaLogo";

const GITHUB_URL = "https://github.com/christiannngg";
const LINKEDIN_URL = "https://www.linkedin.com/in/christian-lee-gonzalez/";
const YOUTUBE_URL = "https://youtube.com";
const CONTACT_EMAIL = "mailto:christianleegonzalez9@gmail.com";

export default function HomeFooter() {
  return (
    <footer
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        fontFamily: "'DIN Round Pro', 'DINRoundPro', system-ui, sans-serif",
        background: "#ffffff"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          padding: "28px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <LinguaLogo size={26} fontSize={18} />
          <span style={{ fontSize: "13px", color: "#9896b0", marginLeft: "2px" }}>
            © {new Date().getFullYear()} · All rights reserved
          </span>
        </div>

        {/* Right: icon links */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

          {/* GitHub — dark background, white icon */}
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            style={{ ...iconLinkStyle, backgroundColor: "#24292e", borderColor: "#24292e" }}
          >
            <GitHubIcon />
          </Link>

          {/* LinkedIn — brand blue */}
          <Link
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            style={{ ...iconLinkStyle, backgroundColor: "#0A66C2", borderColor: "#0A66C2" }}
          >
            <LinkedInIcon />
          </Link>

          {/* YouTube — brand red */}
          <Link
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Demo video on YouTube"
            style={{ ...iconLinkStyle, backgroundColor: "#FF0000", borderColor: "#FF0000" }}
          >
            <YouTubeIcon />
          </Link>

          {/* Email — neutral */}
          <Link
            href={CONTACT_EMAIL}
            aria-label="Send email"
            style={{ ...iconLinkStyle }}
          >
            <EmailIcon />
          </Link>

        </div>
      </div>
    </footer>
  );
}

// Shared icon button base style

const iconLinkStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "8px",
  border: "1px solid rgba(2, 1, 34, 0.1)",
  backgroundColor: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  textDecoration: "none",
  flexShrink: 0,
  transition: "opacity 0.15s",
};

// SVG icons 

function GitHubIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9896b0"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}