import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',        // build to static files in out/
  trailingSlash: true,     // /student/register/ -> student/register/index.html
  images: { unoptimized: true },
};

export default nextConfig;
