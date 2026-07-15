import { StatusPill } from '@enderass/shared/ui-admin';
import { Button, Input, ImageViewer } from '@enderass/shared/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '@enderass/shared/auth';
import { auctionService } from '@enderass/shared/services';
import { winnerService } from '@enderass/shared/services';
import {
  formatWinnerAmount,
  getWinnerStatusVariant,
} from '@enderass/shared/utils';
import { validateAuctionStep, AUCTION_STEPS } from '../utils/auction-form-utils.js';
import { formatEtbAmount, normalizeAuctionStatus, resolveMediaUrl, statusPillClass } from '@enderass/shared/utils';
import { AUCTION_CATEGORY_KEYS, buildEditFormFromAuction, buildImagesOnlyUpdatePayload, buildUpdatePayload, canEditAuction, formatFileSize, isImagesOnlyAuctionEdit } from '../utils/auction-drawer-utils.js';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const PDF_ACCEPT = 'application/pdf';

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

function normalizeAuctionDetail(auctionData) {
  if (!auctionData || typeof auctionData !== 'object') {
    return auctionData;
  }

  const data = auctionData;

  return {
    ...auctionData,
    images: toArray(data.images ?? data.imageUrls ?? data.image_urls),
    imageUrls: toArray(data.images ?? data.imageUrls ?? data.image_urls),
    documents: toArray(data.documents ?? data.document_files ?? data.documentFiles),
    conditions: toArray(data.conditions),
  };
}

function DrawerSkeleton() {
  return (
    <div className="auction-drawer-skeleton" aria-hidden="true">
      <div className="auction-drawer-skeleton__line auction-drawer-skeleton__line--title" />
      <div className="auction-drawer-skeleton__line" />
      <div className="auction-drawer-skeleton__grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="auction-drawer-skeleton__cell">
            <div className="auction-drawer-skeleton__line auction-drawer-skeleton__line--short" />
            <div className="auction-drawer-skeleton__line" />
          </div>
        ))}
      </div>
      <div className="auction-drawer-skeleton__line auction-drawer-skeleton__line--block" />
      <div className="auction-drawer-skeleton__line auction-drawer-skeleton__line--block" />
    </div>
  );
}

/**
 * @param {{
 *   auctionId: string|null,
 *   open: boolean,
 *   onClose: () => void,
 *   onRefresh: () => void,
 *   onToast: (message: string, variant?: 'success' | 'error') => void,
 * }} props
 */
