import { BidHistoryChart } from '../components/bid-history-chart.jsx';

export function BidManagementView() {
  return (
    <section className="bid-management-view">
      <header>
        <h1 className="bid-management-view__title">Bid Management</h1>
        <p className="bid-management-view__lead">Live bidding loops, automatic increments, and bid history charts.</p>
      </header>
      <BidHistoryChart />
    </section>
  );
}

export default BidManagementView;
