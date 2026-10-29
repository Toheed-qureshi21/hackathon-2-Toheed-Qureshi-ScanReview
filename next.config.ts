import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: false,
      },
      {
        source: "/auth",
        has: [{ type: "query", key: "signup" }],
        destination: "/auth/signup",
        permanent: false,
      },
      {
        source: "/auth",
        has: [{ type: "query", key: "login" }],
        destination: "/auth/login",
        permanent: false,
      },
      {
        source: "/auth",
        destination: "/auth/login",
        permanent: false,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
