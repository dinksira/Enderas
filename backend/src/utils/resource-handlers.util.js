import { sendSuccess } from './response.util.js';
import { buildDataScopeWhere } from '../services/data-scope.service.js';

/**
 * Factory for RBAC-protected list/detail handlers until domain services are implemented.
 * @param {string} resourceName
 * @param {string} moduleName
 */
export function createResourceHandlers(resourceName, moduleName) {
  return {
    list: (req, res) => {
      const scope = buildDataScopeWhere(req, moduleName);
      return sendSuccess(res, {
        resource: resourceName,
        items: [],
        scope,
        message: `${resourceName} list endpoint is authorized`,
      });
    },

    getById: (req, res) => {
      const scope = buildDataScopeWhere(req, moduleName);
      return sendSuccess(res, {
        resource: resourceName,
        id: req.params.id,
        item: null,
        scope,
      });
    },

    create: (req, res) => sendSuccess(res, { resource: resourceName, created: true }, 201),

    update: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, updated: true }),

    remove: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, deleted: true }),

    approve: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, status: 'approved' }),

    reject: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, status: 'rejected' }),

    publish: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, status: 'published' }),

    close: (req, res) => sendSuccess(res, { resource: resourceName, id: req.params.id, status: 'closed' }),
  };
}

export default createResourceHandlers;
