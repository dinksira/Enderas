/**
 * Build a valid multi-line PDF for local seed uploads.
 * Accepts a string title or an array of text lines.
 */
export function buildMinimalPdf(titleOrLines = 'Enderass Auction Catalog') {
  const lines = Array.isArray(titleOrLines)
    ? titleOrLines.map((line) => String(line))
    : [String(titleOrLines)];

  const commands = [];
  let y = 740;
  const lineHeight = 14;

  for (const line of lines) {
    const safeLine = String(line)
      .replace(/\\/g, '\\\\')
      .replace(/[()]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .slice(0, 100);

    if (safeLine.length === 0) {
      y -= lineHeight;
      continue;
    }

    commands.push(`1 0 0 1 72 ${y} Tm (${safeLine}) Tj`);
    y -= lineHeight;

    if (y < 72) {
      break;
    }
  }

  const stream = `BT /F1 11 Tf ${commands.join(' ')} ET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }

  const xrefPos = body.length;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  body += xref;
  body += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\n`;
  body += `startxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(body, 'utf8');
}
