/**
 * Build a tiny but valid PDF for local seed uploads.
 */
export function buildMinimalPdf(title = 'Enderass Auction Catalog') {
  const safeTitle = String(title).replace(/[()\\]/g, '');
  const stream = `BT /F1 20 Tf 72 700 Td (${safeTitle}) Tj ET`;
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
