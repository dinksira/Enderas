import { useTranslation } from 'react-i18next';

/**
 * @param {{
 *   dateFrom: string,
 *   dateTo: string,
 *   onDateFromChange: (value: string) => void,
 *   onDateToChange: (value: string) => void,
 *   className?: string,
 *   idPrefix?: string,
 * }} props
 */
export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  className = '',
  idPrefix = 'admin-date',
}) {
  const { t } = useTranslation();

  return (
    <div className={['admin-date-range', className].filter(Boolean).join(' ')}>
      <label className="admin-date-range__field" htmlFor={`${idPrefix}-from`}>
        <span className="admin-date-range__label">{t('admin.dateFrom')}</span>
        <input
          id={`${idPrefix}-from`}
          type="date"
          className="admin-date-range__input"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
        />
      </label>
      <label className="admin-date-range__field" htmlFor={`${idPrefix}-to`}>
        <span className="admin-date-range__label">{t('admin.dateTo')}</span>
        <input
          id={`${idPrefix}-to`}
          type="date"
          className="admin-date-range__input"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export default DateRangeFilter;
