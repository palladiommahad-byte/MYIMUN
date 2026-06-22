import { buildAcceptanceLetterHTML, LetterData } from './buildAcceptanceLetterHTML';

async function captureLetterCanvas(data: LetterData): Promise<HTMLCanvasElement> {
    const html2canvas = (await import('html2canvas')).default;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;z-index:-1;background:white;';
    document.body.appendChild(container);
    container.innerHTML = buildAcceptanceLetterHTML(data);

    try { await document.fonts.ready; } catch {}
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); });
    }));
    await new Promise(r => setTimeout(r, 200));

    try {
        return await html2canvas(container.firstElementChild as HTMLElement, {
            scale: 2, useCORS: true, allowTaint: false,
            backgroundColor: '#FFFFFF', width: 794, height: 1123, logging: false,
        });
    } finally {
        document.body.removeChild(container);
    }
}

export async function generateAcceptanceLetterPDF(data: LetterData & { filename?: string }): Promise<void> {
    const canvas = await captureLetterCanvas(data);
    const jsPDF = (await import('jspdf')).default;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save(data.filename || `MYIMUN-Acceptance-${data.delegateName.replace(/\s+/g, '-')}.pdf`);
}
