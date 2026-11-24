/** Format a YYYY-MM-DD refund date for display, e.g. "Monday, 7 December 2026". */
export function formatRefundDate(value: string | null | undefined) {
    if (!value) return '';
    const d = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
