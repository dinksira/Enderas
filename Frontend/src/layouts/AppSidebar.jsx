import { NavLink } from 'react-router-dom';
import { usePermission } from '../core/auth/usePermission.js';

export function AppSidebar() {
  const { navigation, roleCode } = usePermission();

  if (!navigation.length) {
    return (
      <aside className="app-sidebar" aria-label="Application navigation">
        <p className="app-sidebar__empty">No navigation items available.</p>
      </aside>
    );
  }

  return (
    <aside className="app-sidebar" aria-label="Application navigation">
      <div className="app-sidebar__header">
        <span className="app-sidebar__role">{roleCode?.replace(/_/g, ' ') ?? 'Workspace'}</span>
      </div>
      <nav className="app-sidebar__nav">
        {navigation.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              ['app-sidebar__link', isActive ? 'app-sidebar__link--active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AppSidebar;
