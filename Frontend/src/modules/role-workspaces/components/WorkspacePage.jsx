/**
 * @param {{ title: string, description?: string, children?: import('react').ReactNode }} props
 */
export function WorkspacePage({ title, description, children }) {
  return (
    <section className="workspace-page">
      <header className="workspace-page__header">
        <h1 className="workspace-page__title">{title}</h1>
        {description ? <p className="workspace-page__description">{description}</p> : null}
      </header>
      <div className="workspace-page__body">{children}</div>
    </section>
  );
}

export default WorkspacePage;
