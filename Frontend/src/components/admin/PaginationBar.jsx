import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   page: number,
 *   pages: number,
 *   loading?: boolean,
 *   onPrev: () => void,
 *   onNext: () => void,
 *   className?: string,
 * }} props
 */
export function PaginationBar({
  page,
  pages,
  loading = false,
  onPrev,
  onNext,
  className = '',
}) {
  const { t } = useTranslation();
  const totalPages = pages || 1;

  return (
    <div className={['admin-pagination', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={page <= 1 || loading}
        onClick={onPrev}
      >
        {t('admin.pagination.prev')}
      </button>
      <span className="admin-pagination__info">
        {t('admin.pagination.page', { page, pages: totalPages })}
      </span>
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={page >= totalPages || loading}
        onClick={onNext}
      >
        {t('admin.pagination.next')}
      </button>
    </div>
  );
}

export default PaginationBar;
