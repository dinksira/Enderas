import { WorkspacePage } from '../../role-workspaces/components/WorkspacePage.jsx';

/**
 * Generic RBAC-gated module page shell.
 * @param {{ title: string, module: string, description?: string }} props
 */
export function ModulePageView({ title, module: moduleName, description }) {
  return (
    <WorkspacePage title={title} description={description ?? `Authorized access to ${moduleName}.`}>
      <p className="module-page__meta">Module: {moduleName}</p>
    </WorkspacePage>
  );
}

export default ModulePageView;
