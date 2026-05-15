import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const CARDS = {
  admin: [
    { label: 'Open tickets', value: '—', accent: 'primary' },
    { label: 'Unassigned', value: '—', accent: 'warning' },
    { label: 'Resolved today', value: '—', accent: 'success' },
    { label: 'Active technicians', value: '—', accent: 'info' },
    { label: 'Companies', value: '—', accent: 'secondary' },
    { label: 'KB articles', value: '—', accent: 'muted' },
  ],
  dispatcher: [
    { label: 'Unassigned', value: '—', accent: 'warning' },
    { label: 'In progress', value: '—', accent: 'primary' },
    { label: 'Resolved today', value: '—', accent: 'success' },
    { label: 'Available technicians', value: '—', accent: 'info' },
  ],
  technician: [
    { label: 'My tickets', value: '—', accent: 'primary' },
    { label: 'Due today', value: '—', accent: 'warning' },
    { label: 'Overdue', value: '—', accent: 'danger' },
    { label: 'Resolved this month', value: '—', accent: 'success' },
  ],
  client: [
    { label: 'Open tickets', value: '—', accent: 'primary' },
    { label: 'In progress', value: '—', accent: 'info' },
    { label: 'Resolved', value: '—', accent: 'success' },
  ],
};

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

export default function Dashboard() {
  const { user } = useAuth();
  const cards = CARDS[user?.role] || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome, {user?.first_name || user?.username}
        </h1>
        <p className={styles.subtitle}>
          {ROLE_LABELS[user?.role]} · Fix487 Dashboard
        </p>
      </div>

      <div className={styles.grid}>
        {cards.map(card => (
          <div key={card.label} className={`${styles.card} ${styles[card.accent]}`}>
            <span className={styles.cardValue}>{card.value}</span>
            <span className={styles.cardLabel}>{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
