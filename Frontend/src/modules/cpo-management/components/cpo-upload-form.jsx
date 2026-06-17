import { useCpoRecords } from '../hooks/use-cpo-records.js';
import './cpo-upload-form.css';

export function CpoUploadForm() {
  const { records, loading, error } = useCpoRecords();

  return (
    <section className="cpo-upload-form" aria-live="polite">
      <h3 className="cpo-upload-form__title">CPO Management</h3>
      <p className="cpo-upload-form__body">
        Module-specific UI fragment scoped to the cpo-management domain.
      </p>
      <p className="cpo-upload-form__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default CpoUploadForm;
