export const BIDDER_USER_ID = 'a1000002-0002-4002-8002-000000000002';
export const ADMIN_STAFF_ID = 'a2000001-0001-4001-8001-000000000001';
export const SEED_ASSET_OWNER_ID = 'b3000001-0001-4001-8001-000000000001';

export const SEED_OWNERSHIP_DOC = '/api/uploads/assets/ownership/24fa5a5e-29b5-411a-aff7-6a7461e8815a.pdf';
export const SEED_AUCTION_DOC = {
  name: 'auction-catalog.pdf',
  url: '/api/uploads/auctions/documents/93866f67-6380-4b4f-97c6-1cdcc690c107.pdf',
  size: 1024,
};
export const SEED_IMAGE_A = '/api/uploads/assets/images/35d1081e-9717-4946-b006-276b715b11e9.png';
export const SEED_IMAGE_B = '/api/uploads/assets/images/4e6234da-8dfa-402f-b9ae-5dfd69dca0b2.png';

export const SEED_AUCTIONS = Object.freeze([
  Object.freeze({
    id: 'd1000001-0001-4001-8001-000000000001',
    title: 'Premium Vehicles Collection',
    category: 'vehicles',
    description:
      'Curated fleet of inspected vehicles including classics, SUVs, and commercial trucks ready for competitive bidding.',
    auctionConditions: 'All vehicles sold as-is where-is. Winning bidders must settle within 7 business days.',
    documentFee: 5000,
    cpoPercentage: 10,
    lotGroups: [
      Object.freeze({
        id: 'g1000001-0001-4001-8001-000000000001',
        title: 'Classic Fleet',
        sortOrder: 0,
        assets: [
          Object.freeze({
            id: 'f1000001-0001-4001-8001-000000000001',
            assetId: 'e1000001-0001-4001-8001-000000000001',
            evaluationId: 'c4000001-0001-4001-8001-000000000001',
            assetType: 'vehicle',
            title: '1962 Mercedes-Benz 190SL',
            description: 'Restored classic roadster with matching-numbers engine and full service history.',
            location: 'Addis Ababa',
            reservePrice: 4_850_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['classic', 'restored'],
          }),
          Object.freeze({
            id: 'f1000001-0001-4001-8001-000000000002',
            assetId: 'e1000001-0001-4001-8001-000000000002',
            evaluationId: 'c4000001-0001-4001-8001-000000000002',
            assetType: 'vehicle',
            title: 'Toyota Land Cruiser V8',
            description: 'Low-mileage executive SUV with leather interior and dealer maintenance records.',
            location: 'Addis Ababa',
            reservePrice: 3_200_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['suv', 'low-mileage'],
          }),
        ],
      }),
      Object.freeze({
        id: 'g1000001-0001-4001-8001-000000000002',
        title: 'Commercial Vehicles',
        sortOrder: 1,
        assets: [
          Object.freeze({
            id: 'f1000001-0001-4001-8001-000000000003',
            assetId: 'e1000001-0001-4001-8001-000000000003',
            evaluationId: 'c4000001-0001-4001-8001-000000000003',
            assetType: 'vehicle',
            title: 'Mitsubishi Fuso Canter',
            description: 'Light-duty cargo truck suitable for urban logistics and distribution fleets.',
            location: 'Hawassa',
            reservePrice: 1_450_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['commercial', 'fleet'],
          }),
        ],
      }),
    ],
  }),
  Object.freeze({
    id: 'd1000002-0002-4002-8002-000000000002',
    title: 'Industrial Machinery Sale',
    category: 'machinery',
    description:
      'Heavy-duty machinery and plant equipment from verified sellers, ideal for manufacturing and construction.',
    auctionConditions: 'Buyers are responsible for dismantling and transport within 14 days of award.',
    documentFee: 3500,
    cpoPercentage: 8,
    lotGroups: [
      Object.freeze({
        id: 'g1000002-0002-4002-8002-000000000001',
        title: 'Heavy Equipment Package',
        sortOrder: 0,
        assets: [
          Object.freeze({
            id: 'f1000002-0002-4002-8002-000000000001',
            assetId: 'e1000002-0002-4002-8002-000000000001',
            evaluationId: 'c4000002-0002-4002-8002-000000000001',
            assetType: 'machinery',
            title: 'Caterpillar Excavator 320D',
            description: 'Hydraulic excavator with 6,200 operating hours and recent hydraulic service.',
            location: 'Adama',
            reservePrice: 8_750_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['excavator', 'heavy-duty'],
          }),
          Object.freeze({
            id: 'f1000002-0002-4002-8002-000000000002',
            assetId: 'e1000002-0002-4002-8002-000000000002',
            evaluationId: 'c4000002-0002-4002-8002-000000000002',
            assetType: 'machinery',
            title: 'Concrete Batching Plant',
            description: '60 m³/hr stationary batching plant with aggregate bins and control cabin.',
            location: 'Addis Ababa',
            reservePrice: 12_400_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['plant', 'related'],
          }),
        ],
      }),
      Object.freeze({
        id: 'g1000002-0002-4002-8002-000000000002',
        title: 'Power Systems',
        sortOrder: 1,
        assets: [
          Object.freeze({
            id: 'f1000002-0002-4002-8002-000000000003',
            assetId: 'e1000002-0002-4002-8002-000000000003',
            evaluationId: 'c4000002-0002-4002-8002-000000000003',
            assetType: 'machinery',
            title: 'Industrial Generator 500kVA',
            description: 'Diesel standby generator with automatic transfer switch and canopy enclosure.',
            location: 'Bahir Dar',
            reservePrice: 2_980_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['generator', 'standby'],
          }),
        ],
      }),
    ],
  }),
  Object.freeze({
    id: 'd1000003-0003-4003-8003-000000000003',
    title: 'Prime Real Estate Portfolio',
    category: 'buildings',
    description:
      'Residential and commercial properties in high-demand districts with clear title documentation.',
    auctionConditions: 'Transfer fees and stamp duties are payable by the successful bidder.',
    documentFee: 10000,
    cpoPercentage: 12,
    lotGroups: [
      Object.freeze({
        id: 'g1000003-0003-4003-8003-000000000001',
        title: 'Residential Properties',
        sortOrder: 0,
        assets: [
          Object.freeze({
            id: 'f1000003-0003-4003-8003-000000000001',
            assetId: 'e1000003-0003-4003-8003-000000000001',
            evaluationId: 'c4000003-0003-4003-8003-000000000001',
            assetType: 'building',
            title: '3-Bedroom Villa, Bole',
            description: 'Modern villa with landscaped garden, backup power, and perimeter security.',
            location: 'Bole, Addis Ababa',
            reservePrice: 28_500_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['residential', 'villa'],
          }),
        ],
      }),
      Object.freeze({
        id: 'g1000003-0003-4003-8003-000000000002',
        title: 'Commercial Portfolio',
        sortOrder: 1,
        assets: [
          Object.freeze({
            id: 'f1000003-0003-4003-8003-000000000002',
            assetId: 'e1000003-0003-4003-8003-000000000002',
            evaluationId: 'c4000003-0003-4003-8003-000000000002',
            assetType: 'building',
            title: 'Corner Retail Building, Piassa',
            description: 'Three-storey mixed-use building with street-front retail and upper-floor offices.',
            location: 'Piassa, Addis Ababa',
            reservePrice: 19_200_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['retail', 'mixed-use'],
          }),
          Object.freeze({
            id: 'f1000003-0003-4003-8003-000000000003',
            assetId: 'e1000003-0003-4003-8003-000000000003',
            evaluationId: 'c4000003-0003-4003-8003-000000000003',
            assetType: 'building',
            title: 'Warehouse Facility, Kality',
            description: '8,500 sqm warehouse with loading bays, office block, and 24-hour security.',
            location: 'Kality, Addis Ababa',
            reservePrice: 45_000_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['warehouse', 'logistics'],
          }),
        ],
      }),
    ],
  }),
  Object.freeze({
    id: 'd1000004-0004-4004-8004-000000000004',
    title: 'Land & Development Parcels',
    category: 'land',
    description:
      'Serviced and undeveloped land parcels suited for residential, commercial, and agricultural projects.',
    auctionConditions:
      "Parcels are sold with existing survey maps. Development permits are the buyer's responsibility.",
    documentFee: 7500,
    cpoPercentage: 10,
    lotGroups: [
      Object.freeze({
        id: 'g1000004-0004-4004-8004-000000000001',
        title: 'Urban Development Plots',
        sortOrder: 0,
        assets: [
          Object.freeze({
            id: 'f1000004-0004-4004-8004-000000000001',
            assetId: 'e1000004-0004-4004-8004-000000000001',
            evaluationId: 'c4000004-0004-4004-8004-000000000001',
            assetType: 'land',
            title: '1.2 ha Plot, Bole Bulbula',
            description: 'Rectangular residential plot on paved access road with utility connections nearby.',
            location: 'Bole Bulbula, Addis Ababa',
            reservePrice: 16_800_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['residential', 'serviced'],
          }),
          Object.freeze({
            id: 'f1000004-0004-4004-8004-000000000002',
            assetId: 'e1000004-0004-4004-8004-000000000002',
            evaluationId: 'c4000004-0004-4004-8004-000000000002',
            assetType: 'land',
            title: 'Commercial Corner Plot, Sarbet',
            description: 'High-visibility corner parcel zoned for mixed commercial and retail development.',
            location: 'Sarbet, Addis Ababa',
            reservePrice: 22_500_000,
            imageUrls: [SEED_IMAGE_A],
            tags: ['commercial', 'corner'],
          }),
        ],
      }),
      Object.freeze({
        id: 'g1000004-0004-4004-8004-000000000004',
        title: 'Agricultural Land',
        sortOrder: 1,
        assets: [
          Object.freeze({
            id: 'f1000004-0004-4004-8004-000000000003',
            assetId: 'e1000004-0004-4004-8004-000000000003',
            evaluationId: 'c4000004-0004-4004-8004-000000000003',
            assetType: 'land',
            title: 'Agricultural Land, Bishoftu',
            description: '18-hectare irrigated farmland with storehouse and access to main highway.',
            location: 'Bishoftu',
            reservePrice: 9_600_000,
            imageUrls: [SEED_IMAGE_B],
            tags: ['agricultural', 'irrigated'],
          }),
        ],
      }),
    ],
  }),
]);

function flattenSeedAssets(auction) {
  return auction.lotGroups.flatMap((group) => group.assets);
}

export const SEED_AUCTION_IDS = Object.freeze(SEED_AUCTIONS.map((auction) => auction.id));

export const SEED_LOT_GROUP_IDS = Object.freeze(
  SEED_AUCTIONS.flatMap((auction) => auction.lotGroups.map((group) => group.id)),
);

export const SEED_AUCTION_ASSET_IDS = Object.freeze(
  SEED_AUCTIONS.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.id)),
);

/** @deprecated Use SEED_AUCTION_ASSET_IDS */
export const SEED_LOT_IDS = SEED_AUCTION_ASSET_IDS;

export const SEED_ASSET_IDS = Object.freeze(
  SEED_AUCTIONS.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.assetId)),
);

export const SEED_EVALUATION_IDS = Object.freeze(
  SEED_AUCTIONS.flatMap((auction) => flattenSeedAssets(auction).map((asset) => asset.evaluationId)),
);
