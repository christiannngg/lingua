import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
   // Enable React strict mode for catching subtle bugs early
  reactStrictMode: true,

  // TypeScript errors fail the build — no silent failures
  typescript: {
    ignoreBuildErrors: false,
  },

  typedRoutes: false
};

export default nextConfig;
