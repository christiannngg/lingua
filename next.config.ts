import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Enable React strict mode for catching subtle bugs early
  reactStrictMode: true,

  // TypeScript errors fail the build — no silent failures
  typescript: {
    ignoreBuildErrors: false,
  },

  typedRoutes: false,

  // ── HTTP Security Headers ────────────────────────────────────────────────
  // Applied to all routes. Mitigates clickjacking, MIME sniffing, referrer
  // leakage, and inline script injection without affecting app functionality.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents the page from being embedded in an iframe on another
          // origin — blocks clickjacking attacks entirely.
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          // Stops browsers from MIME-sniffing a response away from the
          // declared Content-Type — prevents certain injection attacks.
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Controls how much referrer information is included with requests.
          // strict-origin-when-cross-origin sends the full URL for same-origin
          // requests but only the origin for cross-origin — no path leakage.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Restricts access to browser features not used by this app.
          // Prevents a compromised dependency from silently accessing
          // camera, microphone, or geolocation.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          // Content Security Policy — defense-in-depth against XSS.
          // 
          // Directives explained:
          //   default-src 'self'          — only load resources from our own origin by default
          //   script-src 'self' 'unsafe-inline' 'unsafe-eval'
          //                               — Next.js requires unsafe-inline (inline scripts in
          //                                 _app) and unsafe-eval (React dev mode + some
          //                                 libraries). Tighten with nonces in a future pass.
          //   style-src 'self' 'unsafe-inline'
          //                               — Tailwind CSS requires inline styles
          //   img-src 'self' data: blob:  — allows data URIs and blob URLs for images
          //   font-src 'self'             — fonts served from our own origin only
          //   connect-src 'self' https:   — API calls to our own origin + any HTTPS endpoint
          //                                 (Anthropic API, Upstash, Voyage AI, Railway)
          //   frame-ancestors 'none'      — belt-and-suspenders with X-Frame-Options
          //   base-uri 'self'             — prevents base tag injection attacks
          //   form-action 'self'          — form submissions only to our own origin
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;