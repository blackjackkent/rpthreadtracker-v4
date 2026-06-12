import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["react-multivalue-text-input"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
