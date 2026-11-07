import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Reuse a page the user visited in the last 30s instead of refetching it
    // on every click (Next 15+ default is 0). Server actions that call
    // revalidatePath still clear this, so edits show up immediately.
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
