import type { NextConfig } from 'next';

// Content-Security-Policy. Only enabled in production — in dev, Turbopack/HMR needs
// `unsafe-eval` and a websocket connection that a strict policy would break.
//
// `unsafe-inline` is kept for script/style because Next injects inline bootstrap
// scripts and the UI uses inline `style={{}}` extensively; removing it requires a
// nonce-based middleware (a worthwhile follow-up, not a drop-in change). Even so,
// this still locks down external script/connect origins, framing, plugins and base-uri.
const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    // Google Fonts stylesheets are pulled from fonts.googleapis.com (see app/layout.tsx + globals.css).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos https://www.transparenttextures.com https://flagcdn.com",
    // Google Fonts files are served from fonts.gstatic.com.
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');

const securityHeaders = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ...(process.env.NODE_ENV === 'production'
        ? [{ key: 'Content-Security-Policy', value: csp }]
        : []),
];

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
    // Baseline security headers applied to every response (CSP added in production only).
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }];
    },
};

export default nextConfig;