export function AuctionDetailDrawer({ auctionId, open, onClose, onRefresh, onToast }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const can = useAuthStore((state) => state.can);
  const isStaff = useAuthStore((state) => state.user?.isStaff);
  const roleCode = useAuthStore((state) => state.permissions?.roleCode ?? state.user?.roleCode);

  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);
  const [winnerSummary, setWinnerSummary] = useState(null);
  const [winnerLoading, setWinnerLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [viewerSrc, setViewerSrc] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !auctionId) {
      setDetail(null);
      setError('');
      setEditMode(false);
      setEditForm(null);
      setEditErrors({});
      return undefined;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await auctionService.getById(auctionId);
        if (cancelled) return;
        const auctionData = normalizeAuctionDetail(response?.auction || response);
        setDetail(auctionData);

        if (normalizeAuctionStatus(auctionData?.status) === 'CLOSED') {
          setWinnerLoading(true);
          try {
            const summary = await winnerService.getWinnersForAuction(auctionId);
            const active = summary.find((row) =>
              ['pending_confirmation', 'confirmed'].includes(row.status),
            );
            setWinnerSummary(active || null);
          } catch {
            setWinnerSummary(null);
          } finally {
            setWinnerLoading(false);
          }
        } else {
          setWinnerSummary(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('auctions.drawer.loadFailed'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, auctionId, t]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !viewerSrc) {
        if (selectedLot) {
          setSelectedLot(null);
        } else if (editMode) {
          setEditMode(false);
          setEditForm(null);
          setEditErrors({});
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, editMode, viewerSrc]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [newImagePreviews]);

  if (!open) {
    return null;
  }

  const displayStatus = normalizeAuctionStatus(detail?.status);
  const editable = detail ? canEditAuction(detail.status) : false;
  const imagesOnlyEdit = detail ? isImagesOnlyAuctionEdit(detail.status) : false;

  const canUpdate = can(MODULES.AUCTIONS, ACTIONS.UPDATE);
  const canPublish = can(MODULES.AUCTIONS, ACTIONS.PUBLISH);
  const canClose = can(MODULES.AUCTIONS, ACTIONS.CLOSE);
  const canDelete = can(MODULES.AUCTIONS, ACTIONS.DELETE);

  const handleEnterEdit = () => {
    if (!detail) return;
    setEditForm(buildEditFormFromAuction(detail));
    setEditErrors({});
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    newImagePreviews.forEach((preview) => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    });
    setNewImagePreviews([]);
    setEditMode(false);
    setEditForm(null);
    setEditErrors({});
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSaveEdit = async () => {
    if (!detail || !editForm) return;

    if (!imagesOnlyEdit) {
      const validationErrors = {
        ...validateAuctionStep(AUCTION_STEPS.BASIC, editForm, t),
        ...validateAuctionStep(AUCTION_STEPS.SCHEDULE, editForm, t),
      };

      const existingDocuments = toArray(editForm.existingDocuments);
      const newDocuments = toArray(editForm.newDocuments);
      const totalDocs = existingDocuments.length + newDocuments.length;
      if (totalDocs === 0) {
        validationErrors.documents = t('auctions.create.errors.documentsRequired');
      }

      if (Object.keys(validationErrors).length > 0) {
        setEditErrors(validationErrors);
        return;
      }
    }

    setActionLoading(true);
    setError('');

    try {
      let formForPayload = { ...editForm };

      if (toArray(editForm.newImages).length > 0) {
        const files = toArray(editForm.newImages).map((entry) => entry.file);
        const uploaded = await auctionService.uploadFiles(files, 'auctions/images');
        formForPayload = {
          ...formForPayload,
          newImages: toArray(editForm.newImages).map((entry, index) => ({
            ...entry,
            url: uploaded[index]?.fileUrl,
          })),
        };
      }

      if (!imagesOnlyEdit && toArray(editForm.newDocuments).length > 0) {
        const files = toArray(editForm.newDocuments).map((entry) => entry.file);
        const uploaded = await auctionService.uploadFiles(files, 'auctions/documents');
        formForPayload = {
          ...formForPayload,
          newDocuments: toArray(editForm.newDocuments).map((entry, index) => ({
            name: entry.name,
            size: entry.size,
            url: uploaded[index]?.fileUrl,
          })),
        };
      }

      const payload = imagesOnlyEdit
        ? buildImagesOnlyUpdatePayload(formForPayload)
        : buildUpdatePayload(formForPayload);
      const response = await auctionService.update(detail.id, payload);
      const updated = normalizeAuctionDetail(response?.auction || response);

      setDetail(updated);
      setEditMode(false);
      setEditForm(null);
      newImagePreviews.forEach((preview) => {
        if (preview?.url) URL.revokeObjectURL(preview.url);
      });
      setNewImagePreviews([]);
      onRefresh();
      onToast(t('auctions.drawer.saveSuccess'), 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auctions.drawer.saveFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (actionFn, successKey) => {
    if (!detail) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await actionFn(detail.id);
      const updated = normalizeAuctionDetail(response?.auction || response);
      if (updated?.id || updated?.deleted) {
        if (updated.deleted) {
          onRefresh();
          onToast(t(successKey), 'success');
          onClose();
          return;
        }
        setDetail(updated);
        onRefresh();
        onToast(t(successKey), 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auctions.drawer.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAuction = async () => {
    if (!detail) return;

    setActionLoading(true);
    setError('');

    try {
      onToast(t('auctions.drawer.closingInProgress'), 'success');
      const response = await auctionService.close(detail.id);
      const updated = normalizeAuctionDetail(response?.auction || response);
      const selection = response?.winnerSelection;

      if (updated?.id) {
        setDetail(updated);
        onRefresh();
      }

      if (selection?.winner) {
        setWinnerSummary(selection.winner);
        onToast(t('auctions.drawer.closeWinnerSelected'), 'success');
      } else if (selection?.noReserveMet) {
        setWinnerSummary(null);
        onToast(t('auctions.drawer.closeNoReserveMet'), 'success');
      } else if (selection?.noBids) {
        setWinnerSummary(null);
        onToast(t('auctions.drawer.closeNoBids'), 'success');
      } else {
        onToast(t('auctions.drawer.closeSuccess'), 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auctions.drawer.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleNewImages = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length || !editForm) return;

    const previews = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setEditForm((current) => ({
      ...current,
      newImages: [...toArray(current.newImages), ...previews],
    }));
    setNewImagePreviews((current) => [...toArray(current), ...previews]);
    event.target.value = '';
  };

  const handleNewDocuments = (event) => {
    const selected = Array.from(event.target.files || []).filter(
      (file) => file.type === 'application/pdf',
    );
    if (!selected.length || !editForm) return;

    setEditForm((current) => ({
      ...current,
      newDocuments: [
        ...toArray(current.newDocuments),
        ...selected.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          name: file.name,
          size: file.size,
        })),
      ],
    }));
    event.target.value = '';
  };

  const images = editMode
    ? [
        ...toArray(editForm?.existingImageUrls),
        ...toArray(newImagePreviews).map((p) => p.url),
      ]
    : toArray(detail?.imageUrls ?? detail?.images);

  const documents = editMode
    ? [...toArray(editForm?.existingDocuments), ...toArray(editForm?.newDocuments)]
    : toArray(detail?.documents);

  return (
    <>
      <div
        className={`auction-drawer-overlay${visible ? ' auction-drawer-overlay--visible' : ''}`}
        role="presentation"
        onClick={onClose}
      >
        <aside
          className={`auction-drawer${visible ? ' auction-drawer--visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auction-drawer-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="auction-drawer__header">
            <div className="auction-drawer__header-main">
              <div className="auction-drawer__title-row">
                <h2 id="auction-drawer-title" className="auction-drawer__title">
                  {loading ? t('common.loading') : detail?.title || t('auctions.drawer.title')}
                </h2>
                {detail && !editMode && (
                  <span className={`dashboard-status-pill ${statusPillClass(detail.status)}`}>
                    {t(`status.${displayStatus.toLowerCase()}`)}
                  </span>
                )}
              </div>
              {detail && (
                <p className="auction-drawer__auction-id">
                  {t('auctions.drawer.auctionId', { id: detail.id })}
                </p>
              )}
            </div>

            <div className="auction-drawer__header-actions">
              {detail && editable && canUpdate && !editMode && (
                <button
                  type="button"
                  className="auction-drawer__edit-btn"
                  onClick={handleEnterEdit}
                  disabled={actionLoading}
                >
                  {t('auctions.drawer.edit')}
                </button>
              )}
              <button
                type="button"
                className="auction-drawer__close"
                onClick={editMode ? handleCancelEdit : onClose}
                aria-label={t('common.close')}
              >
                ×
              </button>
            </div>
          </header>

          <div className="auction-drawer__body">
            {loading && <DrawerSkeleton />}

            {error && (
              <p className="kyc-drawer__error" role="alert">
                {error}
              </p>
            )}

            {!loading && detail && !editMode && (
              <>
                <section className="kyc-drawer__section">
                  <dl className="kyc-drawer__meta">
                    <div>
                      <dt>{t('auctions.drawer.fields.category')}</dt>
                      <dd>{t(`category.${detail.categoryKey || detail.category}`)}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.startDate')}</dt>
                      <dd>{detail.startDateFormatted || detail.startingDate}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.endDate')}</dt>
                      <dd>{detail.endDateFormatted || detail.endingDate}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.reservePrice')}</dt>
                      <dd>{formatEtbAmount(detail.reservePrice)}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.documentFee')}</dt>
                      <dd>{formatEtbAmount(detail.documentFee)}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.cpoPercentage')}</dt>
                      <dd>{detail.cpoPercentage}%</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.totalBids')}</dt>
                      <dd>{detail.bids ?? detail.bidCount ?? 0}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.createdBy')}</dt>
                      <dd>{detail.createdByName || '—'}</dd>
                    </div>
                    <div>
                      <dt>{t('auctions.drawer.fields.createdAt')}</dt>
                      <dd>{detail.createdAtFormatted || '—'}</dd>
                    </div>
                  </dl>
                </section>

                {detail.lots?.length > 0 && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">
                      {t('auctions.create.review.lotsTitle')}
                      {detail.auctionMode === 'multi' && detail.lotCount > 1
                        ? ` (${detail.lotCount})`
                        : ''}
                    </h3>
                    <ul className="auction-create-modal__lot-list">
                      {detail.lots.map((lot, index) => {
                        return (
                          <li
                            key={lot.id || lot.assetId}
                            className="auction-create-modal__lot-item"
                            style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            onClick={() => setSelectedLot(lot)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLot(lot); } }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <p className="auction-create-modal__lot-title" style={{ margin: 0, fontWeight: 500, color: 'var(--dashboard-text-primary)' }}>
                                {lot.title || t('auctions.create.assetStep.lotPosition', { index: index + 1 })}
                              </p>
                              {(() => {
                                const totalReserve = (lot.assets || []).reduce((sum, asset) => sum + (Number((asset.asset || asset).reservePrice) || 0), 0);
                                return totalReserve > 0 ? (
                                  <p className="auction-create-modal__lot-meta" style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: 'var(--dashboard-text-primary)' }}>
                                    {formatEtbAmount(totalReserve)}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--primary-color)', margin: 0, marginTop: '4px' }}>
                              View Lot Details &rarr;
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    {detail.auctionMode === 'multi' && detail.totalReservePrice != null && (
                      <p className="auction-create-modal__section-hint">
                        {t('auctions.create.assetStep.totalReserve', {
                          amount: Number(detail.totalReservePrice).toLocaleString(),
                        })}
                      </p>
                    )}
                  </section>
                )}

                {toArray(images).length > 0 && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('auctions.drawer.sections.images')}</h3>
                    <div className="auction-drawer__thumbnails" role="list">
                      {toArray(images).map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          className="auction-drawer__thumbnail"
                          onClick={() => setViewerSrc(resolveMediaUrl(url))}
                          aria-label={t('auctions.drawer.viewImage', { index: index + 1 })}
                        >
                          <img src={resolveMediaUrl(url)} alt="" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {isStaff && toArray(documents).length > 0 && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('auctions.drawer.sections.documents')}</h3>
                    <ul className="auction-drawer__documents">
                      {toArray(documents).map((doc, index) => (
                        <li key={`${doc.url}-${index}`} className="auction-drawer__document-item">
                          <div>
                            <p className="auction-drawer__document-name">{doc.name}</p>
                            <p className="auction-drawer__document-size">{formatFileSize(doc.size)}</p>
                          </div>
                          <a
                            href={resolveMediaUrl(doc.url)}
                            className="auction-drawer__download-btn"
                            download={doc.name}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('auctions.drawer.download')}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {detail.description && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('auctions.drawer.sections.description')}</h3>
                    <p className="auction-drawer__text-block">{detail.description}</p>
                  </section>
                )}

                {detail.auctionConditions && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('auctions.drawer.sections.conditions')}</h3>
                    <p className="auction-drawer__text-block">{detail.auctionConditions}</p>
                  </section>
                )}

                {displayStatus === 'CLOSED' && (
                  <section className="kyc-drawer__section">
                    <h3 className="kyc-drawer__section-title">{t('winners.management.auctionSection.winnerBlockTitle')}</h3>
                    {winnerLoading && (
                      <p className="auction-drawer__text-block">{t('dashboard.table.loading')}</p>
                    )}
                    {!winnerLoading && winnerSummary && (
                      <dl className="kyc-drawer__meta">
                        <div>
                          <dt>{t('winners.management.winnerSection.fullName')}</dt>
                          <dd>{winnerSummary.winnerName || '—'}</dd>
                        </div>
                        <div>
                          <dt>{t('winners.management.bidSection.amount')}</dt>
                          <dd>{formatWinnerAmount(winnerSummary.bidAmount, roleCode, t)}</dd>
                        </div>
                        <div>
                          <dt>{t('winners.management.table.headers.status')}</dt>
                          <dd>
                            <StatusPill
                              label={t(`winners.management.status.${winnerSummary.status}`, {
                                defaultValue: winnerSummary.status,
                              })}
                              variant={getWinnerStatusVariant(winnerSummary.status)}
                            />
                          </dd>
                        </div>
                      </dl>
                    )}
                    {!winnerLoading && !winnerSummary && (
                      <p className="asset-page__rejection-reason" role="status">
                        {(detail.bids ?? detail.bidCount ?? 0) === 0
                          ? t('auctions.drawer.closeNoBids')
                          : t('winners.management.noReserveMet')}
                      </p>
                    )}
                    {winnerSummary?.id && (
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`${ROUTES.APP_WINNERS}?winner=${winnerSummary.id}`)}
                      >
                        {t('winners.management.drawer.viewDetails')}
                      </Button>
                    )}
                  </section>
                )}
              </>
            )}

            {!loading && detail && editMode && editForm && (
              <div className="auction-drawer__edit-form">
                {imagesOnlyEdit && (
                  <p className="auction-create-modal__section-hint">
                    {t('auctions.drawer.imagesOnlyHint', {
                      defaultValue: 'Published auctions can only update listing photos. Other fields stay locked.',
                    })}
                  </p>
                )}

                {!imagesOnlyEdit && (
                  <>
                <Input
                  label={t('auctions.create.fields.title')}
                  value={editForm.title}
                  onChange={(event) => updateEditField('title', event.target.value)}
                  error={editErrors.title}
                  disabled={actionLoading}
                />

                <div className="input-field">
                  <label className="input-field__label" htmlFor="drawer-edit-category">
                    {t('auctions.create.fields.category')}
                  </label>
                  <select
                    id="drawer-edit-category"
                    className={[
                      'input-field__control',
                      'auction-create-modal__select',
                      editErrors.category ? 'input-field__control--error' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    value={editForm.category}
                    onChange={(event) => updateEditField('category', event.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="">{t('auctions.create.placeholders.selectCategory')}</option>
                    {AUCTION_CATEGORY_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`category.${key}`)}
                      </option>
                    ))}
                  </select>
                  {editErrors.category && (
                    <span className="input-field__error" role="alert">
                      {editErrors.category}
                    </span>
                  )}
                </div>

                <div className="input-field">
                  <label className="input-field__label" htmlFor="drawer-edit-description">
                    {t('auctions.create.fields.description')}
                  </label>
                  <textarea
                    id="drawer-edit-description"
                    className="kyc-modal__textarea"
                    rows={3}
                    value={editForm.description}
                    onChange={(event) => updateEditField('description', event.target.value)}
                    disabled={actionLoading}
                  />
                </div>

                <Input
                  label={t('auctions.create.fields.startDate')}
                  type="datetime-local"
                  value={editForm.startDate}
                  onChange={(event) => updateEditField('startDate', event.target.value)}
                  error={editErrors.startDate}
                  disabled={actionLoading}
                />

                <Input
                  label={t('auctions.create.fields.endDate')}
                  type="datetime-local"
                  value={editForm.endDate}
                  onChange={(event) => updateEditField('endDate', event.target.value)}
                  error={editErrors.endDate}
                  disabled={actionLoading}
                />

                <Input
                  label={t('auctions.create.fields.reservePrice')}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.reservePrice}
                  onChange={(event) => updateEditField('reservePrice', event.target.value)}
                  error={editErrors.reservePrice}
                  disabled={actionLoading}
                />

                <Input
                  label={t('auctions.create.fields.documentFee')}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.documentFee}
                  onChange={(event) => updateEditField('documentFee', event.target.value)}
                  error={editErrors.documentFee}
                  disabled={actionLoading}
                />

                <Input
                  label={t('auctions.create.fields.cpoPercentage')}
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={editForm.cpoPercentage}
                  onChange={(event) => updateEditField('cpoPercentage', event.target.value)}
                  error={editErrors.cpoPercentage}
                  disabled={actionLoading}
                />

                <div className="input-field">
                  <label className="input-field__label" htmlFor="drawer-edit-conditions">
                    {t('auctions.create.fields.auctionConditions')}
                  </label>
                  <textarea
                    id="drawer-edit-conditions"
                    className="kyc-modal__textarea"
                    rows={4}
                    value={editForm.auctionConditions}
                    onChange={(event) => updateEditField('auctionConditions', event.target.value)}
                    disabled={actionLoading}
                  />
                  {editErrors.auctionConditions && (
                    <span className="input-field__error" role="alert">
                      {editErrors.auctionConditions}
                    </span>
                  )}
                </div>
                  </>
                )}

                <section className="auction-drawer__edit-upload">
                  <h3 className="kyc-drawer__section-title">{t('auctions.drawer.addImages')}</h3>
                  <button
                    type="button"
                    className="auction-create-modal__browse-btn"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={actionLoading}
                  >
                    {t('common.selectFile')}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    hidden
                    onChange={handleNewImages}
                  />
                </section>

                {toArray(images).length > 0 && (
                  <div className="auction-drawer__thumbnails" role="list">
                    {toArray(images).map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        className="auction-drawer__thumbnail"
                        onClick={() => setViewerSrc(url)}
                        aria-label={t('auctions.drawer.viewImage', { index: index + 1 })}
                      >
                        <img src={url} alt="" />
                      </button>
                    ))}
                  </div>
                )}

                {!imagesOnlyEdit && (
                <section className="auction-drawer__edit-upload">
                  <h3 className="kyc-drawer__section-title">{t('auctions.drawer.addDocuments')}</h3>
                  <button
                    type="button"
                    className="auction-create-modal__browse-btn"
                    onClick={() => documentInputRef.current?.click()}
                    disabled={actionLoading}
                  >
                    {t('common.selectFile')}
                  </button>
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept={PDF_ACCEPT}
                    multiple
                    hidden
                    onChange={handleNewDocuments}
                  />
                  {editErrors.documents && (
                    <span className="input-field__error" role="alert">
                      {editErrors.documents}
                    </span>
                  )}
                </section>
                )}
              </div>
            )}
          </div>

          {detail && (
            <footer className="auction-drawer__footer">
              {editMode ? (
                <>
                  <Button variant="secondary" onClick={handleCancelEdit} disabled={actionLoading}>
                    {t('auctions.drawer.cancelEdit')}
                  </Button>
                  <Button variant="primary" onClick={handleSaveEdit} disabled={actionLoading}>
                    {actionLoading ? t('auctions.drawer.saving') : t('auctions.drawer.save')}
                  </Button>
                </>
              ) : (
                <>
                  {displayStatus === 'PENDING' && (
                    <>
                      {canPublish && (
                        <Button
                          variant="primary"
                          onClick={() => runAction(auctionService.publish, 'auctions.drawer.publishSuccess')}
                          disabled={actionLoading}
                        >
                          {t('auctions.drawer.actions.publish')}
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="secondary"
                          className="btn--warning"
                          onClick={() => runAction(auctionService.suspend, 'auctions.drawer.suspendSuccess')}
                          disabled={actionLoading}
                        >
                          {t('auctions.drawer.actions.suspend')}
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="secondary"
                          className="btn--danger"
                          onClick={() => runAction(auctionService.remove, 'auctions.drawer.deleteSuccess')}
                          disabled={actionLoading}
                        >
                          {t('auctions.drawer.actions.delete')}
                        </Button>
                      )}
                    </>
                  )}

                  {displayStatus === 'ACTIVE' && (
                    <>
                      {canUpdate && (
                        <Button
                          variant="secondary"
                          className="btn--warning"
                          onClick={() => runAction(auctionService.suspend, 'auctions.drawer.suspendSuccess')}
                          disabled={actionLoading}
                        >
                          {t('auctions.drawer.actions.suspendAuction')}
                        </Button>
                      )}
                      {canClose && (
                        <Button
                          variant="secondary"
                          onClick={handleCloseAuction}
                          disabled={actionLoading}
                        >
                          {actionLoading
                            ? t('auctions.drawer.closingInProgress')
                            : t('auctions.drawer.actions.close')}
                        </Button>
                      )}
                    </>
                  )}

                  {displayStatus === 'SUSPENDED' && (
                    <>
                      {canUpdate && (
                        <Button
                          variant="primary"
                          onClick={() => runAction(auctionService.reactivate, 'auctions.drawer.reactivateSuccess')}
                          disabled={actionLoading}
                        >
                          {t('auctions.drawer.actions.reactivate')}
                        </Button>
                      )}
                      {canClose && (
                        <Button
                          variant="secondary"
                          onClick={handleCloseAuction}
                          disabled={actionLoading}
                        >
                          {actionLoading
                            ? t('auctions.drawer.closingInProgress')
                            : t('auctions.drawer.actions.close')}
                        </Button>
                      )}
                    </>
                  )}

                  {displayStatus === 'CLOSED' && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(ROUTES.APP_WINNERS)}
                      disabled={actionLoading}
                    >
                      {t('auctions.drawer.actions.viewWinners')}
                    </Button>
                  )}
                </>
              )}
            </footer>
          )}
        </aside>
      </div>

      {/* Lot Details Mini Modal */}
      {selectedLot && (
        <div
          className="auction-drawer-overlay auction-drawer-overlay--visible"
          role="presentation"
          onClick={() => setSelectedLot(null)}
          style={{ zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="auction-drawer"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', background: 'var(--dashboard-surface-bg, #ffffff)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transform: 'none', right: 'auto', top: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dashboard-border, #e5e7eb)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--dashboard-surface-bg, #f9fafb)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--dashboard-text-primary, #111827)' }}>
                  {selectedLot.title || t('auctions.create.assetStep.lotPosition', { index: 1 })}
                </h3>
                {(() => {
                  const totalReserve = (selectedLot.assets || []).reduce((sum, asset) => sum + (Number((asset.asset || asset).reservePrice) || 0), 0);
                  return totalReserve > 0 ? (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--dashboard-text-secondary, #4b5563)' }}>
                      Reserve Price: <span style={{ fontWeight: 600, color: 'var(--dashboard-text-primary, #111827)' }}>{formatEtbAmount(totalReserve)}</span>
                    </p>
                  ) : null;
                })()}
              </div>
              <button
                type="button"
                className="auction-drawer__close"
                onClick={() => setSelectedLot(null)}
                aria-label={t('common.close')}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--dashboard-hover-bg, #f3f4f6)', color: 'var(--dashboard-text-secondary, #6b7280)', border: 'none', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: 'var(--dashboard-text-primary, #111827)' }}>
              {selectedLot.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dashboard-text-secondary, #6b7280)' }}>Description</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--dashboard-text-secondary, #4b5563)' }}>{selectedLot.description}</p>
                </div>
              )}
              
              {(() => {
                const lotImages = toArray(
                  selectedLot.images || selectedLot.imageUrls || selectedLot.image_urls ||
                  (selectedLot.asset && (selectedLot.asset.image_urls || selectedLot.asset.imageUrls || selectedLot.asset.images))
                ).map(resolveMediaUrl).filter(Boolean);
                if (lotImages.length === 0) return null;
                return (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dashboard-text-secondary, #6b7280)' }}>Lot Images</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {lotImages.map((img, i) => (
                        <div key={i} style={{ aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#eee' }} onClick={() => setViewerSrc(img)}>
                          <img src={img} alt={`Lot Image ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedLot.assets && selectedLot.assets.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dashboard-text-secondary, #6b7280)' }}>Included Assets ({selectedLot.assets.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedLot.assets.map((aa, aIdx) => {
                      const assetImages = toArray(aa.assetImages || aa.imageUrls || aa.image_urls).map(resolveMediaUrl).filter(Boolean);
                      return (
                        <div key={aa.id || aIdx} style={{ background: 'var(--dashboard-surface-bg, #ffffff)', border: '1px solid var(--dashboard-border, #e5e7eb)', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h5 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500, color: 'var(--dashboard-text-primary, #111827)' }}>{aa.assetTitle || aa.title}</h5>
                            {aa.reservePrice != null && (
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--dashboard-text-secondary, #4b5563)', background: 'var(--dashboard-surface-bg, #f3f4f6)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--dashboard-border, #e5e7eb)' }}>
                                {formatEtbAmount(aa.reservePrice)}
                              </span>
                            )}
                          </div>
                          {(aa.assetDescription || aa.description) && (
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--dashboard-text-secondary, #4b5563)' }}>{aa.assetDescription || aa.description}</p>
                          )}
                          {assetImages.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                              {assetImages.map((img, i) => (
                                <img key={i} src={img} alt={`Asset Image ${i}`} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--dashboard-border, #e5e7eb)', flexShrink: 0 }} onClick={() => setViewerSrc(img)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </>
  );
}

export default AuctionDetailDrawer;
