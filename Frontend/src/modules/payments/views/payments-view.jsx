import { PaymentReceiptCard } from '../components/payment-receipt-card.jsx';

export function PaymentsView() {
  return (
    <section className="payments-view">
      <header>
        <h1 className="payments-view__title">Payments & Receipts</h1>
        <p className="payments-view__lead">Auction entry fees, document purchases, and receipt verification.</p>
      </header>
      <PaymentReceiptCard />
    </section>
  );
}

export default PaymentsView;
