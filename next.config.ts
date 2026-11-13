import type { NextConfig } from "next";

// Static export for GitHub Pages — no server runtime available there.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
