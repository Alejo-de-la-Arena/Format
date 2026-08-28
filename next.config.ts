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
};

export default nextConfig;
