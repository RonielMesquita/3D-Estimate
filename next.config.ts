import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  webpack(config, { isServer, dev }) {
    config.parallelism = 1

    config.module.rules.push({
      test: /\.(glb|gltf|fbx|obj)$/,
      type: "asset/resource",
      generator: { emit: false },
    })

    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxSize: 500000,
        },
      }
    }

    return config
  },
};

export default nextConfig;
