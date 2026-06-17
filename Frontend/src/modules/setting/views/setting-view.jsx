import { LocalizationConfigForm } from '../components/localization-config-form.jsx';
import './setting-view.css';

export function SettingView() {
  return (
    <section className="setting-view">
      <header>
        <h1 className="setting-view__title">System Settings</h1>
        <p className="setting-view__lead">Localization configs, currency options, and global system variables.</p>
      </header>
      <LocalizationConfigForm />
    </section>
  );
}

export default SettingView;
