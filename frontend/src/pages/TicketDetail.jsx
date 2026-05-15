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

function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACTION_ICONS = {
  created:          { icon: '✦', color: '#6366F1' },
  status_changed:   { icon: '⟳', color: '#0EA5E9' },
  assigned:         { icon: '→', color: '#8B5CF6' },
  unassigned:       { icon: '↩', color: '#94A3B8' },
  priority_changed: { icon: '⚑', color: '#D97706' },
  comment_added:    { icon: '💬', color: '#16A34A' },
  resolved:         { icon: '✓', color: '#16A34A' },
};

const ACTION_LABELS = {
  created:          'created this ticket',
  status_changed:   'changed status',
  assigned:         'assigned to',
  unassigned:       'removed assignment',
  priority_changed: 'changed priority',
  comment_added:    'added a comment',
  resolved:         'resolved this ticket',
};

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);

  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [timelogs, setTimelogs] = useState([]);
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeForm, setTimeForm] = useState({ started_at: '', ended_at: '', notes: '' });
  const [submittingTime, setSubmittingTime] = useState(false);

  const canEdit    = ['admin', 'dispatcher'].includes(user?.role);
  const canComment = true;
  const canAssign  = ['admin', 'dispatcher'].includes(user?.role);
  const canLogTime = ['admin', 'technician'].includes(user?.role);

  useEffect(() => {
    Promise.all([
      getTicket(id),
      api.get(`/tickets/${id}/comments/`),
      api.get(`/tickets/${id}/activity/`),
      api.get(`/tickets/${id}/timelogs/`),
    ]).then(([t, c, a, tl]) => {
      setTicket(t.data);
      setComments(c.data);
      setActivity(a.data);
      setTimelogs(tl.data);
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

  const submitTimeLog = async (e) => {
    e.preventDefault();
    setSubmittingTime(true);
    try {
      const { data } = await api.post(`/tickets/${id}/timelogs/`, {
        started_at: timeForm.started_at,
        ended_at:   timeForm.ended_at || null,
        notes:      timeForm.notes,
      });
      setTimelogs(tl => [...tl, data]);
      setShowTimeForm(false);
      setTimeForm({ started_at: '', ended_at: '', notes: '' });
    } finally {
      setSubmittingTime(false);
    }
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
      const { data: newActivity } = await api.get(`/tickets/${id}/activity/`);
      setActivity(newActivity);
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

          {/* Activity timeline */}
          {activity.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Activity</h2>
              <div className={styles.timeline}>
                {activity.map((a, i) => {
                  const cfg = ACTION_ICONS[a.action] || { icon: '·', color: '#94A3B8' };
                  return (
                    <div key={a.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} style={{ background: cfg.color }}>{cfg.icon}</div>
                      {i < activity.length - 1 && <div className={styles.timelineLine} />}
                      <div className={styles.timelineContent}>
                        <span className={styles.timelineActor}>{a.actor_name}</span>
                        {' '}{ACTION_LABELS[a.action] || a.action}
                        {a.detail && <span className={styles.timelineDetail}> {a.detail}</span>}
                        <span className={styles.timelineTime}>{timeAgo(a.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Logs */}
          {(timelogs.length > 0 || canLogTime) && (() => {
            const totalMinutes = timelogs.reduce((s, tl) => s + (tl.duration_minutes || 0), 0);
            const durationPreview = (() => {
              if (!timeForm.started_at || !timeForm.ended_at) return null;
              const diff = new Date(timeForm.ended_at) - new Date(timeForm.started_at);
              return diff > 0 ? Math.floor(diff / 60000) : null;
            })();
            return (
              <div className={styles.card}>
                <div className={styles.timelogHeader}>
                  <h2 className={styles.sectionTitle}>
                    Time Logged
                    {totalMinutes > 0 && (
                      <span className={styles.totalTime}>{formatDuration(totalMinutes)} total</span>
                    )}
                  </h2>
                  {canLogTime && !showTimeForm && (
                    <button className={styles.btnSecondary} onClick={() => setShowTimeForm(true)}>+ Log Time</button>
                  )}
                </div>

                {timelogs.length === 0 && !showTimeForm && (
                  <p className={styles.empty}>No time logged yet.</p>
                )}

                {timelogs.length > 0 && (
                  <div className={styles.timelogList}>
                    {timelogs.map(tl => (
                      <div key={tl.id} className={styles.timelogItem}>
                        <div className={styles.timelogMeta}>
                          <strong>{tl.technician_name}</strong>
                          <span className={styles.timelogDuration}>{formatDuration(tl.duration_minutes)}</span>
                          <span className={styles.timelogDate}>{formatDate(tl.started_at)}</span>
                        </div>
                        {tl.notes && <p className={styles.timelogNotes}>{tl.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {showTimeForm && (
                  <form onSubmit={submitTimeLog} className={styles.timeForm}>
                    <div className={styles.timeRow}>
                      <label className={styles.formLabel}>
                        Started at
                        <input
                          type="datetime-local"
                          className={styles.timeInput}
                          value={timeForm.started_at}
                          onChange={e => setTimeForm(f => ({ ...f, started_at: e.target.value }))}
                          required
                        />
                      </label>
                      <label className={styles.formLabel}>
                        Ended at
                        <input
                          type="datetime-local"
                          className={styles.timeInput}
                          value={timeForm.ended_at}
                          onChange={e => setTimeForm(f => ({ ...f, ended_at: e.target.value }))}
                        />
                      </label>
                    </div>
                    {durationPreview && (
                      <p className={styles.durationPreview}>Duration: {formatDuration(durationPreview)}</p>
                    )}
                    <textarea
                      className={styles.textarea}
                      placeholder="Notes (optional)…"
                      value={timeForm.notes}
                      onChange={e => setTimeForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                    />
                    <div className={styles.timeFormActions}>
                      <button type="button" className={styles.btnSecondary} onClick={() => setShowTimeForm(false)}>Cancel</button>
                      <button type="submit" className={styles.btnPrimary} disabled={submittingTime}>
                        {submittingTime ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })()}

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
