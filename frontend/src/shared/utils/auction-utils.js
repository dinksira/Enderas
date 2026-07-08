export function normalizeAuctionStatus(status) {
  return String(status || 'PENDING').toUpperCase();
}

export function statusPillClass(status) {
  const key = normalizeAuctionStatus(status);
  const map = {
    ACTIVE: 'dashboard-status-pill--active',
    PENDING: 'dashboard-status-pill--pending',
    SUSPENDED: 'dashboard-status-pill--suspended',
    CLOSED: 'dashboard-status-pill--closed',
  };
  return map[key] || 'dashboard-status-pill--pending';
}

export function formatEtbAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return `${new Intl.NumberFormat('en-ET').format(amount)} ETB`;
}
