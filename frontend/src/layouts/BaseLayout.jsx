import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';

export function BaseLayout() {
  return (
    <div className="base-layout">
      <a href="#main-content" className="base-layout__skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="base-layout__main">
        <div className="base-layout__container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BaseLayout;
