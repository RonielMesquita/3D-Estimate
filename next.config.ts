import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in production — biggest memory saver during build
  productionBrowserSourceMaps: false,
  experimental: {
    // Next.js 15 built-in webpack memory optimizations
    webpackMemoryOptimizations: true,
  },
  webpack(config) {
    // Prevent webpack from processing binary 3D model files
    config.module.rules.push({
      test: /\.(glb|gltf|fbx|obj)$/,
      type: "asset/resource",
      generator: { emit: false },
    })
    return config
  },
};

export default nextConfig;
