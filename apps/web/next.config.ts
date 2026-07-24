import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-only today, but declares the workspace package so any future runtime
  // exports from @dnd/shared are transpiled by Next.
  transpilePackages: ["@dnd/shared"],
};

export default nextConfig;
