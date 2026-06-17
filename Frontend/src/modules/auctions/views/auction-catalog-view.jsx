import { AuctionList } from '../components/auction-list.jsx';
import './auction-catalog-view.css';

export function AuctionCatalogView() {
  return (
    <section className="auctions-view">
      <header>
        <h1 className="auctions-view__title">Auction Catalog</h1>
        <p className="auctions-view__lead">Core auction catalogs, scheduling, and live listings.</p>
      </header>
      <AuctionList />
    </section>
  );
}

export default AuctionCatalogView;
