const PAGE_WIDTH = 794;  // A4 at 96 dpi
const PAGE_HEIGHT = 1123;
const MARGIN = 44;
const SCALE = 2;

/** Save a rendered contract (the TermsContract article) as a multi-page A4 PDF.
    The article is cloned into an off-screen, fixed-width container so the PDF
    always uses the desktop layout, and pages break between `[data-pdf-block]`
    elements so sections are not split mid-line where avoidable. */
export async function downloadContractPdf(source: HTMLElement, filename: string): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const holder = document.createElement('div');
    holder.style.cssText = `position:fixed;top:0;left:-20000px;width:${PAGE_WIDTH}px;background:#FFFFFF;z-index:-1;`;
    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.padding = '0 56px';
    clone.style.width = `${PAGE_WIDTH}px`;
    clone.style.boxSizing = 'border-box';
    holder.appendChild(clone);
    document.body.appendChild(holder);

    try {
        try { await document.fonts.ready; } catch {}
        await Promise.all(Array.from(clone.querySelectorAll('img')).map(img =>
            img.complete && img.naturalWidth > 0
                ? Promise.resolve()
                : new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); }),
        ));

        // Work out page slices that end on block boundaries.
        const origin = clone.getBoundingClientRect().top;
        const blocks = Array.from(clone.querySelectorAll<HTMLElement>('[data-pdf-block]')).map(el => {
            const rect = el.getBoundingClientRect();
            return { top: rect.top - origin, bottom: rect.bottom - origin };
        });
        const total = clone.scrollHeight;
        const usable = PAGE_HEIGHT - MARGIN * 2;
        const pages: Array<[number, number]> = [];
        let start = 0;
        for (const block of blocks) {
            if (block.bottom - start <= usable) continue;
            const cut = block.top > start + 1 ? block.top : start + usable;
            pages.push([start, cut]);
            start = cut;
            // A single block taller than a page is sliced where it must be.
            while (block.bottom - start > usable) { pages.push([start, start + usable]); start += usable; }
        }
        if (total - start > 1) pages.push([start, total]);

        const canvas = await html2canvas(clone, {
            scale: SCALE, useCORS: true, backgroundColor: '#FFFFFF', logging: false,
            width: PAGE_WIDTH, windowWidth: PAGE_WIDTH,
        });

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pages.forEach(([from, to], index) => {
            const page = document.createElement('canvas');
            page.width = PAGE_WIDTH * SCALE;
            page.height = PAGE_HEIGHT * SCALE;
            const ctx = page.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, page.width, page.height);
            const sliceHeight = (to - from) * SCALE;
            ctx.drawImage(canvas, 0, from * SCALE, canvas.width, sliceHeight, 0, MARGIN * SCALE, page.width, sliceHeight);

            if (index > 0) pdf.addPage();
            pdf.addImage(page.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text(`Page ${index + 1} of ${pages.length}`, pdfWidth / 2, pdfHeight - 6, { align: 'center' });
        });
        pdf.save(filename);
    } finally {
        document.body.removeChild(holder);
    }
}
