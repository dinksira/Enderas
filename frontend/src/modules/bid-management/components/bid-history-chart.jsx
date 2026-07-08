import { useBidSession } from '../hooks/use-bid-session.js';

export function BidHistoryChart() {
  const { records, loading, error } = useBidSession();

  return (
    <section className="bid-history-chart" aria-live="polite">
      <h3 className="bid-history-chart__title">Bid Management</h3>
      <p className="bid-history-chart__body">
        Module-specific UI fragment scoped to the bid-management domain.
      </p>
      <p className="bid-history-chart__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default BidHistoryChart;
