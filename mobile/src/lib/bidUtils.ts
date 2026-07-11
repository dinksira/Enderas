import type { BidRecord, BidStatus, BidTabFilter } from '@/types/bid';

export function bidStatusTone(status: BidStatus): 'live' | 'lost' {
  return status === 'invalid' ? 'lost' : 'live';
}

export function filterBidsByTab(bids: BidRecord[], tab: BidTabFilter): BidRecord[] {
  switch (tab) {
    case 'submitted':
      return bids.filter((bid) => bid.status === 'submitted');
    case 'invalid':
      return bids.filter((bid) => bid.status === 'invalid');
    default:
      return bids;
  }
}

export function summarizeBids(bids: BidRecord[]) {
  return {
    total: bids.length,
    active: bids.filter((bid) => bid.status === 'submitted').length,
    invalid: bids.filter((bid) => bid.status === 'invalid').length,
    totalValue: bids.reduce((sum, bid) => sum + (Number.isFinite(bid.amount) ? bid.amount : 0), 0),
  };
}

export function formatBidDate(value: string, locale = 'en'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-ET', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
