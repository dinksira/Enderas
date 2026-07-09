export function asset(props) {
  return Object.freeze(props);
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
  return Object.freeze({
    ...props,
    lotGroups: props.lotGroups.map((group) => lotGroup(group)),
  });
}

export const VEHICLE_DOCS = [
  { name: 'service-history.pdf', title: 'Complete Service History' },
  { name: 'inspection-report.pdf', title: 'Pre-Auction Mechanical Inspection' },
  { name: 'registration-copy.pdf', title: 'Vehicle Registration Copy' },
];

export const MACHINERY_DOCS = [
  { name: 'maintenance-log.pdf', title: 'Maintenance & Service Log' },
  { name: 'operator-manual.pdf', title: 'Operator Manual' },
  { name: 'hour-meter-cert.pdf', title: 'Hour Meter Certification' },
];

export const BUILDING_DOCS = [
  { name: 'title-deed.pdf', title: 'Title Deed Extract' },
  { name: 'survey-plan.pdf', title: 'Cadastral Survey Plan' },
  { name: 'building-permit.pdf', title: 'Building Permit Copy' },
  { name: 'utility-bills.pdf', title: 'Recent Utility Bills' },
];

export const LAND_DOCS = [
  { name: 'title-deed.pdf', title: 'Land Title Deed' },
  { name: 'survey-certificate.pdf', title: 'Survey Certificate' },
  { name: 'zoning-letter.pdf', title: 'Zoning Confirmation Letter' },
];
