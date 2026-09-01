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
    // En dev, Next sirve los bundles con `eval` (HMR / react-refresh) y habla
    // por WebSocket. Sin estas dos excepciones el CSP mata todo el JS de
    // cliente y la página queda sin hidratar: nada interactivo responde.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : "",
      "https://challenges.cloudflare.com",
    ].filter(Boolean).join(" ");
    const connectSrc = [
      "connect-src 'self' https://omwzsphshgrcbxdcghli.supabase.co https://challenges.cloudflare.com",
      isDev ? "ws://localhost:* http://localhost:*" : "",
    ].filter(Boolean).join(" ");

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: https://omwzsphshgrcbxdcghli.supabase.co",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      connectSrc,
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
