export function phoneDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export function whatsappHref(phone: string, message?: string): string {
    const digits = phoneDigits(phone);
    if (!digits) return '#';
    const text = message?.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
    return `https://wa.me/${digits}${text}`;
}

export function telHref(phone: string): string {
    const digits = phoneDigits(phone);
    return digits ? `tel:+${digits}` : '#';
}
