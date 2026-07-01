import type { BrowseAuction } from '@/types/auction';

/** Placeholder browse feed until mobile auth is wired to the API. */
export const MOCK_BROWSE_AUCTIONS: BrowseAuction[] = [
  {
    id: 'auc-001',
    title: '1962 Mercedes-Benz 190SL',
    description:
      'Restored classic roadster with matching-numbers engine, ivory interior, and full service history.',
    category: 'vehicles',
    status: 'ACTIVE',
    imageUrls: [],
    reservePrice: 4_850_000,
    bidCount: 12,
    endingDate: '15 Jul 2026',
    endDate: '2026-07-15T18:00:00.000Z',
    documentPrice: 5_000,
    cpoPercentage: 20,
  },
  {
    id: 'auc-002',
    title: 'Antique Gold Pocket Watch',
    description:
      'Swiss-made 18k gold hunter-case pocket watch, circa 1890, with original enamel dial and chain.',
    category: 'jewelry',
    status: 'ACTIVE',
    imageUrls: [],
    reservePrice: 320_000,
    bidCount: 8,
    endingDate: '12 Jul 2026',
    endDate: '2026-07-12T14:30:00.000Z',
    documentPrice: 2_500,
    cpoPercentage: 20,
  },
  {
    id: 'auc-003',
    title: '3-Bedroom Villa, Bole',
    description:
      'Modern villa in Bole with landscaped garden, backup power, and clear title documentation.',
    category: 'realEstate',
    status: 'ACTIVE',
    imageUrls: [],
    reservePrice: 28_500_000,
    bidCount: 5,
    endingDate: '20 Jul 2026',
    endDate: '2026-07-20T12:00:00.000Z',
    documentPrice: 10_000,
    cpoPercentage: 20,
  },
  {
    id: 'auc-004',
    title: 'Vintage Rolex Submariner',
    description:
      'Reference 5513 Submariner with original bezel insert, recently serviced, includes papers.',
    category: 'jewelry',
    status: 'CLOSED',
    imageUrls: [],
    reservePrice: 1_200_000,
    bidCount: 24,
    endingDate: '01 Jun 2026',
    endDate: '2026-06-01T17:00:00.000Z',
    documentPrice: 3_000,
    cpoPercentage: 20,
  },
  {
    id: 'auc-005',
    title: 'Caterpillar D6 Bulldozer',
    description:
      'Heavy-duty bulldozer suitable for construction sites, low hours, maintained by authorized dealer.',
    category: 'machinery',
    status: 'SUSPENDED',
    imageUrls: [],
    reservePrice: 6_750_000,
    bidCount: 3,
    endingDate: '25 Jul 2026',
    endDate: '2026-07-25T10:00:00.000Z',
    documentPrice: 7_500,
    cpoPercentage: 20,
  },
  {
    id: 'auc-006',
    title: 'Contemporary Ethiopian Art Collection',
    description:
      'Curated set of five original paintings by established Addis Ababa artists, gallery provenance.',
    category: 'art',
    status: 'ACTIVE',
    imageUrls: [],
    reservePrice: 890_000,
    bidCount: 6,
    endingDate: '18 Jul 2026',
    endDate: '2026-07-18T16:00:00.000Z',
    documentPrice: 4_000,
    cpoPercentage: 20,
  },
];

export function findMockAuctionById(id: string): BrowseAuction | undefined {
  return MOCK_BROWSE_AUCTIONS.find((auction) => auction.id === id);
}
