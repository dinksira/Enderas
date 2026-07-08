import { AssetRequestForm } from '../components/asset-request-form.jsx';

export function AssetRequestView() {
  return (
    <section className="asset-request-view">
      <header>
        <h1 className="asset-request-view__title">Asset Request Intake</h1>
        <p className="asset-request-view__lead">Asset submissions, intake evaluations, and approval tracking.</p>
      </header>
      <AssetRequestForm />
    </section>
  );
}

export default AssetRequestView;
