import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button.jsx';
import { AdminDetailDrawer } from '../../../components/admin/AdminDetailDrawer.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { ROUTES } from '../../../config/routes.js';
import { MODULES, ACTIONS } from '../../../config/navigation.config.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { userService } from '../services/user-service.js';
import {
  formatDate,
  formatDisplayValue,
  getUserDisplayName,
  getUserStatusVariant,
} from '../utils/user-management-utils.js';

function MetaField({ label, value }) {
  const { t } = useTranslation();

  return (
    <>
      <dt>{label}</dt>
      <dd>{formatDisplayValue(value, t('common.empty'))}</dd>
    </>
  );
}

/**
 * @param {{
 *   userId: string|null,
 *   open: boolean,
 *   actionLoading?: boolean,
 *   refreshTrigger?: number,
 *   onClose: () => void,
 *   onEdit: (user: object) => void,
 *   onDelete: (user: object) => void,
 *   onSuspend: (user: object) => void,
 *   onDeactivate: (user: object) => void,
 *   onActivate: (user: object) => void,
 *   onRefreshTable: () => void,
 * }} props
 */
export function UserDetailDrawer({
  userId,
  open,
  actionLoading = false,
  refreshTrigger = 0,
  onClose,
  onEdit,
  onDelete,
  onSuspend,
  onDeactivate,
  onActivate,
  onRefreshTable,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'am' ? 'am' : 'en';
  const can = useAuthStore((state) => state.can);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const detail = await userService.getUserById(userId);
      setUser(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.management.drawer.loadFailed'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      setError('');
      return undefined;
    }

    loadUser();

    return undefined;
  }, [open, userId, refreshTrigger, loadUser]);

  const canUpdate = can(MODULES.USERS, ACTIONS.UPDATE);
  const canDelete = can(MODULES.USERS, ACTIONS.DELETE);
  const displayName = getUserDisplayName(user);
  const status = user?.status;
  const isOrganization = user?.userType === 'organization';

  const formatVerified = (verified) =>
    verified ? t('users.management.drawer.verifiedYes') : t('users.management.drawer.verifiedNo');

  const formatLanguage = (language) => {
    if (language === 'am') return t('common.languages.amharic');
    if (language === 'en') return t('common.languages.english');
    return language;
  };

  const handleRefresh = async () => {
    await loadUser();
    onRefreshTable();
  };

  const headerActions =
    user && user.id && canUpdate && !user.isStaff && !loading && !error ? (
      <button
        type="button"
        className="admin-drawer__edit-btn"
        onClick={() => {
          if (!user?.id) {
            console.error('UserDetailDrawer: user.id is undefined', user);
            return;
          }
          onEdit(user);
        }}
        disabled={actionLoading}
      >
        {t('users.management.drawer.edit')}
      </button>
    ) : null;

  const footer =
    !loading && !error && user ? (
      <>
        {canUpdate && !user.isStaff && status === 'active' && (
          <>
            <Button variant="secondary" disabled={actionLoading} onClick={() => onSuspend(user)}>
              {t('users.management.drawer.suspend')}
            </Button>
            <Button variant="secondary" disabled={actionLoading} onClick={() => onDeactivate(user)}>
              {t('users.management.drawer.deactivate')}
            </Button>
          </>
        )}
        {canUpdate &&
          !user.isStaff &&
          (status === 'suspended' || status === 'deactivated') && (
            <Button variant="primary" disabled={actionLoading} onClick={() => onActivate(user)}>
              {t('users.management.drawer.activate')}
            </Button>
          )}
        {canDelete && !user.isStaff && (
          <Button variant="secondary" disabled={actionLoading} onClick={() => onDelete(user)}>
            {t('users.management.drawer.delete')}
          </Button>
        )}
        <Button variant="secondary" disabled={loading || actionLoading} onClick={handleRefresh}>
          {t('users.management.drawer.refresh')}
        </Button>
      </>
    ) : null;

  const sections = user
    ? [
        {
          key: 'profile',
          title: t('users.management.drawer.profileSection'),
          children: (
            <dl className="kyc-drawer__meta">
              {isOrganization ? (
                <MetaField
                  label={t('users.management.drawer.organizationName')}
                  value={user.organizationName}
                />
              ) : (
                <>
                  <MetaField label={t('users.management.drawer.firstName')} value={user.firstName} />
                  <MetaField label={t('users.management.drawer.lastName')} value={user.lastName} />
                </>
              )}
              <MetaField label={t('users.management.drawer.mobile')} value={user.mobileNumber} />
              <MetaField
                label={t('users.management.drawer.mobileVerified')}
                value={formatVerified(user.isMobileVerified)}
              />
              <MetaField label={t('users.management.drawer.email')} value={user.email} />
              <MetaField
                label={t('users.management.drawer.emailVerified')}
                value={formatVerified(user.isEmailVerified)}
              />
              <MetaField
                label={t('users.management.drawer.userType')}
                value={t(`users.management.userTypes.${user.userType || 'individual'}`)}
              />
              <MetaField
                label={t('users.management.drawer.preferredLanguage')}
                value={formatLanguage(user.preferredLanguage)}
              />
              <MetaField
                label={t('users.management.drawer.role')}
                value={user.roleName || user.roleCode}
              />
              <MetaField
                label={t('users.management.drawer.registeredAt')}
                value={formatDate(user.registeredAt, locale, t('common.empty'))}
              />
              <MetaField
                label={t('users.management.drawer.lastLogin')}
                value={formatDate(user.lastLoginAt, locale, t('common.empty'))}
              />
            </dl>
          ),
        },
        ...(user.kyc
          ? [
              {
                key: 'kyc',
                title: t('users.management.drawer.kycSection'),
                children: (
                  <>
                    <dl className="kyc-drawer__meta">
                      <MetaField
                        label={t('users.management.drawer.kycStatus')}
                        value={t(`users.management.status.${user.kyc.status}`, {
                          defaultValue: user.kyc.status,
                        })}
                      />
                      <MetaField
                        label={t('users.management.drawer.kycDocument')}
                        value={user.kyc.documentType}
                      />
                      <MetaField
                        label={t('users.management.drawer.kycReviewedAt')}
                        value={formatDate(user.kyc.reviewedAt, locale, t('common.empty'))}
                      />
                    </dl>
                    <Button
                      variant="secondary"
                      className="kyc-drawer__link-btn"
                      onClick={() =>
                        navigate(`${ROUTES.APP_KYC}?kycId=${encodeURIComponent(user.kyc.id)}`)
                      }
                    >
                      {t('users.management.drawer.viewKycRecord')}
                    </Button>
                  </>
                ),
              },
            ]
          : []),
        ...(user.assetOwner
          ? [
              {
                key: 'asset-owner',
                title: t('users.management.drawer.assetOwnerSection'),
                children: (
                  <dl className="kyc-drawer__meta">
                    <MetaField
                      label={t('users.management.drawer.assetOwnerStatus')}
                      value={user.assetOwner.status}
                    />
                    <MetaField
                      label={t('users.management.drawer.assetOwnerCity')}
                      value={user.assetOwner.city}
                    />
                    <MetaField
                      label={t('users.management.drawer.assetOwnerRegion')}
                      value={user.assetOwner.region}
                    />
                  </dl>
                ),
              },
            ]
          : []),
        ...(user.isStaff
          ? [
              {
                key: 'staff-notice',
                children: (
                  <p className="kyc-drawer__message">{t('users.management.drawer.staffNotice')}</p>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      title={displayName || t('users.management.drawer.title')}
      subtitle={user?.mobileNumber}
      loading={loading}
      error={error}
      onRetry={loadUser}
      headerActions={headerActions}
      status={
        status ? (
          <StatusPill
            label={t(`users.management.status.${status}`, { defaultValue: status })}
            variant={getUserStatusVariant(status)}
          />
        ) : null
      }
      sections={sections}
      footer={footer}
      titleId="user-detail-drawer-title"
      width={520}
    />
  );
}

export default UserDetailDrawer;
