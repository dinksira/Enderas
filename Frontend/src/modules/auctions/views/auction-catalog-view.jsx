import { useState } from 'react';
import { AuctionList } from '../components/auction-list.jsx';
import { AuctionAdminHeader, AuctionAdminSidebar } from '../components/auction-admin-shell.jsx';
import { ADMIN_PALETTE } from '../components/auction-admin-tokens.js';

export function AuctionCatalogView() {
  const [locale, setLocale] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        background: ADMIN_PALETTE.canvas,
      }}
    >
      <AuctionAdminSidebar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <AuctionAdminHeader
          locale={locale}
          onLocaleChange={setLocale}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px 32px',
            background: ADMIN_PALETTE.canvas,
          }}
        >
          <AuctionList searchQuery={searchQuery} />
        </main>
      </div>
    </div>
  );
}

export default AuctionCatalogView;
