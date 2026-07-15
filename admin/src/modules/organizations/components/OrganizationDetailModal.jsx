import { StatusPill } from '@enderass/shared/ui-admin';
import { Button } from '@enderass/shared/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { organizationService, shareLinkAdminService } from '@enderass/shared/services';
import { formatDate, formatDisplayValue } from '@enderass/shared/utils';
import { getOrgDisplayName, getOrgStatusVariant } from '../utils/organization-utils.js';
import { VisibilityToggleModal } from './VisibilityToggleModal.jsx';

function MetaRow({ label, value, highlight }) {
  return (
    <div className={`org-modal__meta-row ${highlight ? 'org-modal__meta-row--hl' : ''}`}>
      <span className="org-modal__meta-label">{label}</span>
      <span className="org-modal__meta-value">{value ?? '\u2014'}</span>
    </div>
  );
}

function PasswordEditInput({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="org-modal__pw-edit">
      <input
        type={visible ? 'text' : 'password'}
        className="org-modal__edit-input org-modal__edit-input--pw"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="org-modal__pw-toggle"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 2 6 2 8s2.5 5 6 5 6-3 6-5-2.5-5-6-5z" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
            <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 2 6 2 8s2.5 5 6 5 6-3 6-5-2.5-5-6-5z" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function PasswordDisplay({ password }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!password) return <span className="org-modal__meta-value">\u2014</span>;

  return (
    <div className="org-modal__pw">
      <span className="org-modal__pw-text" onClick={handleCopy} title="Click to copy">
        {visible ? password : '\u2022'.repeat(Math.min(password.length, 20))}
      </span>
      <span className="org-modal__pw-copied" data-show={copied || undefined}>Copied!</span>
      <button
        type="button"
        className="org-modal__pw-toggle"
        onClick={() => setVisible((v) => !v)}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 2 6 2 8s2.5 5 6 5 6-3 6-5-2.5-5-6-5z" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
            <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3C4.5 3 2 6 2 8s2.5 5 6 5 6-3 6-5-2.5-5-6-5z" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="org-modal__section">
      <h3 className="org-modal__section-title">{title}</h3>
      <div className="org-modal__section-body">{children}</div>
    </div>
  );
}

function PortalInfo() {
  return (
    <p className="org-modal__hint">
      Use the <strong>Linked Auctions</strong> section below to generate a unique tracking link for each auction.
      Each link opens a dedicated tracking dashboard &mdash; no login required.
    </p>
  );
}

function LinkedAuctionsSection({ orgId, orgName, onRefreshNeeded, canUpdate, locale }) {
  const { t } = useTranslation();
  const [linkedAuctions, setLinkedAuctions] = useState([]);
  const [availableAuctions, setAvailableAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState('');
  const [linking, setLinking] = useState(false);
  const [shareLinks, setShareLinks] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const [copied, setCopied] = useState('');
  const [visModalOpen, setVisModalOpen] = useState(false);
  const [visModalAuctionId, setVisModalAuctionId] = useState(null);
  const [visModalAuctionTitle, setVisModalAuctionTitle] = useState('');

  const fetchLinked = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setFetchError('');
    try {
      const result = await organizationService.listLinkedAuctions(orgId);
      setLinkedAuctions(result.auctions || []);
    } catch {
      setLinkedAuctions([]);
      setFetchError(t('organizations.management.drawer.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [orgId, t]);

  const fetchAvailable = useCallback(async () => {
    if (!orgId) return;
    try {
      const result = await organizationService.getAvailableAuctions(orgId);
      setAvailableAuctions(result.auctions || []);
    } catch {
      setAvailableAuctions([]);
    }
  }, [orgId]);

  useEffect(() => { fetchLinked(); }, [fetchLinked]);

  const handleLink = async () => {
    if (!selectedAuctionId) return;
    setLinking(true);
    try {
      await organizationService.linkAuction(orgId, selectedAuctionId);
      setShowSelector(false);
      setSelectedAuctionId('');
      await fetchLinked();
      onRefreshNeeded();
    } catch {
      // handled
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (auctionId) => {
    setLinking(true);
    try {
      await organizationService.unlinkAuction(orgId, auctionId);
      await fetchLinked();
      onRefreshNeeded();
    } catch {
      // handled
    } finally {
      setLinking(false);
    }
  };

  const handleGenerateShareLink = async (auctionId, visibilitySettings) => {
    setGeneratingFor(auctionId);
    setVisModalOpen(false);
    try {
      const result = await shareLinkAdminService.create(auctionId, {
        organizationName: orgName || 'External Viewer',
        visibilitySettings,
      });
      setShareLinks((prev) => ({
        ...prev,
        [auctionId]: { url: result.url },
      }));
      setCopied('');
    } catch {
      // handled
    } finally {
      setGeneratingFor(null);
      setVisModalAuctionId(null);
      setVisModalAuctionTitle('');
    }
  };

  const openVisModal = (auctionId, auctionTitle) => {
    setVisModalAuctionId(auctionId);
    setVisModalAuctionTitle(auctionTitle);
    setVisModalOpen(true);
  };

  const closeVisModal = () => {
    setVisModalOpen(false);
    setVisModalAuctionId(null);
    setVisModalAuctionTitle('');
  };
  const handleCopy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  if (loading && linkedAuctions.length === 0) {
    return <p className="org-modal__empty">{t('organizations.management.drawer.loadingAuctions')}</p>;
  }

  return (
    <div>
      {fetchError && <p className="org-modal__error-msg">{fetchError}</p>}

      {linkedAuctions.length === 0 && !showSelector && !fetchError && (
        <p className="org-modal__empty">{t('organizations.management.drawer.noLinkedAuctions')}</p>
      )}

      {linkedAuctions.length > 0 && (
        <div className="org-modal__linked-list">
          {linkedAuctions.map((auction) => {
            const linkData = shareLinks[auction.id];
            return (
              <div key={auction.id} className="org-modal__linked-card">
                <div className="org-modal__linked-head">
                  <div>
                    <div className="org-modal__linked-title">{auction.title}</div>
                    <div className="org-modal__linked-dates">
                      {formatDate(auction.startDate, locale)} &ndash; {formatDate(auction.endDate, locale)}
                    </div>
                  </div>
                  <div className="org-modal__linked-actions">
                    <StatusPill
                      label={auction.status}
                      variant={auction.status === 'published' ? 'active' : 'pending'}
                    />
                    {canUpdate && (
                      <button
                        type="button"
                        className="org-modal__unlink"
                        onClick={() => handleUnlink(auction.id)}
                        disabled={linking}
                      >
                        {t('organizations.management.drawer.unlink')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="org-modal__share-row">
                  {linkData ? (
                    <div className="org-modal__share-done">
                      <code className="org-modal__share-url">{linkData.url}</code>
                      <button className="btn btn--xs" onClick={() => handleCopy(linkData.url)}>
                        {copied === linkData.url ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => openVisModal(auction.id, auction.title)}
                      disabled={generatingFor === auction.id}
                    >
                      {generatingFor === auction.id ? '...' : 'Generate Link'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canUpdate && !showSelector && (
        <Button variant="secondary" onClick={() => { setShowSelector(true); fetchAvailable(); }} style={{ marginTop: '12px' }}>
          {t('organizations.management.drawer.linkAuctionBtn')}
        </Button>
      )}

      {showSelector && (
        <div className="org-modal__selector">
          <p className="org-modal__hint">{t('organizations.management.drawer.selectAuctionHint')}</p>
          {availableAuctions.length === 0 ? (
            <p className="org-modal__empty">{t('organizations.management.drawer.noAvailableAuctions')}</p>
          ) : (
            <select
              className="org-modal__select"
              value={selectedAuctionId}
              onChange={(e) => setSelectedAuctionId(e.target.value)}
            >
              <option value="">{t('organizations.management.drawer.selectPlaceholder')}</option>
              {availableAuctions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({formatDate(a.startDate, locale)})
                </option>
              ))}
            </select>
          )}
          <div className="org-modal__selector-actions">
            <Button variant="primary" onClick={handleLink} disabled={!selectedAuctionId || linking}>
              {t('organizations.management.drawer.confirmLink')}
            </Button>
            <Button variant="secondary" onClick={() => setShowSelector(false)}>
              {t('organizations.management.drawer.cancelLink')}
            </Button>
          </div>
        </div>
      )}

      <VisibilityToggleModal
        open={visModalOpen}
        onClose={closeVisModal}
        onConfirm={(settings) => handleGenerateShareLink(visModalAuctionId, settings)}
        auctionTitle={visModalAuctionTitle}
      />
    </div>
  );
}

function ActiveAuctionsSection({ auctions, assets, loading, locale }) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="org-modal__empty">{t('organizations.management.drawer.loadingAuctions')}</p>;
  }
  if (!auctions || auctions.length === 0) {
    return <p className="org-modal__empty">{t('organizations.management.drawer.noActiveAuctions')}</p>;
  }

  return (
    <div className="org-modal__active-list">
      {auctions.map((auction) => {
        const auctionAssets = assets ? assets.filter((a) => a.auction?.id === auction.id) : [];
        return (
          <div key={auction.id} className="org-modal__active-card">
            <div className="org-modal__active-head">
              <span className="org-modal__active-title">{auction.title}</span>
              <StatusPill
                label={auction.status}
                variant={auction.status === 'published' ? 'active' : 'pending'}
              />
            </div>
            <div className="org-modal__active-meta">
              <span>{t('organizations.management.drawer.assetCount', { count: auction.assetCount })}</span>
              <span>{formatDate(auction.startDate, locale)} &ndash; {formatDate(auction.endDate, locale)}</span>
            </div>
            {auctionAssets.length > 0 && (
              <ul className="org-modal__asset-list">
                {auctionAssets.map((asset) => (
                  <li key={asset.id} className="org-modal__asset-item">
                    <span>{asset.title}</span>
                    <span className="org-modal__asset-type">{asset.assetType}</span>
                    {asset.desiredReservePrice && (
                      <span className="org-modal__asset-price">
                        {Number(asset.desiredReservePrice).toLocaleString()} ETB
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="org-modal__skeleton">
      <div className="org-modal__sk-line org-modal__sk-line--title" />
      <div className="org-modal__sk-line" />
      <div className="org-modal__sk-line org-modal__sk-line--short" />
      <div className="org-modal__sk-grid">
        <div className="org-modal__sk-cell" />
        <div className="org-modal__sk-cell" />
        <div className="org-modal__sk-cell" />
        <div className="org-modal__sk-cell" />
      </div>
      <div className="org-modal__sk-line org-modal__sk-line--block" />
    </div>
  );
}

export function OrganizationDetailModal({
  orgId,
  open,
  actionLoading = false,
  refreshTrigger = 0,
  onClose,
  onRefreshTable,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);

  const [org, setOrg] = useState(null);
  const [activeAuctions, setActiveAuctions] = useState(null);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshLinked, setRefreshLinked] = useState(0);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const loadOrg = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await organizationService.getOrganizationById(orgId);
      setOrg(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('organizations.management.drawer.loadFailed'));
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, t]);

  const loadActiveAuctions = useCallback(async () => {
    if (!orgId) return;
    setAuctionsLoading(true);
    try {
      const result = await organizationService.getOrganizationActiveAuctions(orgId);
      setActiveAuctions(result);
    } catch {
      setActiveAuctions(null);
    } finally {
      setAuctionsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!open || !orgId) {
      setOrg(null);
      setActiveAuctions(null);
      setError('');
      setEditing(false);
      setEditForm({});
      setEditError('');
      return;
    }
    loadOrg();
    loadActiveAuctions();
  }, [open, orgId, refreshTrigger, loadOrg, loadActiveAuctions]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const canUpdate = can(MODULES.ORGANIZATIONS, ACTIONS.UPDATE);
  const displayName = getOrgDisplayName(org);
  const status = org?.status;

  const handleRefresh = async () => {
    await loadOrg();
    await loadActiveAuctions();
    setRefreshLinked((c) => c + 1);
    onRefreshTable();
  };

  const EDIT_FIELDS = [
    { key: 'organizationName', labelKey: 'orgName', type: 'text' },
    { key: 'tinNumber', labelKey: 'tinNumber', type: 'text' },
    { key: 'mobileNumber', labelKey: 'mobile', type: 'tel' },
    { key: 'email', labelKey: 'email', type: 'email' },
    { key: 'firstName', labelKey: 'firstName', type: 'text' },
    { key: 'lastName', labelKey: 'lastName', type: 'text' },
    { key: 'preferredLanguage', labelKey: 'language', type: 'select', options: ['en', 'am'] },
    { key: 'displayPassword', labelKey: 'password', type: 'password' },
  ];

  const startEditing = () => {
    setEditForm({
      organizationName: org.organizationName || '',
      tinNumber: org.tinNumber || '',
      mobileNumber: org.mobileNumber || '',
      email: org.email || '',
      firstName: org.firstName || '',
      lastName: org.lastName || '',
      preferredLanguage: org.preferredLanguage || 'en',
      displayPassword: org.displayPassword || '',
    });
    setEditError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
    setEditError('');
  };

  const handleFieldChange = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setEditError('');
    try {
      const payload = { ...editForm };
      if (payload.displayPassword) {
        payload.password = payload.displayPassword;
      }
      delete payload.displayPassword;
      await organizationService.updateOrganization(org.id, payload);
      setEditing(false);
      setEditForm({});
      await handleRefresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="org-modal-overlay" onClick={onClose}>
      <div className="org-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button type="button" className="org-modal__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="org-modal__header">
          <div className="org-modal__header-left">
            <div className="org-modal__avatar">
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="org-modal__title">
                {loading ? '...' : displayName || t('organizations.management.drawer.title')}
              </h2>
              {org?.mobileNumber && (
                <span className="org-modal__subtitle">{org.mobileNumber}</span>
              )}
              {status && (
                <div className="org-modal__status">
                  <StatusPill
                    label={t(`organizations.management.status.${status}`, { defaultValue: status })}
                    variant={getOrgStatusVariant(status)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="org-modal__header-actions">
            {!loading && !error && org && (
              <>
                {editing ? (
                  <>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : t('organizations.management.drawer.save')}
                    </Button>
                    <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
                      {t('organizations.management.drawer.cancel')}
                    </Button>
                  </>
                ) : (
                  <>
                    {canUpdate && (
                      <button type="button" className="org-modal__icon-btn" onClick={startEditing} title={t('organizations.management.drawer.edit')}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <button type="button" className="org-modal__icon-btn" onClick={handleRefresh} title={t('organizations.management.drawer.refresh')}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8C2 4.686 4.686 2 8 2C10.5 2 12.628 3.55 13.5 5.5M14 8C14 11.314 11.314 14 8 14C5.5 14 3.372 12.45 2.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 5.5H13.5V2M6 10.5H2.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="org-modal__body">
          {/* Loading */}
          {loading && <ModalSkeleton />}

          {/* Error */}
          {!loading && error && (
            <div className="org-modal__error">
              <p>{error}</p>
              <Button variant="secondary" onClick={loadOrg}>{t('admin.retry')}</Button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && org && (
            <>
              {/* Profile Section */}
              <SectionCard title={t('organizations.management.drawer.profileSection')}>
                {editing ? (
                  <div className="org-modal__edit-grid">
                    {EDIT_FIELDS.map((field) => (
                      <div key={field.key} className="org-modal__edit-field">
                        <label className="org-modal__edit-label">
                          {t(`organizations.management.drawer.${field.labelKey}`)}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            className="org-modal__edit-input"
                            value={editForm[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt === 'en' ? 'English' : '\u12A0\u121B\u122D\u129B'}</option>
                            ))}
                          </select>
                        ) : field.type === 'password' ? (
                          <PasswordEditInput
                            value={editForm[field.key] || ''}
                            onChange={(v) => handleFieldChange(field.key, v)}
                          />
                        ) : (
                          <input
                            type={field.type}
                            className="org-modal__edit-input"
                            value={editForm[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                    {editError && <p className="org-modal__edit-error">{editError}</p>}
                  </div>
                ) : (
                  <div className="org-modal__meta-grid">
                    <MetaRow label={t('organizations.management.drawer.orgName')} value={org.organizationName} />
                    <MetaRow label={t('organizations.management.drawer.tinNumber')} value={org.tinNumber} />
                    <MetaRow label={t('organizations.management.drawer.mobile')} value={org.mobileNumber} />
                    <MetaRow label={t('organizations.management.drawer.email')} value={org.email} />
                    <MetaRow label={t('organizations.management.drawer.firstName')} value={org.firstName} />
                    <MetaRow label={t('organizations.management.drawer.lastName')} value={org.lastName} />
                    <div className="org-modal__meta-row">
                      <span className="org-modal__meta-label">{t('organizations.management.drawer.password')}</span>
                      <PasswordDisplay password={org.displayPassword} />
                    </div>
                    <MetaRow label={t('organizations.management.drawer.createdAt')} value={formatDate(org.createdAt, locale, t('common.empty'))} />
                  </div>
                )}
              </SectionCard>

              {/* Portal Section */}
              <SectionCard title={t('organizations.management.drawer.portalSection')}>
                <PortalInfo />
              </SectionCard>

              {/* Linked Auctions */}
              <SectionCard title={t('organizations.management.drawer.linkedAuctionsSection')}>
                <LinkedAuctionsSection
                  orgId={orgId}
                  orgName={org?.organizationName || ''}
                  onRefreshNeeded={() => setRefreshLinked((c) => c + 1)}
                  canUpdate={canUpdate}
                  locale={locale}
                />
              </SectionCard>

              {/* Active Auctions */}
              <SectionCard title={t('organizations.management.drawer.activeAuctionsSection')}>
                <ActiveAuctionsSection
                  auctions={activeAuctions?.auctions}
                  assets={activeAuctions?.assets}
                  loading={auctionsLoading}
                  locale={locale}
                />
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizationDetailModal;
