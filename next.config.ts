import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in production — biggest memory saver during build
  productionBrowserSourceMaps: false,
  experimental: {
    // Next.js 15 built-in webpack memory optimizations
    webpackMemoryOptimizations: true,
  },
  webpack(config, { isServer }) {
    // Limit parallel workers to reduce peak memory during build
    config.parallelism = 1

    // Prevent webpack from processing binary 3D model files
    config.module.rules.push({
      test: /\.(glb|gltf|fbx|obj)$/,
      type: "asset/resource",
      generator: { emit: false },
    })

    // Reduce chunk size to avoid memory spikes
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxSize: 200000,
        },
      }
    }

    return config
  },
};

export default nextConfig;
