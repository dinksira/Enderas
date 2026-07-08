import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="public-site">
      <a href="#main-content" className="public-site__skip">
        Skip to main content
      </a>
      <main id="main-content" className="public-site__main">
        <Outlet />
      </main>
    </div>
  );
}

export default PublicLayout;
