import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Self-contained server bundle for Docker/VPS deploys.
    output: 'standalone',
    // Keep Prisma out of the bundler so its query engine resolves at runtime.
    serverExternalPackages: ['@prisma/client', '.prisma/client', 'bcryptjs'],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'picsum.photos' },
            { protocol: 'https', hostname: 'www.transparenttextures.com' },
        ],
    },
};

export default nextConfig;
