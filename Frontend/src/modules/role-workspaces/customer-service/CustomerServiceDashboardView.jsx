import { WorkspacePage } from '../components/WorkspacePage.jsx';

export function CustomerServiceDashboardView() {
  return (
    <WorkspacePage
      title="Customer Service Dashboard"
      description="Support users, review KYC, assets, and CPO requests."
    >
      <p>Customer intake and review queue.</p>
    </WorkspacePage>
  );
}

export default CustomerServiceDashboardView;
