import { slugify } from '../../lib/seed-assets-paths.mjs';

export function asset(props) {
  const slug = props.slug ?? slugify(props.title);
  return Object.freeze({ ...props, slug });
}

export function lotGroup({ id, title, description, sortOrder, assets }) {
  return Object.freeze({
    id,
    title,
    description,
    sortOrder,
    assets: assets.map((entry) => asset(entry)),
  });
}

export function auction(props) {
  const slug = props.slug ?? slugify(props.title);
  return Object.freeze({
    ...props,
    slug,
    lotGroups: props.lotGroups.map((group) => lotGroup(group)),
  });
}

export const VEHICLE_DOCS = [
  {
    name: 'service-history.pdf',
    title: 'Complete Service History',
    bullets: [
      'Dealer and independent workshop records from 2015 onward',
      'Major service intervals logged with parts replaced',
      'Odometer readings cross-checked at each service visit',
    ],
  },
  {
    name: 'inspection-report.pdf',
    title: 'Pre-Auction Mechanical Inspection',
    bullets: [
      'Engine, transmission, brakes, and suspension tested',
      'OBD diagnostic scan with fault-code printout',
      'Road test notes and tire tread measurements included',
    ],
  },
  {
    name: 'registration-copy.pdf',
    title: 'Vehicle Registration Copy',
    bullets: [
      'Copy of current registration book (libre)',
      'Plate number and chassis number match consignment',
      'No outstanding traffic fines at intake date',
    ],
  },
];

export const MACHINERY_DOCS = [
  {
    name: 'maintenance-log.pdf',
    title: 'Maintenance & Service Log',
    bullets: [
      'Scheduled service intervals with OEM parts used',
      'Hydraulic fluid and filter change records',
      'Major component repairs documented with invoices',
    ],
  },
  {
    name: 'operator-manual.pdf',
    title: 'Operator Manual',
    bullets: [
      'OEM operator manual in English',
      'Safety procedures and daily checklist',
      'Fluid specifications and torque settings',
    ],
  },
  {
    name: 'hour-meter-cert.pdf',
    title: 'Hour Meter Certification',
    bullets: [
      'Hour meter reading photographed and sealed',
      'ECU hour log exported where available',
      'Certification signed by licensed technician',
    ],
  },
];

export const BUILDING_DOCS = [
  {
    name: 'title-deed.pdf',
    title: 'Title Deed Extract',
    bullets: [
      'Certified copy from land administration office',
      'Plot number and owner name verified',
      'No encumbrance notation on title extract',
    ],
  },
  {
    name: 'survey-plan.pdf',
    title: 'Cadastral Survey Plan',
    bullets: [
      'Licensed surveyor plan with beacon coordinates',
      'Boundary dimensions and area calculation',
      'Survey date within last 24 months',
    ],
  },
  {
    name: 'building-permit.pdf',
    title: 'Building Permit Copy',
    bullets: [
      'Construction permit issued by city administration',
      'Approved floor area and use class',
      'Occupancy certificate where applicable',
    ],
  },
  {
    name: 'utility-bills.pdf',
    title: 'Recent Utility Bills',
    bullets: [
      'Electricity account in current owner name',
      'Water utility statements last 3 months',
      'No arrears outstanding at consignment',
    ],
  },
];

export const LAND_DOCS = [
  {
    name: 'title-deed.pdf',
    title: 'Land Title Deed',
    bullets: [
      'Original title deed copy on file',
      'Parcel ID and woreda registration confirmed',
      'Seller identity matches title holder',
    ],
  },
  {
    name: 'survey-certificate.pdf',
    title: 'Survey Certificate',
    bullets: [
      'Boundary beacons located and photographed',
      'Area stated in hectares with GPS reference',
      'No overlap disputes noted in survey report',
    ],
  },
  {
    name: 'zoning-letter.pdf',
    title: 'Zoning Confirmation Letter',
    bullets: [
      'Permitted land use per city master plan',
      'Maximum building coverage and height',
      'Setback requirements from road boundary',
    ],
  },
];
