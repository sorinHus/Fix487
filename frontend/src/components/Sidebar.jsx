import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, CalendarDays, BookOpen,
  Building2, BarChart2, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { to: '/tickets',   label: 'Tickets',   icon: Ticket,          roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { to: '/calendar',  label: 'Calendar',  icon: CalendarDays,    roles: ['admin', 'dispatcher', 'technician'] },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen,   roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { to: '/clients',   label: 'Clients',   icon: Building2,       roles: ['admin', 'dispatcher'] },
  { to: '/reports',   label: 'Reports',   icon: BarChart2,       roles: ['admin', 'dispatcher'] },
  { to: '/admin',     label: 'Admin',     icon: Settings,        roles: ['admin'] },
];

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

function getInitials(user) {
  const first = user.first_name?.[0] ?? '';
  const last = user.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || user.username[0].toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <Logo size={32} />
        <span className={styles.brand}>Fix487</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={styles.footer}>
        <div className={styles.avatar}>{user ? getInitials(user) : '?'}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username}
          </span>
          <span className={styles.userRole}>{ROLE_LABELS[user?.role] ?? user?.role}</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
