import { CpoUploadForm } from '../components/cpo-upload-form.jsx';
import './cpo-management-view.css';

export function CpoManagementView() {
  return (
    <section className="cpo-management-view">
      <header>
        <h1 className="cpo-management-view__title">CPO Management</h1>
        <p className="cpo-management-view__lead">Certified Payment Orders, bank slip uploads, and financial flags.</p>
      </header>
      <CpoUploadForm />
    </section>
  );
}

export default CpoManagementView;
