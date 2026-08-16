import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import GlobalBackground from '@/components/layout/GlobalBackground';
import { WhatsAppSupportButton } from '@/components/support/WhatsAppSupportButton';

export const metadata: Metadata = {
    title: 'MYIMUN | Moroccan Youth International Model United Nations',
    description: 'Join delegates from around the world at Morocco\'s international Model United Nations conference.',
    icons: {
        icon: '/assets/MYIMUN-BLUE-LOGO-VERTICAL.png',
        shortcut: '/assets/MYIMUN-BLUE-LOGO-VERTICAL.png',
        apple: '/assets/MYIMUN-BLUE-LOGO-VERTICAL.png',
    },
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
                    <WhatsAppSupportButton />
                </Providers>
            </body>
        </html>
    );
}
