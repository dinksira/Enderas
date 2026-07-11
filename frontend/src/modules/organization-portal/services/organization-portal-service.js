import { api } from '@enderass/shared/api';

export const organizationPortalService = {
  getPortal() {
    return api.get('/api/v1/organizations/portal');
  },
  getPortalAssets() {
    return api.get('/api/v1/organizations/portal/assets');
  },
};

export default organizationPortalService;
