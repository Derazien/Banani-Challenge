/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning instead of error
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
