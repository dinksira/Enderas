import { useSettings } from '../hooks/use-settings.js';

export function LocalizationConfigForm() {
  const { records, loading, error } = useSettings();

  return (
    <section className="localization-config-form" aria-live="polite">
      <h3 className="localization-config-form__title">System Settings</h3>
      <p className="localization-config-form__body">
        Module-specific UI fragment scoped to the setting domain.
      </p>
      <p className="localization-config-form__status">
        {loading && 'Loading records...'}
        {!loading && error && `Error: ${error}`}
        {!loading && !error && `${records.length} record(s) loaded`}
      </p>
    </section>
  );
}

export default LocalizationConfigForm;
