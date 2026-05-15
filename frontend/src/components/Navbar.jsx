import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { label: 'Tickets', to: '/tickets', roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { label: 'Knowledge Base', to: '/knowledge', roles: ['admin', 'dispatcher', 'technician'] },
  { label: 'Reports', to: '/reports', roles: ['admin', 'dispatcher'] },
  { label: 'Users', to: '/users', roles: ['admin'] },
];

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  const initials = user
    ? (
        `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
        (user.username?.[0] ?? '').toUpperCase()
      )
    : '';

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <Logo size={30} />
        <span className={styles.brandName}>Fix487</span>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.user}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </span>
          <span className={styles.userRole}>{ROLE_LABELS[user?.role] || user?.role}</span>
        </div>
        <div className={styles.avatar}>{initials}</div>
        <button className={styles.logout} onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
