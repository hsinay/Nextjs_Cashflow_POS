const imageKitEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT

const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'ik.imagekit.io',
  },
]

if (imageKitEndpoint) {
  try {
    const hostname = new URL(imageKitEndpoint).hostname
    remotePatterns.push({
      protocol: 'https',
      hostname,
    })
  } catch (_error) {
    // Ignore malformed env values and fall back to the default ImageKit host.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
