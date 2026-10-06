/**
 * Email bodies. Plain data in, { subject, html, text } out, with no sending and no
 * database. All dynamic text is HTML-escaped; amounts and dates arrive already
 * formatted for the school (see lib/format.ts). Layout is a single 600px table
 * with inline styles, which is what mail clients render reliably.
 */

export type EmailBrand = {
  name: string;
  logoUrl: string | null;
  /** A #rrggbb colour for the header band. */
  brandColor: string;
  /** Text colour that is readable on brandColor. */
  onBrand: string;
  email: string | null;
  phone: string | null;
  /** Free text the school prints on documents (bank details, terms). */
  footer: string | null;
};

export type RenderedEmail = { subject: string; html: string; text: string };

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = [label: string, value: string];

function layout(brand: EmailBrand, heading: string, introHtml: string, rows: Row[], outroHtml = ""): string {
  const contact = [brand.phone, brand.email].filter(Boolean).map((c) => esc(c as string)).join(" · ");
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #eceef1">${esc(label)}</td>` +
        `<td style="padding:8px 0;text-align:right;font-size:14px;font-weight:600;border-bottom:1px solid #eceef1">${esc(value)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#16181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="background:${esc(brand.brandColor)};padding:20px 28px;color:${esc(brand.onBrand)}">
${brand.logoUrl ? `<img src="${esc(brand.logoUrl)}" alt="" height="36" style="height:36px;vertical-align:middle;margin-right:12px;background:#ffffff;border-radius:6px">` : ""}
<span style="font-size:18px;font-weight:700;vertical-align:middle">${esc(brand.name)}</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:20px">${esc(heading)}</h1>
<div style="font-size:14px;line-height:1.55">${introHtml}</div>
${rows.length > 0 ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">${rowsHtml}</table>` : ""}
<div style="font-size:14px;line-height:1.55">${outroHtml}</div>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #eceef1;font-size:12px;color:#6b7280;line-height:1.5">
${brand.footer ? `<div style="margin-bottom:8px;white-space:pre-line">${esc(brand.footer)}</div>` : ""}
${contact ? `<div>${contact}</div>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

function plain(brand: EmailBrand, heading: string, intro: string, rows: Row[], outro = ""): string {
  return [
    brand.name,
    "",
    heading,
    "",
    intro,
    "",
    ...rows.map(([l, v]) => `${l}: ${v}`),
    ...(outro ? ["", outro] : []),
    ...(brand.footer ? ["", "--", brand.footer] : []),
    ...([brand.phone, brand.email].filter(Boolean).length > 0 ? ["", [brand.phone, brand.email].filter(Boolean).join(" · ")] : []),
  ].join("\n");
}

export function receiptEmail(
  brand: EmailBrand,
  d: {
    studentName: string;
    documentNumber: string;
    paidOn: string;
    forLabel: string;
    amount: string;
    /** e.g. "$10.00 at 25 ZWG per USD" when paid in another currency. */
    equivalent: string | null;
    method: string;
    reference: string | null;
    balanceAfter: string;
  },
): RenderedEmail {
  const intro = `Thank you. We have received a payment for ${d.studentName}.`;
  const rows: Row[] = [
    ["Receipt number", d.documentNumber],
    ["Date paid", d.paidOn],
    ["For", d.forLabel],
    ["Amount received", d.amount],
    ...(d.equivalent ? ([["Equivalent", d.equivalent]] as Row[]) : []),
    ["Method", d.method],
    ...(d.reference ? ([["Reference", d.reference]] as Row[]) : []),
    ["Balance after this payment", d.balanceAfter],
  ];
  const subject = `Receipt ${d.documentNumber} from ${brand.name}`;
  return {
    subject,
    html: layout(brand, "Payment received", esc(intro), rows),
    text: plain(brand, "Payment received", intro, rows),
  };
}

export function balanceReminderEmail(
  brand: EmailBrand,
  d: { studentName: string; lines: { label: string; balance: string }[]; total: string },
): RenderedEmail {
  const intro = `This is a friendly reminder that ${d.studentName} has an outstanding balance. If you have already paid, please ignore this message and thank you.`;
  const rows: Row[] = [...d.lines.map((l) => [l.label, l.balance] as Row), ["Total outstanding", d.total]];
  const outro = "Please contact us if you would like to arrange payment or have any questions.";
  const subject = `Fees reminder for ${d.studentName} from ${brand.name}`;
  return {
    subject,
    html: layout(brand, "Fees reminder", esc(intro), rows, esc(outro)),
    text: plain(brand, "Fees reminder", intro, rows, outro),
  };
}

export type InstalmentItem = { course: string; due: string; amount: string; daysLate?: number };

export function instalmentReminderEmail(
  brand: EmailBrand,
  d: { studentName: string; overdue: InstalmentItem[]; upcoming: InstalmentItem[] },
): RenderedEmail {
  const isOverdue = d.overdue.length > 0;
  const heading = isOverdue ? "Payment overdue" : "Payment due soon";
  const intro = isOverdue
    ? `A payment for ${d.studentName} is past its due date. If you have already paid, please ignore this message and thank you.`
    : `A payment for ${d.studentName} is coming due.`;
  const rows: Row[] = [
    ...d.overdue.map(
      (i) =>
        [`${i.course}, due ${i.due}${i.daysLate ? ` (${i.daysLate} ${i.daysLate === 1 ? "day" : "days"} late)` : ""}`, i.amount] as Row,
    ),
    ...d.upcoming.map((i) => [`${i.course}, due ${i.due}`, i.amount] as Row),
  ];
  const outro = "Please contact us if you would like to arrange payment or have any questions.";
  const subject = isOverdue ? `Payment overdue for ${d.studentName}` : `Payment due soon for ${d.studentName}`;
  return {
    subject: `${subject} (${brand.name})`,
    html: layout(brand, heading, esc(intro), rows, esc(outro)),
    text: plain(brand, heading, intro, rows, outro),
  };
}

export function testEmail(brand: EmailBrand, to: string): RenderedEmail {
  const intro = `This is a test message from ${brand.name}. If you can read it, email is working and your school's name, logo and colour look like this.`;
  return {
    subject: `Test email from ${brand.name}`,
    html: layout(brand, "Email is working", esc(intro), [["Sent to", to]]),
    text: plain(brand, "Email is working", intro, [["Sent to", to]]),
  };
}
