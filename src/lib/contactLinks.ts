export function phoneDigits(value: string): string {
    return value.replace(/\D/g, '');
}

function whatsappDigits(value: string): string {
    const digits = phoneDigits(value);
    if (digits.startsWith('00')) return digits.slice(2);
    if (digits.startsWith('0')) return `212${digits.replace(/^0+/, '')}`;
    return digits;
}

export function whatsappHref(phone: string, message?: string): string {
    const digits = whatsappDigits(phone);
    if (!digits) return '#';
    const text = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
    return `https://wa.me/${digits}${text}`;
}

export function telHref(phone: string): string {
    const digits = phoneDigits(phone);
    return digits ? `tel:+${digits}` : '#';
}
