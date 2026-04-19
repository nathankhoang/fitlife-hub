import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["satori", "@resvg/resvg-js", "sharp"],
  images: {
    // Category hero strips are served as SVG from /public/images/categories/*.svg.
    // We author and own these files, so the usual SVG security risk doesn't apply.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
