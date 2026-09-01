import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FORMAT_QA_DIST || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "omwzsphshgrcbxdcghli.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: https://omwzsphshgrcbxdcghli.supabase.co",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "connect-src 'self' https://omwzsphshgrcbxdcghli.supabase.co https://challenges.cloudflare.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com",
      "upgrade-insecure-requests",
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        // Compatibilidad con navegadores que todavía no aplican frame-ancestors.
        // Protege este sitio de ser embebido; no limita los iframes que el sitio carga.
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
      ],
    }];
  },
};

export default nextConfig;
