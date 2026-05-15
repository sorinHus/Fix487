import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSummary } from '../api/reports';
import styles from './Dashboard.module.css';

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

function buildCards(role, data) {
  if (!data) return [];
  const map = {
    admin: [
      { label: 'Open tickets',       value: data.open,               accent: 'primary',   to: '/tickets?status=new' },
      { label: 'Unassigned',         value: data.unassigned,         accent: 'warning',   to: '/tickets' },
      { label: 'Resolved today',     value: data.resolved_today,     accent: 'success',   to: '/tickets' },
      { label: 'SLA breaches',       value: data.sla_breaches,       accent: 'danger',    to: '/tickets' },
      { label: 'Active technicians', value: data.active_technicians, accent: 'info',      to: '/users' },
      { label: 'Companies',          value: data.companies,          accent: 'secondary', to: '/users' },
      { label: 'KB articles',        value: data.kb_articles,        accent: 'muted',     to: '/knowledge' },
    ],
    dispatcher: [
      { label: 'Unassigned',         value: data.unassigned,         accent: 'warning',   to: '/tickets' },
      { label: 'Open tickets',       value: data.open,               accent: 'primary',   to: '/tickets' },
      { label: 'Resolved today',     value: data.resolved_today,     accent: 'success',   to: '/tickets' },
      { label: 'SLA breaches',       value: data.sla_breaches,       accent: 'danger',    to: '/reports' },
      { label: 'Active technicians', value: data.active_technicians, accent: 'info',      to: '/users' },
    ],
    technician: [
      { label: 'My tickets',         value: data.open,               accent: 'primary',   to: '/tickets' },
      { label: 'Resolved today',     value: data.resolved_today,     accent: 'success',   to: '/tickets' },
      { label: 'SLA breaches',       value: data.sla_breaches,       accent: 'danger',    to: '/tickets' },
      { label: 'Last 30 days',       value: data.last_30_days,       accent: 'info',      to: '/tickets' },
    ],
    client: [
      { label: 'Open tickets',       value: data.open,               accent: 'primary',   to: '/tickets' },
      { label: 'Resolved today',     value: data.resolved_today,     accent: 'success',   to: '/tickets' },
      { label: 'SLA breaches',       value: data.sla_breaches,       accent: 'danger',    to: '/tickets' },
    ],
  };
  return map[role] || [];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = buildCards(user?.role, data);

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
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`} />
            ))
          : cards.map(card => (
              <div
                key={card.label}
                className={`${styles.card} ${styles[card.accent]}`}
                onClick={() => navigate(card.to)}
              >
                <span className={styles.cardValue}>{card.value ?? '—'}</span>
                <span className={styles.cardLabel}>{card.label}</span>
              </div>
            ))
        }
      </div>
    </div>
  );
}
