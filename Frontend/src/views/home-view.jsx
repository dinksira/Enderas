import { Navigate } from 'react-router-dom';
import { ROUTES } from '../routes/index.js';

export function HomeView() {
  return <Navigate to={ROUTES.AUCTIONS} replace />;
}

export default HomeView;
