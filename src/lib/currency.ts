export const CURRENCY_OPTIONS = [
    { code: 'USD', label: 'USD - US Dollar' },
    { code: 'MAD', label: 'MAD - Moroccan Dirham' },
];

export function normalizeCurrency(currency: string | null | undefined): string {
    return (currency || 'USD').trim().toUpperCase();
}

export function currencyOptionsWithCurrent(currency: string | null | undefined) {
    const normalized = normalizeCurrency(currency);
    return CURRENCY_OPTIONS.some(option => option.code === normalized)
        ? CURRENCY_OPTIONS
        : [...CURRENCY_OPTIONS, { code: normalized, label: `${normalized} - Custom` }];
}

export function formatMoney(amount: number, currency: string | null | undefined): string {
    const value = Number(amount) || 0;
    const code = normalizeCurrency(currency);
    return code === 'USD' ? `$${value.toFixed(2)}` : `${code} ${value.toFixed(2)}`;
}
