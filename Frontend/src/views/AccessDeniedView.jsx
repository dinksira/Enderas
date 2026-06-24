export function AccessDeniedView() {
  return (
    <section className="access-denied-view">
      <h1 className="access-denied-view__title">Access Denied</h1>
      <p className="access-denied-view__message">
        You do not have permission to view this page. Contact your administrator if you believe this is an error.
      </p>
    </section>
  );
}

export default AccessDeniedView;
