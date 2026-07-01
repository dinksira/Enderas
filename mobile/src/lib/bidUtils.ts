import type { BidRecord, BidStatus, BidTabFilter } from '@/types/bid';

export function bidStatusTone(
  status: BidStatus,
): 'live' | 'ending' | 'won' | 'lost' | 'pending' {
  switch (status) {
    case 'winning':
      return 'won';
    case 'lost':
    case 'invalid':
      return 'lost';
    case 'submitted':
      return 'live';
    default:
      return 'pending';
  }
}

export function filterBidsByTab(bids: BidRecord[], tab: BidTabFilter): BidRecord[] {
  switch (tab) {
    case 'active':
      return bids.filter((bid) => bid.status === 'submitted' || bid.status === 'winning');
    case 'winning':
      return bids.filter((bid) => bid.status === 'winning');
    case 'outbid':
      return bids.filter((bid) => bid.status === 'submitted');
    case 'won':
      return bids.filter((bid) => bid.status === 'winning');
    case 'lost':
      return bids.filter((bid) => bid.status === 'lost' || bid.status === 'invalid');
    default:
      return bids;
  }
}

export function summarizeBids(bids: BidRecord[]) {
  return {
    total: bids.length,
    active: bids.filter((bid) => bid.status === 'submitted' || bid.status === 'winning').length,
    winning: bids.filter((bid) => bid.status === 'winning').length,
    won: bids.filter((bid) => bid.status === 'winning').length,
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
