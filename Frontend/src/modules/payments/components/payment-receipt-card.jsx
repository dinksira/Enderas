import { usePayments } from '../hooks/use-payments.js';
import './payment-receipt-card.css';

export function PaymentReceiptCard() {
  const { records, loading, error } = usePayments();

  return (
    <section className="payment-receipt-card" aria-live="polite">
      <h3 className="payment-receipt-card__title">Payments & Receipts</h3>
      <p className="payment-receipt-card__body">
        Module-specific UI fragment scoped to the payments domain.
      </p>
      <p className="payment-receipt-card__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default PaymentReceiptCard;
