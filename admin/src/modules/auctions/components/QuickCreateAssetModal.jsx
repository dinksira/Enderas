import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '@enderass/shared/ui';
import { assetService, userService } from '@enderass/shared/services';
import { fileUploadService } from '../../../shared/services/file-upload.service.js';

const ASSET_TYPE_KEYS = [
  'vehicle',
  'machinery',
  'building',
  'land',
  'equipment',
  'salvage',
  'other',
];

function getUserLabel(user) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobileNumber || user.id;
}

function getUserMobile(user) {
  return user.mobileNumber || user.mobile_number || '';
}

function MiniMultiUpload({ label, accept, folder, items, disabled, isImage, onItemsChange }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const results = await Promise.all(
        selected.map((file) => fileUploadService.uploadFile(file, folder)),
      );
      if (isImage) {
        const urls = results
          .map((r) => String(r?.fileUrl || r?.url || '').trim())
          .filter(Boolean);
        onItemsChange([...items, ...urls]);
      } else {
        const docs = results
          .map((r) => ({
            url: String(r?.fileUrl || r?.url || '').trim(),
            name: r?.originalName || r?.fileName || 'Document',
            size: r?.size || 0,
          }))
          .filter((d) => d.url);
        onItemsChange([...items, ...docs]);
      }
    } catch (err) {
      // upload error swallowed — individual files may still succeed
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleRemove = (item) => {
    const url = isImage ? item : item.url;
    fileUploadService.deleteFile(url).catch(() => {});
    if (isImage) {
      onItemsChange(items.filter((u) => u !== item));
    } else {
      onItemsChange(items.filter((d) => d.url !== item.url));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <label style={{ fontWeight: 500, fontSize: '13px', color: '#334155' }}>{label} *</label>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={handleSelect} disabled={disabled || uploading} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 500,
            background: uploading ? '#f1f5f9' : '#f8fafc',
            border: '1px dashed #94a3b8',
            borderRadius: '6px',
            color: uploading ? '#94a3b8' : '#475569',
            cursor: uploading ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {uploading ? (
            <>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Uploading...
            </>
          ) : (
            <>+ {t('common.addFiles', 'Add')}</>
          )}
        </button>
        {items.length > 0 && (isImage ? items : items).map((item, i) => {
          const url = isImage ? item : item.url;
          const name = isImage ? `Photo ${i + 1}` : item.name;
          return (
            <div
              key={url}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px 4px 4px',
                background: '#f1f5f9',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: 1,
              }}
            >
              {isImage ? (
                <img
                  src={url}
                  alt=""
                  style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '16px', lineHeight: '28px' }}>&#128196;</span>
              )}
              <span style={{
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#334155',
              }}>
                {name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: disabled ? 'default' : 'pointer',
                  color: '#94a3b8',
                  fontSize: '14px',
                  padding: '0 2px',
                  lineHeight: 1,
                  fontWeight: 700,
                }}
                title={t('common.remove', 'Remove')}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuickCreateAssetModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User search
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [assetType, setAssetType] = useState('');
  const [description, setDescription] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [location, setLocation] = useState('');
  const [desiredReservePrice, setDesiredReservePrice] = useState('');
  const [auctionConditions, setAuctionConditions] = useState('');
  
  // Files
  const [photoUrls, setPhotoUrls] = useState([]);
  const [ownershipDocs, setOwnershipDocs] = useState([]);

  // Search users with debounce
  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const resp = await userService.listUsers({ search: userSearch, tab: 'active', limit: 10 });
        setUserResults(resp?.users ?? resp?.items ?? []);
      } catch (err) {
        // ignore
      } finally {
        setSearchingUsers(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError(t('auction.create.ownerRequired', 'Please select an owner for this asset.'));
      return;
    }
    if (!title || !assetType || !description || !conditionNotes || !location || !desiredReservePrice || !auctionConditions) {
      setError(t('common.fillRequired', 'Please fill in all required text fields.'));
      return;
    }
    if (!ownershipDocs.length) {
      setError(t('auction.create.docRequired', 'Ownership document is required.'));
      return;
    }
    if (!photoUrls.length) {
      setError(t('auction.create.photoRequired', 'At least one photo is required.'));
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      userId: selectedUser.id,
      title: title.trim(),
      assetType,
      description: description.trim(),
      conditionNotes: conditionNotes.trim(),
      location: location.trim(),
      desiredReservePrice: Number(desiredReservePrice),
      auctionConditions: auctionConditions.trim(),
      imageUrls: photoUrls,
      ownershipDocumentUrl: ownershipDocs[0].url,
      additionalDocuments: ownershipDocs.slice(1).map(d => ({ name: d.name, url: d.url, size: d.size })),
    };

    try {
      const resp = await assetService.staffCreate(payload);
      const newAsset = resp?.asset || resp;
      onSuccess?.(newAsset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ca-picker-overlay ca-animate-in" onMouseDown={onClose}>
      <div 
        className="ca-picker-modal" 
        style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }} 
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ca-picker-header">
          <h3 className="ca-card-title">{t('auction.create.quickCreateAsset', 'Quick Create Asset')}</h3>
          <button type="button" className="ca-picker-close" onClick={onClose} disabled={loading}>×</button>
        </div>
        
        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div className="ca-form-grid" style={{ marginBottom: '24px' }}>
          {/* Owner Selection */}
          <div className="ca-form-group--full">
            <label className="input-field__label">{t('auction.create.assetOwner', 'Asset Owner')} *</label>
            {selectedUser ? (
              <div style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{getUserLabel(selectedUser)} ({getUserMobile(selectedUser)})</span>
                <Button variant="secondary" onClick={() => setSelectedUser(null)} disabled={loading} style={{ padding: '4px 8px', fontSize: '12px' }}>
                  {t('common.change', 'Change')}
                </Button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Input
                  label=""
                  placeholder={t('auction.create.searchUser', 'Search user by name or phone...')}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSearch && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    {searchingUsers && <div style={{ padding: '12px', color: '#64748b' }}>{t('common.loading', 'Loading...')}</div>}
                    {!searchingUsers && userResults.length === 0 && (
                      <div style={{ padding: '12px', color: '#64748b' }}>{t('common.noResults', 'No results found')}</div>
                    )}
                    {!searchingUsers && userResults.map(u => (
                      <div 
                        key={u.id} 
                        style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => { setSelectedUser(u); setUserSearch(''); setUserResults([]); }}
                      >
                        <strong>{getUserLabel(u)}</strong> - {getUserMobile(u)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ca-form-group--full">
            <Input
              label={t('assets.form.fields.title', 'Asset Title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="input-field__label">{t('assets.form.fields.assetType', 'Asset Type')} *</label>
            <select
              className="input-field__control"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              disabled={loading}
            >
              <option value="">{t('assets.form.placeholders.selectAssetType', 'Select Type...')}</option>
              {ASSET_TYPE_KEYS.map((key) => (
                <option key={key} value={key}>{t(`assets.types.${key}`, key)}</option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label={t('assets.form.fields.desiredReservePrice', 'Reserve Price')}
              type="number"
              value={desiredReservePrice}
              onChange={(e) => setDesiredReservePrice(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="ca-form-group--full">
            <label className="input-field__label">{t('assets.form.fields.description', 'Description')} *</label>
            <textarea
              className="input-field__control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label={t('assets.form.fields.location', 'Location')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <Input
              label={t('assets.form.fields.conditionNotes', 'Condition Notes')}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="ca-form-group--full">
            <label className="input-field__label">{t('assets.form.fields.auctionConditions', 'Auction Conditions')} *</label>
            <textarea
              className="input-field__control"
              rows={2}
              value={auctionConditions}
              onChange={(e) => setAuctionConditions(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Photos - compact multi-upload */}
          <div style={{ gridColumn: '1 / -1' }}>
            <MiniMultiUpload
              label={t('assets.form.fields.photos', 'Photos')}
              accept="image/*"
              folder="assets/photos"
              items={photoUrls}
              disabled={loading}
              isImage
              onItemsChange={setPhotoUrls}
            />
          </div>

          {/* Ownership Document - compact multi-upload */}
          <div style={{ gridColumn: '1 / -1' }}>
            <MiniMultiUpload
              label={t('assets.form.fields.ownershipDocument', 'Ownership Document')}
              accept="application/pdf,image/*"
              folder="assets/ownership"
              items={ownershipDocs}
              disabled={loading}
              onItemsChange={setOwnershipDocs}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.loading', 'Creating...') : t('auction.create.createAssetBtn', 'Create Asset')}
          </Button>
        </div>
      </div>
    </div>
  );
}
