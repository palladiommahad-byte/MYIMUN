/**
 * MYIMUN participation-certificate template.
 *
 * Composites the official element PNGs (in /public/assets/certificate/) at exact
 * positions on a 1200×849 A4-landscape canvas — the same aspect ratio as the
 * background art (3508×2480). Only the delegate NAME and DATE are live text.
 *
 * Elements:
 *   background.png  full pattern + centre watermark   (3508×2480)
 *   logo.png        top-left blue lockup              (1027×354)
 *   badge.png       top-right gold "7 edition" laurel (288×236)
 *   title.png       CERTIFICATE OF PARTICIPATION +sub (2574×295)
 *   body.png        "FOR SUCCESSFULLY PARTICIPATING…" (2163×333)
 *   slogan.png      "One World, One Future…"          (1285×177)
 *   seal.png        official stamp + signature        (403×381)
 */

export interface CertificateData {
    delegateName: string;
    eventDate: string;
    /** Printed (underlined) name under the seal. */
    signatory?: string;
    /** Location line printed before the date (default "Marrakech"). */
    location?: string;
    /** kept for backwards-compat; the edition number is baked into badge.png */
    edition?: number;
}

import { escapeHtml, toTitleCase } from './html';

const DIR = '/assets/certificate';

/** Name is fixed at 72px per design; long names shrink so they never overflow. */
export function getNameFontSize(name: string): number {
    const len = (name || '').length;
    if (len <= 22) return 72;
    if (len <= 28) return 60;
    if (len <= 34) return 50;
    return 42;
}

export function buildCertificateHTML({
    delegateName,
    eventDate,
    signatory = 'Mustapha Ait Mbark',
    location = 'Marrakech',
    edition,
}: CertificateData): string {
    const name = toTitleCase(delegateName);
    const nameSize = getNameFontSize(name);

    const editionOverlay = edition != null ? `
      <div style="position:absolute;top:0;left:0;width:96px;height:79px;display:flex;align-items:center;justify-content:center;padding-bottom:6px;pointer-events:none;">
        <div style="background:rgba(255,248,220,0.88);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
          <span style="font-family:'Times New Roman',serif;font-size:17px;font-weight:700;color:#7A5600;line-height:1;">${edition}</span>
        </div>
      </div>` : '';

    return `
    <div class="cert" style="width:1200px;height:849px;position:relative;overflow:hidden;background:#FFFFFF;font-family:'Times New Roman',serif;">

      <!-- Background art (pattern + watermark) -->
      <img src="${DIR}/background.png" alt="" crossorigin="anonymous"
        style="position:absolute;top:0;left:0;width:1200px;height:849px;object-fit:cover;z-index:0;" />

      <!-- ===== Element layer ===== -->
      <div style="position:absolute;top:0;left:0;width:1200px;height:849px;z-index:1;">

        <!-- Logo (top-left) -->
        <img src="${DIR}/logo.png" alt="" crossorigin="anonymous"
          style="position:absolute;left:30px;top:26px;width:340px;height:auto;" />

        <!-- Edition badge (top-right) with optional edition number overlay -->
        <div style="position:absolute;right:40px;top:22px;width:96px;height:79px;">
          <img src="${DIR}/badge.png" alt="" crossorigin="anonymous"
            style="width:96px;height:auto;display:block;" />
          ${editionOverlay}
        </div>

        <!-- Title + subtitle -->
        <img src="${DIR}/title.png" alt="Certificate of Participation" crossorigin="anonymous"
          style="position:absolute;top:160px;left:50%;transform:translateX(-50%);width:880px;height:auto;" />

        <!-- Name (live text) — vertically centred, no rules -->
        <div style="position:absolute;top:349px;left:90px;right:90px;">
          <div data-cert-name="1" style="width:100%;font-family:'Edwardian Script ITC','Edwardian Script','Great Vibes',cursive;
            font-size:${nameSize}px;color:#1AABF0;text-align:center;line-height:1.3;white-space:nowrap;">${escapeHtml(name)}</div>
        </div>

        <!-- Body text -->
        <img src="${DIR}/body.png" alt="For successfully participating as a delegate" crossorigin="anonymous"
          style="position:absolute;top:470px;left:50%;transform:translateX(-50%);width:740px;height:auto;" />

        <!-- Date (live text) -->
        <div style="position:absolute;top:602px;left:0;right:0;text-align:center;
          font-family:'Times New Roman',serif;font-size:18px;color:#3A3A3A;letter-spacing:0.01em;">${escapeHtml(location)} from ${escapeHtml(eventDate)}</div>

        <!-- Slogan (bottom-left) -->
        <img src="${DIR}/slogan.png" alt="One World, One Future" crossorigin="anonymous"
          style="position:absolute;left:44px;top:748px;width:440px;height:auto;" />

        <!-- Seal + signatory (bottom-right) -->
        <div style="position:absolute;right:48px;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:2px;">
          <img src="${DIR}/seal.png" alt="Official seal" crossorigin="anonymous" style="width:128px;height:auto;" />
          <span style="font-family:'Times New Roman',serif;font-size:12px;color:#3A3A3A;text-decoration:underline;letter-spacing:0.01em;white-space:nowrap;">${escapeHtml(signatory)}</span>
        </div>

        <!-- Right-edge URL -->
        <div style="position:absolute;right:14px;top:50%;transform:translateY(-50%) rotate(90deg);transform-origin:center;
          font-family:'Inter',Arial,sans-serif;font-size:9px;font-weight:600;color:#B8BCC4;letter-spacing:0.24em;text-transform:uppercase;white-space:nowrap;">MYIMUN.ORG</div>

      </div>
    </div>`;
}

/**
 * Shift the rendered name so its visual INK is centered, compensating for
 * script-font swashes (e.g. Edwardian Script's leading "A" flourish) that CSS
 * text-align centring ignores (it centres by glyph advance, not ink).
 * Call after the element is in the DOM and fonts are ready.
 */
export async function centerCertificateName(container: HTMLElement): Promise<void> {
    const el = container.querySelector<HTMLElement>('[data-cert-name]');
    if (!el) return;
    try { await document.fonts.ready; } catch { /* fonts API unavailable */ }

    const cs = getComputedStyle(el);
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    const text = (el.textContent || '').trim();
    const m = ctx.measureText(text);
    const advance = m.width;
    const inkLeft = m.actualBoundingBoxLeft;
    const inkRight = m.actualBoundingBoxRight;
    if (!advance || !isFinite(inkLeft) || !isFinite(inkRight)) return;

    // With text-align:center the advance box is centred; shift so the ink is.
    const delta = (advance - inkRight + inkLeft) / 2;
    el.style.transform = Math.abs(delta) > 0.5 ? `translateX(${delta}px)` : '';
}
