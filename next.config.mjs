/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only fail build if there are actual TypeScript errors, not ESLint
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

