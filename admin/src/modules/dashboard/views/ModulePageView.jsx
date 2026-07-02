/**
 * Generic RBAC-gated module page shell.
 * @param {{ title: string, module: string, description?: string }} props
 */
export function ModulePageView({ title, module: moduleName, description }) {
  return (
    <section className="workspace-page">
      <header className="workspace-page__header">
        <h1 className="workspace-page__title">{title}</h1>
        <p className="workspace-page__description">
          {description ?? `Authorized access to ${moduleName}.`}
        </p>
      </header>
      <div className="workspace-page__body">
        <p className="module-page__meta">Module: {moduleName}</p>
      </div>
    </section>
  );
}

export default ModulePageView;
