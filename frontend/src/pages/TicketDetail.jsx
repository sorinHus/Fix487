import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTicket, updateTicket } from '../api/tickets';
import api from '../api/axios';
import styles from './TicketDetail.module.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

function StatusBadge({ status }) {
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  return <span className={`${styles.badge} ${styles['s_' + status]}`}>{label}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`${styles.badge} ${styles['p_' + priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);

  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const canEdit = ['admin', 'dispatcher'].includes(user?.role);
  const canComment = true;
  const canAssign = ['admin', 'dispatcher'].includes(user?.role);

  useEffect(() => {
    Promise.all([
      getTicket(id),
      api.get(`/tickets/${id}/comments/`),
    ]).then(([t, c]) => {
      setTicket(t.data);
      setComments(c.data);
    }).finally(() => setLoading(false));

    if (canAssign) {
      api.get('/users/', { params: { role: 'technician' } }).then(r => setTechnicians(r.data));
    }
  }, [id, canAssign]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setTicket(t => ({ ...t, status: newStatus }));
    await updateTicket(id, { status: newStatus });
  };

  const handleAssignChange = async (e) => {
    const val = e.target.value;
    const assigned = val ? Number(val) : null;
    setTicket(t => ({ ...t, assigned_to: assigned }));
    await updateTicket(id, { assigned_to: assigned });
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await api.post(`/tickets/${id}/comments/`, { body: commentBody, is_internal: isInternal });
      setComments(c => [...c, data]);
      setCommentBody('');
      setIsInternal(false);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!ticket) return <div className={styles.loading}>Ticket not found.</div>;

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/tickets')}>← Back to Tickets</button>

      <div className={styles.layout}>
        {/* Left: main content */}
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.ticketHeader}>
              <span className={styles.ticketId}>#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className={styles.title}>{ticket.title}</h1>
            <p className={styles.meta}>
              Opened by <strong>{ticket.created_by_name}</strong> · {formatDate(ticket.created_at)}
            </p>
            <div className={styles.divider} />
            <p className={styles.description}>{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Comments ({comments.length})</h2>
            {comments.length === 0 && <p className={styles.empty}>No comments yet.</p>}
            <div className={styles.commentList}>
              {comments.map(c => (
                <div key={c.id} className={`${styles.comment} ${c.is_internal ? styles.internal : ''}`}>
                  <div className={styles.commentMeta}>
                    <strong>{c.author_name}</strong>
                    {c.is_internal && <span className={styles.internalTag}>Internal</span>}
                    <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                  </div>
                  <p className={styles.commentBody}>{c.body}</p>
                </div>
              ))}
            </div>

            {canComment && (
              <form onSubmit={submitComment} className={styles.commentForm}>
                <textarea
                  className={styles.textarea}
                  placeholder="Add a comment…"
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  rows={3}
                />
                <div className={styles.commentActions}>
                  {['admin', 'dispatcher', 'technician'].includes(user?.role) && (
                    <label className={styles.internalCheck}>
                      <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                      Internal note
                    </label>
                  )}
                  <button type="submit" className={styles.btnPrimary} disabled={submittingComment || !commentBody.trim()}>
                    {submittingComment ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right: details sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <dl className={styles.details}>
              <dt>Status</dt>
              <dd>
                {canEdit ? (
                  <select className={styles.select} value={ticket.status} onChange={handleStatusChange}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                ) : <StatusBadge status={ticket.status} />}
              </dd>

              <dt>Priority</dt>
              <dd><PriorityBadge priority={ticket.priority} /></dd>

              <dt>Company</dt>
              <dd>{ticket.company_name}</dd>

              <dt>Category</dt>
              <dd>{ticket.category_name || '—'}</dd>

              <dt>Assigned to</dt>
              <dd>
                {canAssign ? (
                  <select className={styles.select} value={ticket.assigned_to || ''} onChange={handleAssignChange}>
                    <option value="">Unassigned</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.first_name ? `${t.first_name} ${t.last_name}` : t.username}
                      </option>
                    ))}
                  </select>
                ) : (ticket.assigned_to_name || <span className={styles.muted}>Unassigned</span>)}
              </dd>

              <dt>Created</dt>
              <dd>{formatDate(ticket.created_at)}</dd>

              <dt>Last updated</dt>
              <dd>{formatDate(ticket.updated_at)}</dd>

              {ticket.resolved_at && (
                <>
                  <dt>Resolved</dt>
                  <dd>{formatDate(ticket.resolved_at)}</dd>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
