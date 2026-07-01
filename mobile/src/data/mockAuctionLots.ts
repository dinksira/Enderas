import type { AuctionDocument, AuctionLot } from '@/types/auctionParticipation';

const SAMPLE_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const MOCK_AUCTION_LOTS: AuctionLot[] = [
  {
    id: 'lot-001-1',
    auctionId: 'auc-001',
    lotLabel: 'Lot 1',
    title: '1962 Mercedes-Benz 190SL',
    description:
      'Restored classic roadster with matching-numbers engine, ivory interior, and full service history.',
    category: 'vehicles',
    imageUrls: [],
    reservePrice: 4_850_000,
    sortOrder: 1,
  },
  {
    id: 'lot-002-1',
    auctionId: 'auc-002',
    lotLabel: 'Lot 1',
    title: 'Antique Gold Pocket Watch',
    description:
      'Swiss-made 18k gold hunter-case pocket watch, circa 1890, with original enamel dial and chain.',
    category: 'jewelry',
    imageUrls: [],
    reservePrice: 320_000,
    sortOrder: 1,
  },
  {
    id: 'lot-003-1',
    auctionId: 'auc-003',
    lotLabel: 'Lot 1',
    title: 'Main Villa & Garden',
    description: 'Primary residence with landscaped garden, backup power, and clear title.',
    category: 'realEstate',
    imageUrls: [],
    reservePrice: 22_000_000,
    sortOrder: 1,
  },
  {
    id: 'lot-003-2',
    auctionId: 'auc-003',
    lotLabel: 'Lot 2',
    title: 'Guest House & Pool',
    description: 'Detached guest house with pool house and covered parking for two vehicles.',
    category: 'realEstate',
    imageUrls: [],
    reservePrice: 6_500_000,
    sortOrder: 2,
  },
  {
    id: 'lot-004-1',
    auctionId: 'auc-004',
    lotLabel: 'Lot 1',
    title: 'Vintage Rolex Submariner',
    description:
      'Reference 5513 Submariner with original bezel insert, recently serviced, includes papers.',
    category: 'jewelry',
    imageUrls: [],
    reservePrice: 1_200_000,
    sortOrder: 1,
  },
  {
    id: 'lot-005-1',
    auctionId: 'auc-005',
    lotLabel: 'Lot 1',
    title: 'Caterpillar D6 Bulldozer',
    description:
      'Heavy-duty bulldozer suitable for construction sites, low hours, maintained by authorized dealer.',
    category: 'machinery',
    imageUrls: [],
    reservePrice: 6_750_000,
    sortOrder: 1,
  },
  {
    id: 'lot-006-1',
    auctionId: 'auc-006',
    lotLabel: 'Lot 1',
    title: 'Urban Reflections I',
    description: 'Large-format oil on canvas by established Addis Ababa artist, gallery provenance.',
    category: 'art',
    imageUrls: [],
    reservePrice: 180_000,
    sortOrder: 1,
  },
  {
    id: 'lot-006-2',
    auctionId: 'auc-006',
    lotLabel: 'Lot 2',
    title: 'Highland Horizons',
    description: 'Mixed media landscape capturing the Simien highlands at golden hour.',
    category: 'art',
    imageUrls: [],
    reservePrice: 145_000,
    sortOrder: 2,
  },
  {
    id: 'lot-006-3',
    auctionId: 'auc-006',
    lotLabel: 'Lot 3',
    title: 'Market Day',
    description: 'Vibrant street scene in Mercato, signed limited edition print with certificate.',
    category: 'art',
    imageUrls: [],
    reservePrice: 95_000,
    sortOrder: 3,
  },
  {
    id: 'lot-006-4',
    auctionId: 'auc-006',
    lotLabel: 'Lot 4',
    title: 'Ancestors Series #3',
    description: 'Contemporary figurative work exploring heritage and identity.',
    category: 'art',
    imageUrls: [],
    reservePrice: 220_000,
    sortOrder: 4,
  },
  {
    id: 'lot-006-5',
    auctionId: 'auc-006',
    lotLabel: 'Lot 5',
    title: 'Blue Nile Study',
    description: 'Watercolour study of the Blue Nile gorge, framed with archival materials.',
    category: 'art',
    imageUrls: [],
    reservePrice: 250_000,
    sortOrder: 5,
  },
];

export const MOCK_AUCTION_DOCUMENTS: AuctionDocument[] = [
  {
    id: 'doc-001',
    auctionId: 'auc-001',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
  {
    id: 'doc-002',
    auctionId: 'auc-002',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
  {
    id: 'doc-003',
    auctionId: 'auc-003',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
  {
    id: 'doc-004',
    auctionId: 'auc-004',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
  {
    id: 'doc-005',
    auctionId: 'auc-005',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
  {
    id: 'doc-006',
    auctionId: 'auc-006',
    title: 'Auction Information Pack',
    url: SAMPLE_PDF_URL,
    mimeType: 'application/pdf',
  },
];

export function getMockLotsForAuction(auctionId: string): AuctionLot[] {
  return MOCK_AUCTION_LOTS.filter((lot) => lot.auctionId === auctionId).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getMockDocumentForAuction(auctionId: string): AuctionDocument | undefined {
  return MOCK_AUCTION_DOCUMENTS.find((doc) => doc.auctionId === auctionId);
}

export function findMockLotById(lotId: string): AuctionLot | undefined {
  return MOCK_AUCTION_LOTS.find((lot) => lot.id === lotId);
}
