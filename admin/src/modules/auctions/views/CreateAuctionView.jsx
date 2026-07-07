import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { assetService, auctionService } from '@enderass/shared/services';
import { formatEtbAmount } from '@enderass/shared/utils';
import { Input, Button, FileUpload } from '@enderass/shared/ui';
import { QuickCreateAssetModal } from '../components/QuickCreateAssetModal.jsx';
import '../styles/create-auction.css';

const AUCTION_CATEGORIES = [
  'vehicles', 'machinery', 'buildings', 'land', 'equipment', 'salvage_assets', 'other_assets'
];

function generateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_LOT = () => ({ id: generateId(), title: '', sortOrder: 0, assets: [] });
const EMPTY_ASSET = () => ({ id: generateId(), assetId: '', assetTitle: '', reservePrice: '', tags: '' });

export function CreateAuctionView({ open = true, onClose, onSuccess, initialAssetId }) {
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cpoPercentage, setCpoPercentage] = useState('');
  const [documentFee, setDocumentFee] = useState('');
  const [documents, setDocuments] = useState([]);

  const [lots, setLots] = useState([EMPTY_LOT()]);

  const [assetSearch, setAssetSearch] = useState('');
  const [assetResults, setAssetResults] = useState([]);
  const [searchingAsset, setSearchingAsset] = useState(false);
  const [assetPickerTarget, setAssetPickerTarget] = useState(null);
  const [quickCreateTarget, setQuickCreateTarget] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});

  const totalReserve = useMemo(() =>
    lots.reduce((sum, lot) => {
      const assets = Array.isArray(lot.assets) ? lot.assets : [];
      return sum + assets.reduce((a, b) => a + (Number(b.reservePrice) || 0), 0);
    }, 0), [lots]);

  const clearError = (field) => setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const addLot = () => setLots((prev) => [...prev, EMPTY_LOT()]);
  const removeLot = (lotId) => setLots((prev) => prev.filter((l) => l.id !== lotId));
  const updateLot = (lotId, field, value) =>
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, [field]: value } : l)));

  const openAssetPicker = (lotId) => {
    setAssetPickerTarget(lotId);
    setAssetSearch('');
    setAssetResults([]);
  };

  const searchAssets = useCallback(async (query) => {
    if (!query?.trim()) { setAssetResults([]); return; }
    setSearchingAsset(true);
    try {
      const resp = await assetService.getEligibleAssets?.({ search: query, status: 'approved' })
        ?? await assetService.getAll?.({ search: query, status: 'approved' });
      const list = Array.isArray(resp) ? resp : resp?.data ?? resp?.items ?? [];
      setAssetResults(list);
    } catch {
      setAssetResults([]);
    } finally {
      setSearchingAsset(false);
    }
  }, []);

  const pickAsset = (asset) => {
    if (!assetPickerTarget) return;
    const targetLot = lots.find(l => l.id === assetPickerTarget);
    if (targetLot) {
      updateLot(assetPickerTarget, 'assets', [
        ...(targetLot.assets || []),
        { id: generateId(), assetId: asset.id, assetTitle: asset.title ?? asset.name, reservePrice: '', tags: '' },
      ]);
    }
    setAssetPickerTarget(null);
    setAssetSearch('');
    setAssetResults([]);
  };

  const removeAsset = (lotId, assetId) => {
    setLots((prev) => prev.map((l) =>
      l.id === lotId ? { ...l, assets: l.assets.filter((a) => a.id !== assetId) } : l
    ));
  };

  const updateAsset = (lotId, assetId, field, value) => {
    setLots((prev) => prev.map((l) =>
      l.id === lotId
        ? { ...l, assets: l.assets.map((a) => (a.id === assetId ? { ...a, [field]: value } : a)) }
        : l
    ));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!title.trim()) errs.title = t('common.required', 'Required');
    if (!category) errs.category = t('common.required', 'Required');
    if (!startDate) errs.startDate = t('common.required', 'Required');
    if (!endDate) errs.endDate = t('common.required', 'Required');
    if (startDate && endDate && new Date(startDate) >= new Date(endDate))
      errs.endDate = t('auction.create.endDateAfterStart', 'End date must be after start date');
    if (!cpoPercentage || Number(cpoPercentage) <= 0) errs.cpoPercentage = t('common.required', 'Required');
    if (documents.length === 0) errs.documents = t('common.required', 'At least one document is required');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    lots.forEach((lot) => {
      if (!lot.title.trim()) errs[`lot_${lot.id}`] = t('common.required', 'Required');
    });
    if (lots.length === 0) errs.lots = t('auction.create.atLeastOneLot', 'At least one lot is required');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    lots.forEach((lot) => {
      lot.assets.forEach((asset) => {
        if (!asset.reservePrice || Number(asset.reservePrice) <= 0)
          errs[`reserve_${asset.id}`] = t('common.required', 'Required');
      });
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setSubmitting(true);
    setError('');

    const flatAssets = lots.flatMap((lot, idx) => 
      lot.assets.map((a) => ({
        assetId: a.assetId,
        reservePrice: Number(a.reservePrice),
        lotLabel: lot.title.trim() || `Lot ${idx + 1}`,
        sortOrder: lot.sortOrder || idx + 1,
      }))
    );

    const payload = {
      title: title.trim(),
      category,
      description: description.trim(),
      auctionConditions: description.trim(), // Defaulting to description if no explicit conditions field
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      cpoPercentage: Number(cpoPercentage),
      documentFee: Number(documentFee) || 0,
      documents,
      auctionMode: flatAssets.length > 1 ? 'multi' : 'single',
      assets: flatAssets,
      // Pass the lots purely for frontend reference if any subsequent code needs it, 
      // but the backend uses the mapped `assets` array.
      lots: lots.map((lot, idx) => ({
        title: lot.title.trim(),
        sortOrder: lot.sortOrder || idx + 1,
        assets: lot.assets.map((a) => ({
          assetId: a.assetId,
          reservePrice: Number(a.reservePrice),
          tags: a.tags ? a.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        })),
      })),
    };

    try {
      await auctionService.create(payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auction.create.failed', 'Failed to create auction'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const steps = [
    { num: 1, label: t('auction.create.stepDetails', 'Auction Details') },
    { num: 2, label: t('auction.create.stepLots', 'Auction Lots') },
    { num: 3, label: t('auction.create.stepAssets', 'Assets & Tags') },
  ];

  return (
    <div className="create-auction-page">
      {/* Sidebar */}
      <aside className="ca-sidebar">
        <h1 className="ca-title">{t('auction.create.title', 'Create Auction')}</h1>
        <ul className="ca-steps">
          {steps.map((s) => {
            let stateClass = '';
            if (step === s.num) stateClass = 'ca-step--active';
            else if (step > s.num) stateClass = 'ca-step--done';

            return (
              <li key={s.num} className={`ca-step ${stateClass}`}>
                <div className="ca-step-indicator">
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="ca-step-label">{s.label}</span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="ca-main">
        <div className="ca-content ca-animate-in">
          {step === 1 && (
            <div className="ca-step-section">
              <h2 className="ca-step-title">{t('auction.create.stepDetails', 'Auction Details')}</h2>
              <p className="ca-step-subtitle">{t('auction.create.stepDetailsSub', 'Configure the basic settings for this auction.')}</p>

              <div className="ca-form-grid">
                <div className="ca-form-group--full">
                  <Input
                    label={t('auction.create.titleField', 'Auction Title')}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
                    placeholder="e.g., Summer Fleet Vehicle Auction"
                    error={fieldErrors.title}
                  />
                </div>

                <div className="ca-form-group--full">
                  <label className="input-field__label">{t('auction.create.category', 'Category')}</label>
                  <select
                    className={`input-field__control ${fieldErrors.category ? 'input-field__control--error' : ''}`}
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); clearError('category'); }}
                  >
                    <option value="">{t('common.select', 'Select...')}</option>
                    {AUCTION_CATEGORIES.map(c => (
                      <option key={c} value={c}>{t(`dashboard.filters.${c}`, c)}</option>
                    ))}
                  </select>
                  {fieldErrors.category && <span className="input-field__error">{fieldErrors.category}</span>}
                </div>

                <div>
                  <Input
                    label={t('auction.create.startDate', 'Start Date')}
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); clearError('startDate'); }}
                    error={fieldErrors.startDate}
                  />
                </div>

                <div>
                  <Input
                    label={t('auction.create.endDate', 'End Date')}
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); clearError('endDate'); }}
                    error={fieldErrors.endDate}
                  />
                </div>

                <div>
                  <Input
                    label={t('auction.create.cpoPercentage', 'CPO Percentage (%)')}
                    type="number"
                    value={cpoPercentage}
                    onChange={(e) => { setCpoPercentage(e.target.value); clearError('cpoPercentage'); }}
                    placeholder="e.g., 10"
                    error={fieldErrors.cpoPercentage}
                  />
                </div>

                <div>
                  <Input
                    label={t('auction.create.documentFee', 'Document Fee (ETB)')}
                    type="number"
                    value={documentFee}
                    onChange={(e) => setDocumentFee(e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="ca-form-group--full">
                  <label className="input-field__label">{t('auction.create.description', 'Description')}</label>
                  <textarea
                    className="input-field__control"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details about the auction rules or items..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="ca-form-group--full">
                  <label className="input-field__label">{t('auction.create.documents', 'Auction Documents (e.g. Terms & Conditions)')}</label>
                  <FileUpload
                    folder="auctions/documents"
                    accept="application/pdf"
                    onUpload={(result) => {
                      setDocuments(prev => [...prev, {
                        name: result.originalName || result.fileName || 'Document',
                        url: result.fileUrl || result.url || '',
                        size: result.size || 0
                      }]);
                      clearError('documents');
                    }}
                  />
                  {documents.length > 0 && (
                    <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                      {documents.map((d, i) => (
                        <li key={i}>{d.name} <button type="button" onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>x</button></li>
                      ))}
                    </ul>
                  )}
                  {fieldErrors.documents && <span className="input-field__error">{fieldErrors.documents}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="ca-step-section ca-animate-in">
              <h2 className="ca-step-title">{t('auction.create.stepLots', 'Auction Lots')}</h2>
              <p className="ca-step-subtitle">{t('auction.create.stepLotsSub', 'Group your assets into biddable lots. You can add one or multiple lots.')}</p>

              {fieldErrors.lots && <p className="ca-error-text" style={{ marginBottom: 16 }}>{fieldErrors.lots}</p>}

              {lots.map((lot, idx) => (
                <div key={lot.id} className="ca-card">
                  <div className="ca-card-header">
                    <h3 className="ca-card-title">{t('auction.create.lotNumber', 'Lot {{n}}', { n: idx + 1 })}</h3>
                    {lots.length > 1 && (
                      <Button variant="danger" onClick={() => removeLot(lot.id)} style={{ padding: '6px 12px' }}>
                        {t('common.delete', 'Delete')}
                      </Button>
                    )}
                  </div>
                  
                  <div className="ca-form-grid" style={{ marginBottom: 0 }}>
                    <div>
                      <Input
                        label={t('auction.create.lotTitle', 'Lot Title')}
                        value={lot.title}
                        onChange={(e) => { updateLot(lot.id, 'title', e.target.value); clearError(`lot_${lot.id}`); }}
                        placeholder="e.g., Sedans"
                        error={fieldErrors[`lot_${lot.id}`]}
                      />
                    </div>
                    
                    <div>
                      <Input
                        label={t('auction.create.sortOrder', 'Sort Order')}
                        type="number"
                        value={lot.sortOrder}
                        onChange={(e) => updateLot(lot.id, 'sortOrder', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {lots.length < 25 && (
                <Button variant="secondary" onClick={addLot}>
                  + {t('auction.create.addLot', 'Add Another Lot')}
                </Button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="ca-step-section ca-animate-in">
              <h2 className="ca-step-title">{t('auction.create.stepAssets', 'Assets & Tags')}</h2>
              <p className="ca-step-subtitle">{t('auction.create.stepAssetsSub', 'Assign biddable assets to your lots and define their minimum reserve prices.')}</p>

              {lots.map((lot, idx) => (
                <div key={lot.id} className="ca-card">
                  <div className="ca-card-header">
                    <h3 className="ca-card-title">
                      {t('auction.create.lotTitleWithIndex', 'Lot {{n}}: {{title}}', { n: idx + 1, title: lot.title || `Lot ${idx + 1}` })}
                    </h3>
                  </div>

                  {lot.assets.map((asset) => (
                    <div key={asset.id} className="ca-asset-row">
                      <div className="ca-asset-info">
                        <span className="ca-asset-name">{asset.assetTitle || '—'}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <Input
                              label={t('auction.create.reservePrice', 'Reserve Price (ETB)')}
                              type="number"
                              value={asset.reservePrice}
                              onChange={(e) => { updateAsset(lot.id, asset.id, 'reservePrice', e.target.value); clearError(`reserve_${asset.id}`); }}
                              placeholder="0.00"
                              error={fieldErrors[`reserve_${asset.id}`]}
                            />
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <Input
                              label={t('auction.create.tags', 'Tags (comma separated)')}
                              value={asset.tags}
                              onChange={(e) => updateAsset(lot.id, asset.id, 'tags', e.target.value)}
                              placeholder="e.g., damaged, premium"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="danger" onClick={() => removeAsset(lot.id, asset.id)} style={{ padding: '6px 12px' }}>
                        {t('common.remove', 'Remove')}
                      </Button>
                    </div>
                  ))}

                  <Button variant="secondary" onClick={() => openAssetPicker(lot.id)}>
                    + {t('auction.create.addAsset', 'Add Asset to Lot')}
                  </Button>
                </div>
              ))}

              {totalReserve > 0 && (
                <div style={{ padding: '16px', background: '#e0e7ff', borderRadius: '8px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#3730a3' }}>{t('auction.create.totalReserve', 'Total Reserve Price')}:</span>
                  <span style={{ fontWeight: 800, color: '#312e81', fontSize: '18px' }}>{formatEtbAmount(totalReserve)}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <span style={{ color: '#991b1b', fontWeight: 600 }}>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="ca-footer">
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack} disabled={submitting}>
              {t('admin.back', 'Back')}
            </Button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('admin.cancel', 'Cancel')}
          </Button>
          
          {step < 3 ? (
            <Button variant="primary" onClick={handleNext} disabled={submitting}>
              {t('admin.next', 'Next Step')}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('admin.saving', 'Saving...') : t('auction.create.save', 'Create Auction')}
            </Button>
          )}
        </div>
      </footer>

      {/* Asset Picker Modal */}
      {assetPickerTarget && (
        <div className="ca-picker-overlay" onClick={() => setAssetPickerTarget(null)}>
          <div className="ca-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ca-picker-header">
              <h3 className="ca-card-title">{t('auction.create.selectAsset', 'Select an Asset')}</h3>
              <button type="button" className="ca-picker-close" onClick={() => setAssetPickerTarget(null)}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label=""
                  placeholder={t('auction.create.searchAsset', 'Search by asset name or ID...')}
                  value={assetSearch}
                  onChange={(e) => { setAssetSearch(e.target.value); searchAssets(e.target.value); }}
                  autoFocus
                />
              </div>
              <Button 
                variant="primary" 
                onClick={() => { 
                  setQuickCreateTarget(assetPickerTarget); 
                  setAssetPickerTarget(null); 
                  setAssetSearch(''); 
                  setAssetResults([]); 
                }}
              >
                + {t('auction.create.createNewAsset', 'Create New Asset')}
              </Button>
            </div>
            <div className="ca-picker-results">
              {searchingAsset && <p style={{ color: '#64748b', marginTop: '12px' }}>{t('common.loading', 'Loading...')}</p>}
              
              {assetResults.map((a) => (
                <button key={a.id} type="button" className="ca-picker-option" onClick={() => pickAsset(a)}>
                  {a.title ?? a.name ?? a.id}
                </button>
              ))}
              
              {!searchingAsset && assetSearch && assetResults.length === 0 && (
                <p style={{ color: '#94a3b8', marginTop: '12px' }}>{t('auction.create.noAssetsFound', 'No assets found matching your search.')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Asset Modal */}
      <QuickCreateAssetModal
        open={Boolean(quickCreateTarget)}
        onClose={() => setQuickCreateTarget(null)}
        onSuccess={(newAsset) => {
          const targetLot = lots.find(l => l.id === quickCreateTarget);
          if (targetLot) {
            updateLot(quickCreateTarget, 'assets', [
              ...(targetLot.assets || []),
              { 
                id: generateId(), 
                assetId: newAsset.id, 
                assetTitle: newAsset.title ?? newAsset.name, 
                reservePrice: newAsset.desiredReservePrice || newAsset.desired_reserve_price || '', 
                tags: '' 
              },
            ]);
          }
          setQuickCreateTarget(null);
        }}
      />
    </div>
  );
}

export default CreateAuctionView;
