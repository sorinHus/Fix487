import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const CARDS = {
  admin: [
    { label: 'Tichete deschise', value: '—', accent: 'primary' },
    { label: 'Neasignate', value: '—', accent: 'warning' },
    { label: 'Rezolvate azi', value: '—', accent: 'success' },
    { label: 'Tehnicieni activi', value: '—', accent: 'info' },
    { label: 'Companii', value: '—', accent: 'secondary' },
    { label: 'Articole KB', value: '—', accent: 'muted' },
  ],
  dispatcher: [
    { label: 'Neasignate', value: '—', accent: 'warning' },
    { label: 'În lucru', value: '—', accent: 'primary' },
    { label: 'Rezolvate azi', value: '—', accent: 'success' },
    { label: 'Tehnicieni disponibili', value: '—', accent: 'info' },
  ],
  technician: [
    { label: 'Tichetele mele', value: '—', accent: 'primary' },
    { label: 'Scadente azi', value: '—', accent: 'warning' },
    { label: 'Întârziate', value: '—', accent: 'danger' },
    { label: 'Rezolvate luna asta', value: '—', accent: 'success' },
  ],
  client: [
    { label: 'Tichete deschise', value: '—', accent: 'primary' },
    { label: 'În lucru', value: '—', accent: 'info' },
    { label: 'Rezolvate', value: '—', accent: 'success' },
  ],
};

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Tehnician',
  client: 'Client',
};

export default function Dashboard() {
  const { user } = useAuth();
  const cards = CARDS[user?.role] || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Bună ziua, {user?.first_name || user?.username}
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
