/**
 * Client-side certificate PDF generation using html2canvas + jsPDF.
 * No server-side PDF library required — the certificate template from
 * buildCertificateHTML is rendered in a hidden DOM node, captured to a
 * canvas, then exported as a landscape A4 PDF.
 */

import { buildCertificateHTML, centerCertificateName, CertificateData } from './buildCertificateHTML';

/** Mount the certificate HTML in a hidden container and capture it to a canvas. */
async function captureCanvas(data: CertificateData): Promise<HTMLCanvasElement> {
    const html2canvas = (await import('html2canvas')).default;

    const container = document.createElement('div');
    container.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;width:1200px;height:849px;z-index:-1;background:white;';
    document.body.appendChild(container);
    container.innerHTML = buildCertificateHTML(data);

    // Wait for fonts, then for every element PNG to fully decode.
    try { await document.fonts.ready; } catch { /* fonts API unavailable */ }
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(res => {
            img.onload = () => res();
            img.onerror = () => res(); // don't block on a missing asset
        });
    }));
    await centerCertificateName(container);
    await new Promise(r => setTimeout(r, 250));

    try {
        return await html2canvas(container.firstElementChild as HTMLElement, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#FFFFFF',
            width: 1200,
            height: 849,
            logging: false,
        });
    } finally {
        document.body.removeChild(container);
    }
}

async function canvasToPdf(canvas: HTMLCanvasElement) {
    const jsPDF = (await import('jspdf')).default;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    return pdf;
}

/** Generate and immediately download a single certificate PDF. */
export async function generateCertificatePDF(data: CertificateData & { filename?: string }): Promise<void> {
    const canvas = await captureCanvas(data);
    const pdf = await canvasToPdf(canvas);
    const filename = data.filename || `MYIMUN-Certificate-${data.delegateName.replace(/\s+/g, '-')}.pdf`;
    pdf.save(filename);
}

/** Generate a single certificate PDF and return it as a Blob (for zipping). */
export async function generateCertificatePDFBlob(data: CertificateData): Promise<Blob> {
    const canvas = await captureCanvas(data);
    const pdf = await canvasToPdf(canvas);
    return pdf.output('blob');
}

export interface BulkCertificateEntry extends CertificateData {
    /** Optional per-file name override. */
    filename?: string;
}

/**
 * Generate certificates for many delegates and download them as a single ZIP.
 * onProgress reports (done, total) after each PDF so the UI can show a counter.
 */
export async function bulkDownloadCertificates(
    entries: BulkCertificateEntry[],
    onProgress?: (done: number, total: number) => void,
): Promise<void> {
    const JSZip = (await import('jszip')).default;
    const { saveAs } = await import('file-saver');

    const zip = new JSZip();
    const folder = zip.folder('MYIMUN-Certificates')!;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const blob = await generateCertificatePDFBlob(entry);
        const filename = entry.filename || `MYIMUN-${entry.delegateName.replace(/\s+/g, '-')}.pdf`;
        folder.file(filename, blob);
        onProgress?.(i + 1, entries.length);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `MYIMUN-Certificates-${new Date().toISOString().split('T')[0]}.zip`);
}
