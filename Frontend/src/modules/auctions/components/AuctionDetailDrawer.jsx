import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { ImageViewer } from '../../../components/ImageViewer.jsx';
import { ROUTES } from '../../../config/routes.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { auctionService } from '../services/auction-service.js';
import { resolveMediaUrl } from '../../../utils/media-url.js';
import { winnerService } from '../../winners/services/winner-service.js';
import {
  canViewBidAmounts,
  formatWinnerAmount,
  getWinnerStatusVariant,
} from '../../winners/utils/winner-management-utils.js';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { validateAuctionStep, AUCTION_STEPS } from '../utils/auction-form-utils.js';
import {
  AUCTION_CATEGORY_KEYS,
  buildEditFormFromAuction,
  buildUpdatePayload,
  canEditAuction,
  formatEtbAmount,
  formatFileSize,
  normalizeAuctionStatus,
  statusPillClass,
} from '../utils/auction-drawer-utils.js';

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
        if (editMode) {
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

      if (toArray(editForm.newDocuments).length > 0) {
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

      const payload = buildUpdatePayload(formForPayload);
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
                      {detail.lots.map((lot, index) => (
                        <li key={lot.id || lot.assetId} className="auction-create-modal__lot-item">
                          <p className="auction-create-modal__lot-title">
                            {lot.lotLabel || t('auctions.create.assetStep.lotPosition', { index: index + 1 })}
                            {' — '}
                            {lot.assetTitle || lot.assetId}
                          </p>
                          <p className="auction-create-modal__lot-meta">
                            {formatEtbAmount(lot.reservePrice)}
                            {lot.assetLocation ? ` · ${lot.assetLocation}` : ''}
                          </p>
                        </li>
                      ))}
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
                          onClick={() => setViewerSrc(url)}
                          aria-label={t('auctions.drawer.viewImage', { index: index + 1 })}
                        >
                          <img src={url} alt="" />
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

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </>
  );
}

export default AuctionDetailDrawer;
