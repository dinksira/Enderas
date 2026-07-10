import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button, FileUpload } from '@enderass/shared/ui';
import { assetService, userService } from '@enderass/shared/services';

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
  const [ownershipDocumentUrl, setOwnershipDocumentUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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
    if (!ownershipDocumentUrl) {
      setError(t('auction.create.docRequired', 'Ownership document is required.'));
      return;
    }
    if (!photoUrl) {
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
      imageUrls: [photoUrl],
      ownershipDocumentUrl,
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

          <div style={{ display: 'flex', gap: '24px', gridColumn: '1 / -1' }}>
            <div style={{ flex: 1 }}>
              <FileUpload
                label={t('assets.form.fields.ownershipDocument', 'Ownership Document')}
                folder="assets/ownership"
                accept="application/pdf,image/*"
                onUpload={(res) => setOwnershipDocumentUrl(res.fileUrl)}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <FileUpload
                label={t('assets.form.fields.photos', 'Primary Photo')}
                folder="assets/photos"
                accept="image/*"
                onUpload={(res) => setPhotoUrl(res.fileUrl)}
                disabled={loading}
              />
            </div>
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
