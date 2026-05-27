/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@skipq/api-client", "@skipq/shared-types"],
};

export default nextConfig;
