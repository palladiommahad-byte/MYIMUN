/** Shared HTML helpers for the certificate / acceptance-letter templates. */

/** Escape user-supplied text before interpolating it into an HTML string. */
export function escapeHtml(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Title-case a name: "ayoub koubba" → "Ayoub Koubba". */
export function toTitleCase(name: string): string {
    return String(name || '')
        .toLowerCase()
        .replace(/\b[\p{L}]/gu, ch => ch.toUpperCase());
}
