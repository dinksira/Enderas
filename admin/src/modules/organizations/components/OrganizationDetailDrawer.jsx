import { StatusPill, AdminDetailDrawer } from '@enderass/shared/ui-admin';
import { Button } from '@enderass/shared/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { organizationService, shareLinkAdminService } from '@enderass/shared/services';
import { ENV } from '@enderass/shared/api/env';
import { formatDate, formatDisplayValue } from '@enderass/shared/utils';
import { getOrgDisplayName, getOrgStatusVariant } from '../utils/organization-utils.js';
import { VisibilityToggleModal } from './VisibilityToggleModal.jsx';

function MetaField({ label, value }) {
  const { t } = useTranslation();
  return (
    <>
      <dt>{label}</dt>
      <dd>{formatDisplayValue(value, t('common.empty'))}</dd>
    </>
  );
}

function PortalLinkSection({ onRefreshNeeded }) {
  const { t } = useTranslation();
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  function handleCopy(url) {
    try {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="org-drawer__portal-link">
      <p className="org-drawer__portal-hint">
        Use the <strong>Linked Auctions</strong> section below to generate a unique tracking link for each auction.
        Each link opens a dedicated tracking dashboard — no login required.
      </p>
    </div>
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
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState('');
  const [shareLinkPasswords, setShareLinkPasswords] = useState({});
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
      setFetchError('Failed to load linked auctions');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchAvailable = useCallback(async () => {
    if (!orgId) return;
    setFetchError('');
    try {
      const result = await organizationService.getAvailableAuctions(orgId);
      setAvailableAuctions(result.auctions || []);
    } catch {
      setAvailableAuctions([]);
      setFetchError('Failed to load available auctions');
    }
  }, [orgId]);

  useEffect(() => {
    fetchLinked();
  }, [fetchLinked]);

  const handleOpenSelector = async () => {
    setShowSelector(true);
    setSelectedAuctionId('');
    await fetchAvailable();
  };

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
      // Error handled by the service
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
      // Error handled by the service
    } finally {
      setLinking(false);
    }
  };

  const handleGenerateShareLink = async (visibilitySettings) => {
    const auctionId = visModalAuctionId;
    setVisModalOpen(false);
    setGeneratingFor(auctionId);
    setGenError('');
    const customPassword = shareLinkPasswords[auctionId] || undefined;
    try {
      const result = await shareLinkAdminService.create(auctionId, {
        organizationName: orgName || 'External Viewer',
        password: customPassword,
        visibilitySettings,
      });
      setShareLinks((prev) => ({
        ...prev,
        [auctionId]: { url: result.url, password: result.password || null },
      }));
      setCopied('');
    } catch (err) {
      setGenError(err.message);
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

  function handleCopy(url) {
    try {
      navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(url);
      setTimeout(() => setCopied(''), 2000);
    }
  }

  if (loading && linkedAuctions.length === 0) {
    return <p className="kyc-drawer__message">{t('organizations.management.drawer.loadingAuctions')}</p>;
  }

  return (
    <div className="org-drawer__linked-auctions">
      {fetchError && <p className="kyc-drawer__message kyc-drawer__message--error">{fetchError}</p>}

      {linkedAuctions.length === 0 && !showSelector && !fetchError && (
        <p className="kyc-drawer__message">{t('organizations.management.drawer.noLinkedAuctions')}</p>
      )}

      {linkedAuctions.length > 0 && (
        <div className="org-drawer__auctions org-drawer__auctions--compact">
          {linkedAuctions.map((auction) => {
            const linkData = shareLinks[auction.id];
            return (
            <div key={auction.id} className="org-drawer__auction-card org-drawer__auction-card--linked">
              <div className="org-drawer__auction-header">
                <div>
                  <strong>{auction.title}</strong>
                  <div className="org-drawer__auction-meta">
                    <span>{formatDate(auction.startDate, locale)} - {formatDate(auction.endDate, locale)}</span>
                  </div>
                </div>
                <div className="org-drawer__auction-actions">
                  <StatusPill label={auction.status} variant={auction.status === 'published' ? 'active' : 'pending'} />
                  {canUpdate && (
                    <button
                      type="button"
                      className="org-drawer__unlink-btn"
                      onClick={() => handleUnlink(auction.id)}
                      disabled={linking}
                      aria-label={t('organizations.management.drawer.unlinkAuction')}
                    >
                      {t('organizations.management.drawer.unlink')}
                    </button>
                  )}
                </div>
              </div>
              <div className="org-drawer__share-link-row">
                {linkData ? (
                  <div className="org-drawer__share-link-generated">
                    <code className="org-drawer__share-link-url">{linkData.url}</code>
                    {linkData.password && (
                      <div className="org-drawer__share-link-password-wrap">
                        <span className="org-drawer__share-link-password-label">Password:</span>
                        <code className="org-drawer__share-link-password">{linkData.password}</code>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() => handleCopy(linkData.password)}
                        >
                          {copied === linkData.password ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => handleCopy(linkData.url)}
                    >
                      {copied === linkData.url ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                ) : (
                  <div className="org-drawer__share-link-generate-form">
                    <input
                      type="text"
                      className="org-drawer__share-link-password-input"
                      placeholder="Optional password..."
                      value={shareLinkPasswords[auction.id] || ''}
                      onChange={(e) =>
                        setShareLinkPasswords((prev) => ({ ...prev, [auction.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => openVisModal(auction.id, auction.title)}
                      disabled={generatingFor === auction.id}
                    >
                      {generatingFor === auction.id ? 'Generating...' : 'Generate Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {canUpdate && !showSelector && (
        <Button variant="secondary" onClick={handleOpenSelector} style={{ marginTop: 'var(--core-space-3)' }}>
          {t('organizations.management.drawer.linkAuctionBtn')}
        </Button>
      )}

      {showSelector && (
        <div className="org-drawer__link-selector">
          <p className="org-drawer__portal-hint">{t('organizations.management.drawer.selectAuctionHint')}</p>
          {availableAuctions.length === 0 ? (
            <p className="kyc-drawer__message">{t('organizations.management.drawer.noAvailableAuctions')}</p>
          ) : (
            <select
              className="org-drawer__select"
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
          <div className="org-drawer__link-actions">
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
        onClose={() => {
          setVisModalOpen(false);
          setVisModalAuctionId(null);
          setVisModalAuctionTitle('');
        }}
        onConfirm={handleGenerateShareLink}
        auctionTitle={visModalAuctionTitle}
      />
    </div>
  );
}

function ActiveAuctionsSection({ auctions, assets, loading, locale = 'en' }) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="kyc-drawer__message">{t('organizations.management.drawer.loadingAuctions')}</p>;
  }

  if (!auctions || auctions.length === 0) {
    return <p className="kyc-drawer__message">{t('organizations.management.drawer.noActiveAuctions')}</p>;
  }

  return (
    <div className="org-drawer__auctions">
      {auctions.map((auction) => {
        const auctionAssets = assets.filter((a) => a.auction.id === auction.id);
        return (
          <div key={auction.id} className="org-drawer__auction-card">
            <div className="org-drawer__auction-header">
              <strong>{auction.title}</strong>
              <StatusPill label={auction.status} variant={auction.status === 'published' ? 'active' : 'pending'} />
            </div>
            <div className="org-drawer__auction-meta">
              <span>{t('organizations.management.drawer.assetCount', { count: auction.assetCount })}</span>
              <span>{formatDate(auction.startDate, locale)} - {formatDate(auction.endDate, locale)}</span>
            </div>
            <ul className="org-drawer__asset-list">
              {auctionAssets.map((asset) => (
                <li key={asset.id} className="org-drawer__asset-item">
                  <span>{asset.title}</span>
                  <span className="org-drawer__asset-type">{asset.assetType}</span>
                  {asset.desiredReservePrice && (
                    <span className="org-drawer__asset-price">
                      {Number(asset.desiredReservePrice).toLocaleString()} ETB
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function OrganizationDetailDrawer({
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
    { key: 'displayPassword', labelKey: 'password', type: 'text' },
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
      delete payload.newPassword;
      await organizationService.updateOrganization(org.id, payload);
      setEditing(false);
      setEditForm({});
      setShowPasswordField(false);
      await handleRefresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const sections = org
    ? [
        {
          key: 'profile',
          title: t('organizations.management.drawer.profileSection'),
          children: editing ? (
            <div className="org-drawer__edit-form">
              {EDIT_FIELDS.map((field) => (
                <div key={field.key} className="org-drawer__edit-field">
                  <label className="org-drawer__edit-label">
                    {t(`organizations.management.drawer.${field.labelKey}`)}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="org-drawer__edit-input"
                      value={editForm[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt === 'en' ? 'English' : 'አማርኛ'}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="org-drawer__edit-input"
                      value={editForm[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
              {editError && <p className="org-drawer__edit-error">{editError}</p>}
            </div>
          ) : (
            <dl className="kyc-drawer__meta">
              <MetaField label={t('organizations.management.drawer.orgName')} value={org.organizationName} />
              <MetaField label={t('organizations.management.drawer.tinNumber')} value={org.tinNumber} />
              <MetaField label={t('organizations.management.drawer.mobile')} value={org.mobileNumber} />
              <MetaField label={t('organizations.management.drawer.email')} value={org.email} />
              <MetaField label={t('organizations.management.drawer.firstName')} value={org.firstName} />
              <MetaField label={t('organizations.management.drawer.lastName')} value={org.lastName} />
              <MetaField label={t('organizations.management.drawer.password')} value={formatDisplayValue(org.displayPassword, t('common.empty'))} />
              <MetaField label={t('organizations.management.drawer.createdAt')} value={formatDate(org.createdAt, locale, t('common.empty'))} />
            </dl>
          ),
        },
        {
          key: 'portal',
          title: t('organizations.management.drawer.portalSection'),
          children: (
            <PortalLinkSection onRefreshNeeded={() => setRefreshLinked((c) => c + 1)} />
          ),
        },
        {
          key: 'linked-auctions',
          title: t('organizations.management.drawer.linkedAuctionsSection'),
          children: (
            <LinkedAuctionsSection
              orgId={orgId}
              orgName={org?.organizationName || ''}
              onRefreshNeeded={() => setRefreshLinked((c) => c + 1)}
              canUpdate={canUpdate}
              locale={locale}
            />
          ),
        },
        {
          key: 'active-auctions',
          title: t('organizations.management.drawer.activeAuctionsSection'),
          children: (
            <ActiveAuctionsSection
              auctions={activeAuctions?.auctions}
              assets={activeAuctions?.assets}
              loading={auctionsLoading}
              locale={locale}
            />
          ),
        },
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={displayName || t('organizations.management.drawer.title')}
      subtitle={org?.mobileNumber}
      loading={loading}
      error={error}
      onRetry={loadOrg}
      status={
        status ? (
          <StatusPill
            label={t(`organizations.management.status.${status}`, { defaultValue: status })}
            variant={getOrgStatusVariant(status)}
          />
        ) : null
      }
      sections={sections}
      footer={
        !loading && !error && org ? (
          <div className="org-drawer__footer-actions">
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
                  <Button variant="secondary" onClick={startEditing} style={{ marginRight: 'var(--core-space-2)' }}>
                    {t('organizations.management.drawer.edit')}
                  </Button>
                )}
                <Button variant="secondary" onClick={handleRefresh}>
                  {t('organizations.management.drawer.refresh')}
                </Button>
              </>
            )}
          </div>
        ) : null
      }
      titleId="org-detail-drawer-title"
      width={560}
    />
  );
}

export default OrganizationDetailDrawer;
