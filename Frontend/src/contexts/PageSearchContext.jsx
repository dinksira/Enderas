import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

const PageSearchContext = createContext(null);

const EMPTY_REGISTRATION = Object.freeze({
  value: '',
  onChange: () => {},
  placeholder: '',
  enabled: false,
});

/**
 * Provides shell header search state bridged from the active page.
 */
export function PageSearchProvider({ children }) {
  const [registration, setRegistration] = useState(null);

  const register = useCallback((config) => {
    setRegistration(config);
    return () => {
      setRegistration((current) => (current === config ? null : current));
    };
  }, []);

  const value = useMemo(() => {
    const active = registration ?? EMPTY_REGISTRATION;

    return {
      isRegistered: registration !== null,
      enabled: Boolean(active.enabled),
      value: active.value ?? '',
      onChange: active.onChange ?? (() => {}),
      placeholder: active.placeholder ?? '',
      register,
    };
  }, [registration, register]);

  return (
    <PageSearchContext.Provider value={value}>
      {children}
    </PageSearchContext.Provider>
  );
}

export function usePageSearch() {
  const context = useContext(PageSearchContext);
  if (!context) {
    throw new Error('usePageSearch must be used within PageSearchProvider');
  }
  return context;
}

/**
 * Register the active page's search handlers with the shell header.
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   enabled?: boolean,
 * }} config
 */
export function useRegisterPageSearch({
  value,
  onChange,
  placeholder = '',
  enabled = true,
}) {
  const { register } = usePageSearch();

  useLayoutEffect(() => {
    const config = {
      value,
      onChange,
      placeholder,
      enabled,
    };

    return register(config);
  }, [value, onChange, placeholder, enabled, register]);
}

export default PageSearchContext;
