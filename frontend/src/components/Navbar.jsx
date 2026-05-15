import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllRead } from '../api/notifications';
import Logo from './Logo';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard',    to: '/dashboard', roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { label: 'Tickets',      to: '/tickets',   roles: ['admin', 'dispatcher', 'technician', 'client'] },
  { label: 'Knowledge Base', to: '/knowledge', roles: ['admin', 'dispatcher', 'technician'] },
  { label: 'Reports',      to: '/reports',   roles: ['admin', 'dispatcher'] },
  { label: 'Users',        to: '/users',     roles: ['admin'] },
  { label: 'Companies',    to: '/companies', roles: ['admin'] },
];

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapperRef = useRef(null);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const fetchNotifs = async () => {
    try {
      const { data } = await getNotifications();
      setNotifs(data);
    } catch {
      // silently ignore — auth may not be ready
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = async () => {
    if (!open && unreadCount > 0) {
      await markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    }
    setOpen(o => !o);
  };

  const handleNotifClick = (n) => {
    setOpen(false);
    if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
  };

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

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Menu"
      >
        <span className={`${styles.bar} ${mobileOpen ? styles.barOpen1 : ''}`} />
        <span className={`${styles.bar} ${mobileOpen ? styles.barOpen2 : ''}`} />
        <span className={`${styles.bar} ${mobileOpen ? styles.barOpen3 : ''}`} />
      </button>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            {visibleItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.mobileDivider} />
          <Link to="/profile" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
            My Profile
          </Link>
          <button className={styles.mobileLogout} onClick={logout}>Sign out</button>
        </div>
      )}

      {/* Notification bell */}
      <div className={styles.notifWrapper} ref={wrapperRef}>
        <button className={styles.bell} onClick={handleBellClick} aria-label="Notifications">
          🔔
          {unreadCount > 0 && (
            <span className={styles.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className={styles.notifPanel}>
            <div className={styles.notifHeader}>
              <span>Notifications</span>
              {notifs.some(n => !n.is_read) && (
                <button
                  className={styles.markAllBtn}
                  onClick={async () => {
                    await markAllRead();
                    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <p className={styles.notifEmpty}>No notifications yet.</p>
            ) : (
              <ul className={styles.notifList}>
                {notifs.map(n => (
                  <li
                    key={n.id}
                    className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}
                    onClick={() => handleNotifClick(n)}
                  >
                    <span className={styles.notifTitle}>{n.title}</span>
                    {n.body && <span className={styles.notifBody}>{n.body}</span>}
                    <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className={styles.user}>
        <Link to="/profile" className={styles.userLink}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </span>
            <span className={styles.userRole}>{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <div className={styles.avatar}>{initials}</div>
        </Link>
        <button className={styles.logout} onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
