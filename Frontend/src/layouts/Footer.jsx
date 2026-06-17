import { APP_CONFIG } from '../config/app.js';
import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__title">{APP_CONFIG.name}</p>
        <p className="footer__text">
          &copy; {year} {APP_CONFIG.organization}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
