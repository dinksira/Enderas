const BID_AMOUNT_VIEWER_ROLES = Object.freeze(['super_admin', 'auction_manager']);

function formatEtbAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return `${new Intl.NumberFormat('en-ET').format(amount)} ETB`;
}

export function canViewBidAmounts(roleCode) {
  return BID_AMOUNT_VIEWER_ROLES.includes(String(roleCode || ''));
}

export function formatWinnerAmount(amount, roleCode, t) {
  if (canViewBidAmounts(roleCode) && amount != null) {
    return formatEtbAmount(amount);
  }
  return t('winners.management.amount.restricted');
}

export function getWinnerStatusVariant(status) {
  switch (status) {
    case 'confirmed':
      return 'active';
    case 'pending_confirmation':
      return 'pending';
    case 'declined':
      return 'rejected';
    case 'replaced':
      return 'under-review';
    default:
      return 'default';
  }
}
