import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { ROUTES } from '../../../config/routes.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { AuctionDocumentsBlock } from './AuctionDocumentsBlock.jsx';
import { AuctionBidSection } from './AuctionBidSection.jsx';
import { formatEtbAmount } from '../utils/auction-drawer-utils.js';
import {
  canShowCpoButton,
  canShowPaymentButton,
  getParticipationStatusVariant,
  getParticipationStepState,
  PARTICIPATION_STEPS,
  resolveParticipationStatus,
  getBidStepHintKey,
  shouldShowBidSection,
} from '../utils/participation-utils.js';

function stepClass(state) {
  return `auction-participation__step auction-participation__step--${state}`;
}

function trackerStepClass(state) {
  return `auction-participation__tracker-step auction-participation__tracker-step--${state}`;
}

function StepStatusPill({ statusKey, t }) {
  const variantMap = {
    complete: 'active',
    active: 'pending',
    pending: 'under-review',
    locked: 'default',
    rejected: 'rejected',
  };
  return (
    <StatusPill
      label={t(`bidder.participation.stepStatus.${statusKey}`)}
      variant={variantMap[statusKey] || 'default'}
    />
  );
}

/**
 * @param {{
 *   auction?: object|null,
 *   participation?: object|null,
 *   documents?: Array<string|object>,
 *   documentAccess?: boolean,
 *   loading?: boolean,
 *   participationError?: string,
 *   onRetryParticipation?: () => void,
 *   onPayDocumentFee: () => void,
 *   onSubmitCpo: () => void,
 *   onBidSuccess?: () => void,
 * }} props
 */
