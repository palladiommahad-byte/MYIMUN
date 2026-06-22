import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import GlobalBackground from '@/components/layout/GlobalBackground';

export const metadata: Metadata = {
    title: 'MYIMUN 2025 | Moroccan Youth International Model United Nations',
    description: 'Join 500+ delegates from around the world at MYIMUN Marrakech 2025 — the premier Model United Nations conference in Morocco.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                {/* Certificate fonts */}
                <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased" style={{ backgroundColor: '#FFFFFF', color: '#111827' }}>
                <Providers>
                    <GlobalBackground />
                    <div className="relative z-10">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
