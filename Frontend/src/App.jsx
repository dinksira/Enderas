import { Routes, Route } from 'react-router-dom';
import { BaseLayout } from './layouts/BaseLayout.jsx';
import { ROUTES } from './routes/index.js';
import {
  HomeView,
  MarketplaceView,
  BidderDashboardView,
  OperationalPanelView,
} from './views/index.js';

export function App() {
  return (
    <BaseLayout>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomeView />} />
        <Route path={ROUTES.MARKETPLACE} element={<MarketplaceView />} />
        <Route path={ROUTES.BIDDER_DASHBOARD} element={<BidderDashboardView />} />
        <Route path={ROUTES.OPERATIONAL_PANEL} element={<OperationalPanelView />} />
      </Routes>
    </BaseLayout>
  );
}

export default App;