export function AuctionParticipationPanel({
  auction,
  participation,
  documents = [],
  documentAccess = false,
  loading = false,
  participationError = '',
  onRetryParticipation,
  onPayDocumentFee,
  onSubmitCpo,
  onBidSuccess,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canParticipate = useAuthStore((state) => state.canParticipateInAuctions());
  const requiresKyc = useAuthStore((state) => state.requiresKYC());
  const kycUnderReview = user?.status === 'kyc_under_review';

  if (!canParticipate) {
    return (
      <section className="auction-participation" aria-label={t('bidder.participation.panelTitle')}>
        <div className="auction-participation__kyc-gate">
          <h3 className="auction-participation__title">
            {kycUnderReview
              ? t('bidder.participation.kycGate.underReviewTitle')
              : t('bidder.participation.kycGate.title')}
          </h3>
          <p className="auction-participation__lead">
            {kycUnderReview
              ? t('bidder.participation.kycGate.underReviewBody')
              : t('bidder.participation.kycGate.body')}
          </p>
          {requiresKyc && !kycUnderReview && (
            <Button variant="primary" onClick={() => navigate(ROUTES.KYC_VERIFICATION)}>
              {t('bidder.participation.kycGate.action')}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const stepState = getParticipationStepState(participation);
  const participationStatus = resolveParticipationStatus(participation);
  const statusVariant = getParticipationStatusVariant(participationStatus);
  const documentFee = auction?.documentFee ?? 0;
  const showPayButton = canShowPaymentButton(participation, auction, { loading });
  const showCpoButton = canShowCpoButton(participation, auction, { loading });
  const isRegistered = Boolean(participation?.isRegisteredBidder || participation?.flags?.paymentApproved);
  const showDocuments = isRegistered || documentAccess;
  const bidLockedHintKey = stepState.bid === 'locked' ? getBidStepHintKey(participation, auction) : null;
  const canPlaceBid = Boolean(participation?.gates?.canPlaceBid);
  const showBidSection = shouldShowBidSection(participation, auction?.status);

  return (
    <section className="auction-participation" aria-label={t('bidder.participation.panelTitle')}>
      <header className={`auction-participation__banner auction-participation__banner--${statusVariant}`}>
        <div className="auction-participation__banner-copy">
          <p className="auction-participation__eyebrow">{t('bidder.participation.journeyEyebrow')}</p>
          <h3 className="auction-participation__title">
            {t(`bidder.participation.status.${participationStatus}.title`, {
              defaultValue: t('bidder.participation.panelTitle'),
            })}
          </h3>
          <p className="auction-participation__lead">
            {t(`bidder.participation.status.${participationStatus}.body`, {
              defaultValue: t('bidder.participation.panelSubtitle'),
            })}
          </p>
        </div>
        <StatusPill
          label={t(`bidder.participation.status.${participationStatus}.label`, {
            defaultValue: participationStatus,
          })}
          variant={statusVariant}
        />
      </header>

      {!loading && showBidSection && (
        <AuctionBidSection
          auction={auction}
          auctionId={auction?.id}
          participation={participation}
          canPlaceBid={canPlaceBid}
          onSuccess={onBidSuccess}
        />
      )}

      <ol className="auction-participation__tracker" aria-label={t('bidder.participation.panelTitle')}>
        {PARTICIPATION_STEPS.map((stepKey, index) => (
          <li key={stepKey} className={trackerStepClass(stepState[stepKey])}>
            <span className="auction-participation__tracker-index">{index + 1}</span>
            <span className="auction-participation__tracker-label">
              {t(`bidder.participation.steps.${stepKey}`)}
            </span>
          </li>
        ))}
      </ol>

      <ol className="auction-participation__steps">
        {PARTICIPATION_STEPS.map((stepKey) => (
          <li key={stepKey} className={stepClass(stepState[stepKey])}>
            <div className="auction-participation__step-header">
              <strong>{t(`bidder.participation.steps.${stepKey}`)}</strong>
              <StepStatusPill statusKey={stepState[stepKey]} t={t} />
            </div>

            {stepKey === 'payment' && (
              <p className="auction-participation__step-copy">
                {t('bidder.participation.paymentCopy', { amount: formatEtbAmount(documentFee) })}
              </p>
            )}
            {stepKey === 'cpo' && (
              <p className="auction-participation__step-copy">{t('bidder.participation.cpoCopy')}</p>
            )}
            {stepKey === 'bid' && (
              <p className="auction-participation__step-copy">{t('bidder.participation.bidCopy')}</p>
            )}

            {stepKey === 'bid' && bidLockedHintKey && !showBidSection && (
              <p className="auction-participation__hint auction-participation__hint--inline" role="status">
                {t(bidLockedHintKey)}
              </p>
            )}

            {stepKey === 'bid' && showBidSection && canPlaceBid && (
              <p className="auction-participation__hint auction-participation__hint--inline auction-participation__hint--next" role="status">
                {t('bidder.participation.bidCard.scrollHint')}
              </p>
            )}

            {stepKey === 'cpo' && isRegistered && stepState.cpo === 'active' && (
              <p className="auction-participation__hint auction-participation__hint--inline auction-participation__hint--next" role="status">
                {t('bidder.participation.cpoNextAction')}
              </p>
            )}

            {stepKey === 'payment' && participation?.payment?.status === 'rejected' && (
              <p className="auction-participation__rejection" role="alert">
                {participation.payment.rejectionReason || t('bidder.participation.paymentRejected')}
              </p>
            )}
            {stepKey === 'cpo' && participation?.cpo?.status === 'rejected' && (
              <p className="auction-participation__rejection" role="alert">
                {participation.cpo.rejectionReason || t('bidder.participation.cpoRejected')}
              </p>
            )}

            {stepKey === 'payment' && showPayButton && (
              <div className="auction-participation__step-action">
                <Button variant="primary" onClick={onPayDocumentFee}>
                  {t('bidder.participation.actions.payDocumentFee')}
                </Button>
              </div>
            )}

            {stepKey === 'cpo' && showCpoButton && (
              <div className="auction-participation__step-action">
                <Button variant="primary" onClick={onSubmitCpo}>
                  {t('bidder.participation.actions.submitCpo')}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>

      {loading && <p className="auction-participation__hint">{t('bidder.participation.loading')}</p>}

      {!loading && participationError && (
        <div className="auction-participation__error" role="alert">
          <p>{participationError}</p>
          {onRetryParticipation && (
            <button type="button" className="asset-page__refresh" onClick={onRetryParticipation}>
              {t('bidder.participation.retry')}
            </button>
          )}
        </div>
      )}

      {!loading && participation?.payment?.status === 'pending' && (
        <p className="auction-participation__hint">{t('bidder.participation.paymentPending')}</p>
      )}
      {!loading && participation?.cpo?.status === 'pending' && (
        <p className="auction-participation__hint">{t('bidder.participation.cpoPending')}</p>
      )}
      {!loading && participation?.flags?.allBidsSubmitted && (
        <p className="auction-participation__hint">
          {participation.isMultiLot
            ? t('bidder.participation.allBidsSubmitted')
            : t('bidder.participation.bidSubmitted', {
                amount: formatEtbAmount(participation.bid?.amount ?? participation.bids?.[0]?.amount),
              })}
        </p>
      )}
      {!loading && participation?.flags?.hasBid && !participation?.flags?.allBidsSubmitted && participation?.isMultiLot && (
        <p className="auction-participation__hint">
          {t('bidder.participation.partialBidsSubmitted', {
            submitted: (participation.bids || []).length,
            total: (participation.cpo?.selectedAuctionAssetIds || []).length,
          })}
        </p>
      )}
      {!loading && participation?.bid && !participation?.isMultiLot && (
        <p className="auction-participation__hint">
          {t('bidder.participation.bidSubmitted', {
            amount: formatEtbAmount(participation.bid.amount),
          })}
        </p>
      )}

      <AuctionDocumentsBlock documents={documents} unlocked={showDocuments} />
    </section>
  );
}

export default AuctionParticipationPanel;
