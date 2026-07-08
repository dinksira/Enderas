import { assetService } from '../../assets/services/asset-service.js';

/** @deprecated Use assetService from modules/assets/services/asset-service.js */
export const assetRequestService = Object.freeze({
  getAll: () => assetService.getAll(),
  getById: (id) => assetService.getById(id),
  create: (payload) => assetService.create(payload),
  update: (id, payload) => assetService.update(id, payload),
});

export default assetRequestService;
