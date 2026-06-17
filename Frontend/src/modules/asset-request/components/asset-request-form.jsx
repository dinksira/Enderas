import { useAssetRequests } from '../hooks/use-asset-requests.js';
import './asset-request-form.css';

export function AssetRequestForm() {
  const { records, loading, error } = useAssetRequests();

  return (
    <section className="asset-request-form" aria-live="polite">
      <h3 className="asset-request-form__title">Asset Request Intake</h3>
      <p className="asset-request-form__body">
        Module-specific UI fragment scoped to the asset-request domain.
      </p>
      <p className="asset-request-form__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default AssetRequestForm;
