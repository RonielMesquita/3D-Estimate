import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
