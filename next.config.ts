import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // pdfjs-dist v5 optionally requires the `canvas` npm package for Node.js
    // server-side rendering. Since we only use it in the browser (inside
    // useEffect), we alias it to `false` so webpack does not try to bundle it.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
