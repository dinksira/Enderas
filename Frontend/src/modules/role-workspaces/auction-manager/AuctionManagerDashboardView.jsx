import { WorkspacePage } from '../components/WorkspacePage.jsx';

export function AuctionManagerDashboardView() {
  return (
    <WorkspacePage
      title="Auction Manager Dashboard"
      description="Manage assets, auctions, documents, bids, winners, and CPO workflows."
    >
      <p>Auction pipeline status and pending approvals.</p>
    </WorkspacePage>
  );
}

export default AuctionManagerDashboardView;
