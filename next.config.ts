import type { NextConfig } from "next";

// Static frontend only: `next build` emits a plain HTML/CSS/JS site in /out.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
