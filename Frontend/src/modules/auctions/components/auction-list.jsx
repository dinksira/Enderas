import { useAuctions } from '../hooks/use-auctions.js';
import './auction-list.css';

export function AuctionList() {
  const { records, loading, error } = useAuctions();

  return (
    <section className="auction-list" aria-live="polite">
      <h3 className="auction-list__title">Auction Catalog</h3>
      <p className="auction-list__body">
        Module-specific UI fragment scoped to the auctions domain.
      </p>
      <p className="auction-list__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default AuctionList;
