import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Node modules used by the social pipeline — Turbopack can't bundle
  // their platform-specific bindings, so they must load at runtime.
  serverExternalPackages: ["satori", "@resvg/resvg-js", "sharp"],
};

export default nextConfig;
