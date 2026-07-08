import { useTranslation } from 'react-i18next';

export function AccessDeniedView() {
  const { t } = useTranslation();

  return (
    <section className="access-denied-view">
      <h1 className="access-denied-view__title">{t('accessDenied.pageTitle')}</h1>
      <p className="access-denied-view__message">{t('accessDenied.message')}</p>
    </section>
  );
}

export default AccessDeniedView;
