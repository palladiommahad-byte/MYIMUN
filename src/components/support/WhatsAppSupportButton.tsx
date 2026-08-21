'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useConference } from '@/context/ConferenceContext';
import { phoneDigits, whatsappHref } from '@/lib/contactLinks';

export function WhatsAppSupportButton() {
    const pathname = usePathname();
    const { conferenceSettings, isPublicLoading } = useConference();
    const phone = conferenceSettings.whatsappSupportPhone;

    if (isPublicLoading || !conferenceSettings.whatsappSupportEnabled || pathname.startsWith('/admin') || !phoneDigits(phone)) {
        return null;
    }

    return (
        <a
            className="myimun-whatsapp-sticky"
            href={whatsappHref(phone, 'Hello MYIMUN Secretariat, I need support.')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact MYIMUN support on WhatsApp"
            title="WhatsApp support"
        >
            <MessageCircle size={25} strokeWidth={2.2} />
        </a>
    );
}
