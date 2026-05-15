import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets, createTicket, getCategories, exportTickets } from '../api/tickets';
import { getCompanies } from '../api/companies';
import styles from './Tickets.module.css';

const STATUS_LABELS = {
  new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
  on_hold: 'On Hold', resolved: 'Resolved', closed: 'Closed',
};
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles['s_' + status]}`}>{STATUS_LABELS[status]}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`${styles.badge} ${styles['p_' + priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SlaBadge({ hours, breach }) {
  if (breach) return <span className={`${styles.slaBadge} ${styles.slaBreached}`}>SLA breached</span>;
  if (hours === null || hours === undefined) return null;
  if (hours <= 0) return <span className={`${styles.slaBadge} ${styles.slaBreached}`}>Overdue</span>;
  if (hours <= 4) return <span className={`${styles.slaBadge} ${styles.slaCritical}`}>{hours.toFixed(1)}h left</span>;
  if (hours <= 24) return <span className={`${styles.slaBadge} ${styles.slaWarning}`}>{Math.round(hours)}h left</span>;
  return <span className={`${styles.slaBadge} ${styles.slaOk}`}>{Math.round(hours)}h left</span>;
}

const EMPTY_FORM = { title: '', description: '', priority: 'medium', category: '', company: '' };

const PAGE_SIZE = 25;

// Special synthetic values used in the status dropdown (not real API status values)
const STATUS_FILTER_EXTRAS = {
  __open:       { label: 'Open (all)',    param: { is_open: true } },
  __unassigned: { label: 'Unassigned',   param: { unassigned: true } },
  __breach:     { label: 'SLA breached', param: { sla_breach: true } },
};

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Tickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    if (searchParams.get('is_open') === 'true') return '__open';
    if (searchParams.get('unassigned') === 'true') return '__unassigned';
    if (searchParams.get('sla_breach') === 'true') return '__breach';
    return searchParams.get('status') || '';
  });
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const canCreate = ['admin', 'dispatcher', 'client'].includes(user?.role);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;
      const extra = STATUS_FILTER_EXTRAS[statusFilter];
      if (extra) Object.assign(params, extra.param);
      else if (statusFilter) params.status = statusFilter;
      const { data } = await getTickets(params);
      setTickets(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
      setHasPrev(!!data.previous);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    if (!showModal) return;
    getCategories().then(r => setCategories(r.data));
    if (user?.role !== 'client') getCompanies().then(r => setCompanies(r.data));
  }, [showModal, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        ...(form.category && { category: form.category }),
        ...(user.role !== 'client' && { company: form.company }),
      };
      await createTicket(payload);
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchTickets();
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;
      const extra = STATUS_FILTER_EXTRAS[statusFilter];
      if (extra) Object.assign(params, extra.param);
      else if (statusFilter) params.status = statusFilter;
      const { data } = await exportTickets(params);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tickets</h1>
          <p className={styles.subtitle}>{totalCount} ticket{totalCount !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnExport} onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : '↓ Export Excel'}
          </button>
          {canCreate && (
            <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>+ New Ticket</button>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="Search tickets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_FILTER_EXTRAS).map(([v, cfg]) => (
            <option key={v} value={v}>{cfg.label}</option>
          ))}
          <option disabled>──────────</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={styles.select} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : tickets.length === 0 ? (
          <p className={styles.empty}>No tickets found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>SLA</th>
                <th>Category</th>
                <th>Company</th>
                <th>Assigned to</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className={styles.clickable} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className={styles.id}>#{t.id}</td>
                  <td className={styles.ticketTitle}>{t.title}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><SlaBadge hours={t.sla_remaining_hours} breach={t.sla_breach} /></td>
                  <td>{t.category_name || '—'}</td>
                  <td>{t.company_name}</td>
                  <td>{t.assigned_to_name || <span className={styles.unassigned}>Unassigned</span>}</td>
                  <td>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalCount > PAGE_SIZE && (() => {
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        const from = (page - 1) * PAGE_SIZE + 1;
        const to = Math.min(page * PAGE_SIZE, totalCount);
        return (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>{from}–{to} of {totalCount}</span>
            <div className={styles.pageControls}>
              <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={!hasPrev}>← Prev</button>
              {getPageNumbers(page, totalPages).map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className={styles.ellipsis}>…</span>
                  : <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`} onClick={() => setPage(p)}>{p}</button>
              )}
              <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Next →</button>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Ticket</h2>
              <button className={styles.close} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <label className={styles.label}>
                Title *
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className={styles.label}>
                Description *
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  required
                />
              </label>
              <div className={styles.row}>
                <label className={styles.label}>
                  Priority
                  <select className={styles.input} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label className={styles.label}>
                  Category
                  <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">— None —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              </div>
              {user?.role !== 'client' && (
                <label className={styles.label}>
                  Company *
                  <select className={styles.input} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required>
                    <option value="">Select company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
