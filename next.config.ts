import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/driver/register",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
