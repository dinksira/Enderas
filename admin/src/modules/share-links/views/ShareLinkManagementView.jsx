import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { shareLinkAdminService } from '../services/share-link-admin-service.js';

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareLinkManagementView() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const auctionId = searchParams.get('auctionId');

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [maxViews, setMaxViews] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);
  const [formError, setFormError] = useState(null);

  const loadLinks = useCallback(async () => {
    if (!auctionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await shareLinkAdminService.list(auctionId);
      setLinks(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!orgName.trim()) {
      setFormError('Organization name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    setCreatedLink(null);
    try {
      const result = await shareLinkAdminService.create(auctionId, {
        organizationName: orgName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        password: password || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        maxViews: maxViews ? Number(maxViews) : undefined,
      });
      setCreatedLink(result);
      setOrgName('');
      setContactEmail('');
      setPassword('');
      setExpiresInDays('30');
      setMaxViews('');
      await loadLinks();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id) {
    try {
      await shareLinkAdminService.revoke(id);
      await loadLinks();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCopy(url) {
    if (copyToClipboard(url)) {
      setCopiedId(url);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  if (!auctionId) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">Share Links</h1>
        </div>
        <p style={{ color: '#6c757d', padding: '24px' }}>
          Select an auction to manage its share links. Use <code>?auctionId=... </code>
          in the URL to specify an auction.
        </p>
      </div>
    );
  }

  const isExpired = (link) => {
    return link.expiresAt && new Date(link.expiresAt) < new Date();
  };

  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Share Links</h1>
          <p className="admin-page__subtitle">
            Auction ID: {auctionId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => { setFormOpen(!formOpen); setCreatedLink(null); }}
        >
          {formOpen ? 'Cancel' : 'Generate New Link'}
        </button>
      </header>

      {formOpen && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <h3 className="admin-card__title">Generate Share Link</h3>

          {formError && (
            <div className="alert alert--error" style={{ marginBottom: '16px' }}>{formError}</div>
          )}

          {createdLink && (
            <div className="alert alert--success" style={{ marginBottom: '16px' }}>
              <strong>Link created!</strong>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <code style={{ flex: 1, padding: '8px', background: '#f3f4f6', borderRadius: '6px', fontSize: '13px', wordBreak: 'break-all' }}>
                  {createdLink.url}
                </code>
                <button
                  className="btn btn--sm"
                  onClick={() => handleCopy(createdLink.url)}
                >
                  {copiedId === createdLink.url ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {createdLink.contactEmail && (
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#6c757d' }}>
                  Email sent to {createdLink.contactEmail}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Organization / Person Name *</label>
                <input
                  className="form-input"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. ABC Construction PLC"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password Protection</label>
                <input
                  type="text"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for no password"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Expires In</label>
                <select
                  className="form-input"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="">Never</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: '0 0 120px' }}>
                <label className="form-label">Max Views</label>
                <input
                  type="number"
                  className="form-input"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
              style={{ marginTop: '12px' }}
            >
              {saving ? 'Generating...' : 'Generate Share Link'}
            </button>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-header">
          <h3 className="admin-card__title">Share Links ({links.length})</h3>
        </div>

        {loading && <p style={{ padding: '24px', color: '#6c757d' }}>Loading...</p>}
        {error && <div className="alert alert--error">{error}</div>}

        {!loading && !error && links.length === 0 && (
          <p style={{ padding: '24px', color: '#6c757d' }}>
            No share links created for this auction yet.
          </p>
        )}

        {links.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Views</th>
                <th>Password</th>
                <th>Created</th>
                <th>Last Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const expired = isExpired(link);
                const status = !link.isActive ? 'Revoked' : expired ? 'Expired' : 'Active';
                const statusClass = !link.isActive ? 'badge badge--error' : expired ? 'badge badge--warning' : 'badge badge--success';
                return (
                  <tr key={link.id}>
                    <td><strong>{link.organizationName}</strong></td>
                    <td><span className={statusClass}>{status}</span></td>
                    <td>{link.viewCount}{link.maxViews ? ` / ${link.maxViews}` : ''}</td>
                    <td>{link.hasPassword ? 'Yes' : 'No'}</td>
                    <td style={{ fontSize: '13px', color: '#6c757d' }}>
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '13px', color: '#6c757d' }}>
                      {link.lastAccessedAt ? new Date(link.lastAccessedAt).toLocaleDateString() : '\u2014'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn--sm"
                          onClick={() => handleCopy(link.url)}
                        >
                          {copiedId === link.url ? 'Copied!' : 'Copy Link'}
                        </button>
                        {link.isActive && (
                          <button
                            className="btn btn--sm btn--danger"
                            onClick={() => handleRevoke(link.id)}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default ShareLinkManagementView;
