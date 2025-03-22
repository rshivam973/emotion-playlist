import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['i.ytimg.com'],
  },
  env: {
    NEXT_PUBLIC_HUGGINGFACE_API_TOKEN: process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
};

export default nextConfig;
