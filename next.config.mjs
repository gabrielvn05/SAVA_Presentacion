/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    },
    serverComponentsExternalPackages: ["pdfkit"]
  },
  webpack: (config) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({
      module: /@supabase\/realtime-js/,
      message: /Critical dependency: the request of a dependency is an expression/
    });
    return config;
  }
};

export default nextConfig;
