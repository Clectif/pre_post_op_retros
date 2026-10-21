import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // genera .next/standalone: servidor mínimo para la imagen de Docker (Cloud Run)
  output: "standalone",
};

export default nextConfig;
