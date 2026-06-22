'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === '/';

    return (
        <>
            <Navbar />
            {/* Home's hero goes full-bleed under the fixed transparent nav; every other page needs the offset. */}
            <main style={{ paddingTop: isHome ? 0 : 64 }}>{children}</main>
            <Footer />
        </>
    );
}
