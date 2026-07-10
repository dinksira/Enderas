import { buildMinimalPdf } from './minimal-pdf.mjs';

function sanitizePdfText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/[()]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
}

function wrapLines(text, maxLen = 88) {
  const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxLen && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

/**
 * Build a multi-section auction document PDF with realistic structure.
 */
export function buildAuctionDocumentPdf({
  title,
  documentType = 'Official Document',
  reference = '',
  issuedDate = new Date().toISOString().slice(0, 10),
  sections = [],
}) {
  const lines = [
    'ENDERASS AUCTIONS PLC',
    'Addis Ababa, Ethiopia',
    '----------------------------------------',
    sanitizePdfText(documentType).toUpperCase(),
    sanitizePdfText(title),
  ];

  if (reference) {
    lines.push(`Ref: ${sanitizePdfText(reference)}`);
  }
  lines.push(`Issued: ${issuedDate}`);
  lines.push('');

  for (const section of sections) {
    if (section.heading) {
      lines.push(sanitizePdfText(section.heading));
    }
    for (const paragraph of section.paragraphs ?? []) {
      lines.push(...wrapLines(paragraph));
      lines.push('');
    }
    for (const bullet of section.bullets ?? []) {
      lines.push(`- ${sanitizePdfText(bullet)}`);
    }
    if (section.bullets?.length) {
      lines.push('');
    }
  }

  lines.push('This document is issued for auction purposes only.');
  lines.push('Enderass Auctions PLC - Licensed Auctioneer');

  return buildMinimalPdf(lines);
}

export function buildOwnershipDocumentPdf(assetSeed) {
  const docType =
    assetSeed.assetType === 'vehicle'
      ? 'Vehicle Registration Extract'
      : assetSeed.assetType === 'land'
        ? 'Land Title Deed Extract'
        : assetSeed.assetType === 'building'
          ? 'Property Ownership Certificate'
          : 'Equipment Ownership Certificate';

  return buildAuctionDocumentPdf({
    title: assetSeed.ownershipDocTitle ?? `Ownership - ${assetSeed.title}`,
    documentType: docType,
    reference: `OWN-${assetSeed.assetId.slice(0, 8).toUpperCase()}`,
    sections: [
      {
        heading: 'Registered Owner',
        paragraphs: [
          'Consignor verified through Enderass KYC and title review. Document copy retained in escrow pending successful auction settlement.',
        ],
        bullets: [
          `Asset: ${assetSeed.title}`,
          `Location: ${assetSeed.location}`,
          assetSeed.address ? `Address: ${assetSeed.address}` : null,
          `Declared reserve: ETB ${assetSeed.reservePrice?.toLocaleString('en-US') ?? 'N/A'}`,
        ].filter(Boolean),
      },
      {
        heading: 'Encumbrances & Status',
        paragraphs: [
          'No outstanding liens, court orders, or third-party claims disclosed at time of consignment. Buyer should conduct independent title verification before transfer.',
        ],
      },
    ],
  });
}

export function buildEvaluationReportPdf(assetSeed) {
  return buildAuctionDocumentPdf({
    title: `Independent Evaluation - ${assetSeed.title}`,
    documentType: 'Evaluation Report',
    reference: `EVL-${assetSeed.evaluationId.slice(0, 8).toUpperCase()}`,
    sections: [
      {
        heading: 'Inspection Summary',
        paragraphs: [assetSeed.description],
        bullets: [
          assetSeed.conditionNotes ? `Condition: ${assetSeed.conditionNotes}` : null,
          `Recommended reserve: ETB ${assetSeed.reservePrice?.toLocaleString('en-US') ?? 'N/A'}`,
          `Recommendation: ${assetSeed.evaluationNotes ?? 'Approved for publication'}`,
        ].filter(Boolean),
      },
      {
        heading: 'Methodology',
        paragraphs: [
          'On-site inspection conducted by licensed Enderass evaluation officer. Comparable sales, replacement cost, and income approach considered where applicable. Photos and measurements recorded.',
        ],
      },
    ],
  });
}

export function buildAdditionalDocumentPdf(doc, assetSeed) {
  return buildAuctionDocumentPdf({
    title: doc.title,
    documentType: 'Supporting Document',
    reference: `DOC-${assetSeed.assetId.slice(0, 6).toUpperCase()}-${doc.name.replace(/\W+/g, '').slice(0, 6).toUpperCase()}`,
    sections: [
      {
        heading: doc.title,
        paragraphs: [
          `Supporting documentation for ${assetSeed.title}. Provided by consignor and verified for completeness at intake.`,
        ],
        bullets: doc.bullets ?? [
          'Original on file with Enderass Auctions',
          'Copy provided to registered bidders upon document purchase',
        ],
      },
    ],
  });
}

export function buildAuctionCatalogPdf(auctionSeed, flatAssets) {
  const lotLines = flatAssets.map(
    (asset, index) =>
      `Lot ${index + 1}: ${asset.title} - Reserve ETB ${asset.reservePrice?.toLocaleString('en-US')}`,
  );

  return buildAuctionDocumentPdf({
    title: auctionSeed.title,
    documentType: 'Auction Catalog',
    reference: `AUC-${auctionSeed.id.slice(0, 8).toUpperCase()}`,
    sections: [
      {
        heading: 'Sale Overview',
        paragraphs: [auctionSeed.description, auctionSeed.auctionConditions],
        bullets: [
          `Category: ${auctionSeed.category}`,
          `Document fee: ETB ${auctionSeed.documentFee?.toLocaleString('en-US')}`,
          `CPO: ${auctionSeed.cpoPercentage}%`,
          `Total lots: ${flatAssets.length}`,
        ],
      },
      {
        heading: 'Lot Schedule',
        bullets: lotLines.slice(0, 24),
      },
      {
        heading: 'Bidding & Settlement',
        paragraphs: [
          'Online bidding opens at published start time. Winning bidders receive pro-forma invoice within 24 hours. Full settlement required per auction conditions. Collection or transfer arranged after payment clearance.',
        ],
      },
    ],
  });
}
