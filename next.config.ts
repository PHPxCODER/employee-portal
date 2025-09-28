import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Keep ldapjs as a runtime Node module, don't bundle it
      config.externals.push("ldapjs");
    }
    return config;
  },
};

export default nextConfig;
