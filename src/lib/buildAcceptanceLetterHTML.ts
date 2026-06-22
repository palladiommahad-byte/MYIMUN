const DIR = '/assets/certificate';

export interface LetterData {
    delegateName: string;
    editionYear: string;
    startDate: string;
    endDate: string;
}

function escapeHtml(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function toTitleCaseLetter(name: string): string {
    return String(name || '').toLowerCase().replace(/\b[\p{L}]/gu, ch => ch.toUpperCase());
}

export function buildAcceptanceLetterHTML({ delegateName, editionYear, startDate, endDate }: LetterData): string {
    const name = toTitleCaseLetter(delegateName);

    return `
    <div style="width:794px;height:1123px;background:#FFFFFF;padding:52px 76px 70px;font-family:'Times New Roman',Times,serif;position:relative;box-sizing:border-box;overflow:hidden;">

      <!-- Watermark -->
      <div style="position:absolute;top:52%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);
        font-size:68px;font-weight:900;color:rgba(21,101,192,0.038);letter-spacing:0.04em;
        white-space:nowrap;pointer-events:none;user-select:none;font-family:Arial,sans-serif;">MODEL UNITED NATIONS</div>
      <div style="position:absolute;top:28%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);
        font-size:42px;font-weight:900;color:rgba(21,101,192,0.03);letter-spacing:0.1em;
        white-space:nowrap;pointer-events:none;user-select:none;font-family:Arial,sans-serif;">MYIMUN.ORG</div>

      <!-- Header: logo centered -->
      <div style="text-align:center;margin-bottom:22px;">
        <img src="${DIR}/logo.png" alt="MYIMUN" crossorigin="anonymous" style="width:300px;height:auto;display:block;margin:0 auto;" />
      </div>

      <!-- Divider -->
      <div style="height:2px;background:linear-gradient(90deg,transparent 0%,#1565C0 30%,#1565C0 70%,transparent 100%);margin:0 0 30px;"></div>

      <!-- Letter body -->
      <div style="font-size:13.5px;line-height:1.78;color:#111111;text-align:justify;">

        <p style="font-weight:700;font-size:14.5px;margin:0 0 20px;text-align:left;">Dear ${escapeHtml(name)},</p>

        <p style="margin:0 0 16px;">Congratulations! It is with great pleasure that we inform you that you have been officially accepted as a delegate to <strong>MYIMUN ${escapeHtml(editionYear)}</strong>.</p>

        <p style="margin:0 0 16px;">We were impressed by your application and are excited to welcome you to this experience. The conference will take place from <strong>${escapeHtml(startDate)}</strong> to <strong>${escapeHtml(endDate)}</strong>, and we believe it will be a memorable few days filled with debate, diplomacy, and meaningful connections with delegates from diverse backgrounds.</p>

        <p style="margin:0 0 16px;">This is your chance to step into the shoes of a global decision-maker, sharpen your negotiation and public speaking skills, and engage with pressing international issues alongside like-minded young people from across the region and beyond.</p>

        <p style="margin:0 0 16px;">Please keep an eye on your inbox for further details regarding registration, committee assignments, and preparation materials ahead of the conference.</p>

        <p style="margin:0 0 8px;">Once again, congratulations on your acceptance. We warmly welcome you aboard and look forward to seeing you at <strong>MYIMUN ${escapeHtml(editionYear)}</strong>.</p>

        <p style="margin:0 0 44px;text-align:center;">Sincerely,</p>
      </div>

      <!-- Signature row -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px;">
        <p style="font-weight:700;font-size:14px;margin:0;font-family:Arial,sans-serif;">MYIMUN Secretariat</p>
        <img src="${DIR}/seal.png" alt="" crossorigin="anonymous" style="width:86px;height:auto;opacity:0.88;" />
      </div>

      <!-- Footer -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:12px 76px;border-top:1px solid #E0E8F4;text-align:center;">
        <span style="font-family:Arial,Helvetica,sans-serif;color:#1565C0;font-weight:700;font-size:12px;letter-spacing:0.15em;">MYIMUN.ORG</span>
      </div>
    </div>`;
}
