import { WorkspacePage } from '../components/WorkspacePage.jsx';

export function BidderDashboardView() {
  return (
    <WorkspacePage
      title="Bidder Dashboard"
      description="Browse auctions, manage bids, payments, CPO, and notifications."
    >
      <p>Your active bids and upcoming auctions.</p>
    </WorkspacePage>
  );
}

export default BidderDashboardView;
