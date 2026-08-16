'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useConference } from '@/context/ConferenceContext';
import { phoneDigits, whatsappHref } from '@/lib/contactLinks';

export function WhatsAppSupportButton() {
    const pathname = usePathname();
    const { conferenceSettings, landingPage, isPublicLoading } = useConference();
    const phone = landingPage.footerData.whatsappPhone || landingPage.footerData.phone;

    if (isPublicLoading || !conferenceSettings.whatsappSupportEnabled || pathname.startsWith('/admin') || !phoneDigits(phone)) {
        return null;
    }

    return (
        <a
            href={whatsappHref(phone, 'Hello MYIMUN Secretariat, I need support.')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact MYIMUN support on WhatsApp"
            title="WhatsApp support"
            style={{
                position: 'fixed', right: 20, bottom: 20, zIndex: 70,
                width: 52, height: 52, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', background: '#16A34A', textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(22,163,74,0.32)',
            }}
        >
            <MessageCircle size={25} strokeWidth={2.2} />
        </a>
    );
}
