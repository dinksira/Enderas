import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button.jsx';
import { StatusPill } from '../../../components/admin/StatusPill.jsx';
import { ROUTES } from '../../../config/routes.js';
import { useAuthStore } from '@enderass/shared/auth';
import { AuctionDocumentsBlock } from './AuctionDocumentsBlock.jsx';
import { AuctionBidSection } from './AuctionBidSection.jsx';
import { formatEtbAmount } from '@enderass/shared/utils';
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

function journeyStepClass(state) {
  return `bidder-journey__step bidder-journey__step--${state}`;
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

function StepNode({ index, state }) {
  if (state === 'complete') {
    return (
      <span className="bidder-journey__node bidder-journey__node--complete" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`bidder-journey__node bidder-journey__node--${state}`} aria-hidden="true">
      {index + 1}
    </span>
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
      <section className="bidder-journey" aria-label={t('bidder.participation.panelTitle')}>
        <div className="bidder-journey__kyc-gate">
          <h3 className="bidder-journey__title">
            {kycUnderReview
              ? t('bidder.participation.kycGate.underReviewTitle')
              : t('bidder.participation.kycGate.title')}
          </h3>
          <p className="bidder-journey__lead">
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
  const showBidSection = shouldShowBidSection(participation, auction?.status);

  return (
    <section className="bidder-journey" aria-label={t('bidder.participation.panelTitle')}>
      <header className={`bidder-journey__banner bidder-journey__banner--${statusVariant}`}>
        <div className="bidder-journey__banner-copy">
          <p className="bidder-journey__eyebrow">{t('bidder.participation.journeyEyebrow')}</p>
          <h3 className="bidder-journey__title">
            {t(`bidder.participation.status.${participationStatus}.title`, {
              defaultValue: t('bidder.participation.panelTitle'),
            })}
          </h3>
          <p className="bidder-journey__lead">
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

      {loading && <p className="bidder-journey__hint">{t('bidder.participation.loading')}</p>}

      {!loading && participationError && (
        <div className="bidder-journey__error" role="alert">
          <p>{participationError}</p>
          {onRetryParticipation && (
            <button type="button" className="asset-page__refresh" onClick={onRetryParticipation}>
              {t('bidder.participation.retry')}
            </button>
          )}
        </div>
      )}

      <ol className="bidder-journey__steps">
        {PARTICIPATION_STEPS.map((stepKey, index) => (
          <li key={stepKey} className={journeyStepClass(stepState[stepKey])}>
            <div className="bidder-journey__rail" aria-hidden="true">
              <StepNode index={index} state={stepState[stepKey]} />
              {index < PARTICIPATION_STEPS.length - 1 && (
                <span className={`bidder-journey__line bidder-journey__line--${stepState[stepKey]}`} />
              )}
            </div>

            <div className="bidder-journey__card">
              <div className="bidder-journey__card-header">
                <div>
                  <p className="bidder-journey__step-eyebrow">
                    {t('bidder.participation.stepLabel', { step: index + 1, total: PARTICIPATION_STEPS.length })}
                  </p>
                  <strong className="bidder-journey__step-title">
                    {t(`bidder.participation.steps.${stepKey}`)}
                  </strong>
                </div>
                <StepStatusPill statusKey={stepState[stepKey]} t={t} />
              </div>

              {stepKey === 'payment' && (
                <p className="bidder-journey__step-copy">
                  {t('bidder.participation.paymentCopy', { amount: formatEtbAmount(documentFee) })}
                </p>
              )}
              {stepKey === 'cpo' && (
                <p className="bidder-journey__step-copy">{t('bidder.participation.cpoCopy')}</p>
              )}
              {stepKey === 'bid' && (
                <p className="bidder-journey__step-copy">{t('bidder.participation.bidCopy')}</p>
              )}

              {stepKey === 'bid' && bidLockedHintKey && !showBidSection && (
                <p className="bidder-journey__hint bidder-journey__hint--inline" role="status">
                  {t(bidLockedHintKey)}
                </p>
              )}

              {stepKey === 'cpo' && isRegistered && stepState.cpo === 'active' && (
                <p className="bidder-journey__hint bidder-journey__hint--next" role="status">
                  {t('bidder.participation.cpoNextAction')}
                </p>
              )}

              {stepKey === 'payment' && participation?.payment?.status === 'rejected' && (
                <p className="bidder-journey__rejection" role="alert">
                  {participation.payment.rejectionReason || t('bidder.participation.paymentRejected')}
                </p>
              )}
              {stepKey === 'cpo' && participation?.cpo?.status === 'rejected' && (
                <p className="bidder-journey__rejection" role="alert">
                  {participation.cpo.rejectionReason || t('bidder.participation.cpoRejected')}
                </p>
              )}

              {stepKey === 'payment' && showPayButton && (
                <div className="bidder-journey__action">
                  <Button variant="primary" onClick={onPayDocumentFee}>
                    {t('bidder.participation.actions.payDocumentFee')}
                  </Button>
                </div>
              )}

              {stepKey === 'cpo' && showCpoButton && (
                <div className="bidder-journey__action">
                  <Button variant="primary" onClick={onSubmitCpo}>
                    {t('bidder.participation.actions.submitCpo')}
                  </Button>
                </div>
              )}

              {stepKey === 'bid' && showBidSection && (
                <div className="bidder-journey__bid">
                  {participation?.gates?.canEditBidDrafts && (
                    <p className="bidder-journey__hint bidder-journey__hint--next" role="status">
                      {t('bidder.participation.bidCard.scrollHint')}
                    </p>
                  )}
                  <AuctionBidSection
                    auction={auction}
                    auctionId={auction?.id}
                    participation={participation}
                    onSuccess={onBidSuccess}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!loading && participation?.payment?.status === 'pending' && (
        <p className="bidder-journey__hint">{t('bidder.participation.paymentPending')}</p>
      )}
      {!loading && participation?.cpo?.status === 'pending' && (
        <p className="bidder-journey__hint">{t('bidder.participation.cpoPending')}</p>
      )}
      {!loading && participation?.flags?.allBidsSubmitted && (
        <p className="bidder-journey__hint bidder-journey__hint--success">
          {participation.isMultiLot
            ? t('bidder.participation.allBidsSubmitted')
            : t('bidder.participation.bidSubmitted', {
                amount: formatEtbAmount(participation.bid?.amount ?? participation.bids?.[0]?.amount),
              })}
        </p>
      )}
      {!loading && participation?.flags?.hasBid && !participation?.flags?.allBidsSubmitted && participation?.isMultiLot && (
        <p className="bidder-journey__hint">
          {t('bidder.participation.partialBidsSubmitted', {
            submitted: (participation.bids || []).length,
            total: (participation.cpo?.selectedAuctionAssetIds || []).length,
          })}
        </p>
      )}
      {!loading && participation?.bid && !participation?.isMultiLot && (
        <p className="bidder-journey__hint bidder-journey__hint--success">
          {t('bidder.participation.bidSubmitted', {
            amount: formatEtbAmount(participation.bid.amount),
          })}
        </p>
      )}

      <AuctionDocumentsBlock
        auctionId={auction?.id}
        documents={documents}
        unlocked={showDocuments}
      />
    </section>
  );
}

export default AuctionParticipationPanel;
