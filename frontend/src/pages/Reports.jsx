import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSummary, getTechnicianReport } from '../api/reports';
import styles from './Reports.module.css';

const STATUS_LABELS = {
  new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
  on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed',
};
const STATUS_COLORS = {
  new: '#6366F1', assigned: '#0EA5E9', in_progress: '#F59E0B',
  on_hold: '#94A3B8', resolved: '#16A34A', closed: '#475569',
};
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const PRIORITY_COLORS = { low: '#16A34A', medium: '#6366F1', high: '#D97706', critical: '#DC2626' };

function BarChart({ items, labelKey, countKey, colorMap, labelMap }) {
  const max = Math.max(...items.map(i => i[countKey]), 1);
  return (
    <div className={styles.barChart}>
      {items.map(item => (
        <div key={item[labelKey]} className={styles.barRow}>
          <span className={styles.barLabel}>{labelMap?.[item[labelKey]] || item[labelKey]}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${(item[countKey] / max) * 100}%`,
                background: colorMap?.[item[labelKey]] || 'var(--color-primary)',
              }}
            />
          </div>
          <span className={styles.barCount}>{item[countKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const canSeeTech = ['admin', 'dispatcher'].includes(user?.role);

  useEffect(() => {
    const calls = [getSummary()];
    if (canSeeTech) calls.push(getTechnicianReport());
    Promise.all(calls).then(([s, t]) => {
      setSummary(s.data);
      if (t) setTechnicians(t.data);
    }).finally(() => setLoading(false));
  }, [canSeeTech]);

  if (loading) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>Overview of ticket activity</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statGrid}>
        {[
          { label: 'Total tickets', value: summary.total, accent: 'primary' },
          { label: 'Open', value: summary.open, accent: 'warning' },
          { label: 'Resolved today', value: summary.resolved_today, accent: 'success' },
          { label: 'SLA breaches', value: summary.sla_breaches, accent: 'danger' },
          { label: 'Last 30 days', value: summary.last_30_days, accent: 'info' },
        ].map(s => (
          <div key={s.label} className={`${styles.statCard} ${styles[s.accent]}`}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tickets by Status</h2>
          <BarChart
            items={summary.by_status}
            labelKey="status" countKey="count"
            colorMap={STATUS_COLORS} labelMap={STATUS_LABELS}
          />
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Tickets by Priority</h2>
          <BarChart
            items={summary.by_priority}
            labelKey="priority" countKey="count"
            colorMap={PRIORITY_COLORS} labelMap={PRIORITY_LABELS}
          />
        </div>
        {summary.by_category.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top Categories</h2>
            <BarChart items={summary.by_category} labelKey="name" countKey="count" />
          </div>
        )}
      </div>

      {/* Technician table */}
      {canSeeTech && technicians.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Technician Performance</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Technician</th>
                <th>Assigned</th>
                <th>Open</th>
                <th>Resolved</th>
                <th>Critical</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map(t => (
                <tr key={t.id}>
                  <td className={styles.techName}>{t.name}</td>
                  <td>{t.assigned}</td>
                  <td>{t.open}</td>
                  <td className={styles.resolved}>{t.resolved}</td>
                  <td className={t.critical > 0 ? styles.critical : ''}>{t.critical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
