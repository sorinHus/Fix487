import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getCompanies } from '../api/companies';
import styles from './Users.module.css';

const ROLES = ['admin', 'dispatcher', 'technician', 'client'];
const ROLE_LABELS = { admin: 'Administrator', dispatcher: 'Dispatcher', technician: 'Technician', client: 'Client' };

function RoleBadge({ role }) {
  return <span className={`${styles.badge} ${styles['r_' + role]}`}>{ROLE_LABELS[role] || role}</span>;
}

const EMPTY_FORM = { username: '', email: '', first_name: '', last_name: '', role: 'technician', company: '', phone: '', position: '', password: '' };

export default function Users() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') || '');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(null); // null | 'create' | user object
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/users/', { params });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { getCompanies().then(r => setCompanies(r.data)); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };
  const openEdit = (u) => {
    setForm({
      username: u.username, email: u.email,
      first_name: u.first_name, last_name: u.last_name,
      role: u.role, company: u.company || '',
      phone: u.phone, position: u.position, password: '',
    });
    setError('');
    setModal(u);
  };

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.company) delete payload.company;
      if (!payload.password) delete payload.password;

      if (modal === 'create') {
        await api.post('/auth/register/', { ...payload });
      } else {
        await api.patch(`/users/${modal.id}/`, payload);
      }
      setModal(null);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    await api.patch(`/users/${u.id}/`, { is_active: !u.is_active });
    fetchUsers();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>+ New User</button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="Search by name or username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No users found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Company</th>
                <th>Position</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td className={styles.name}>
                    <div className={styles.avatar}>{(u.first_name?.[0] || u.username[0]).toUpperCase()}</div>
                    {u.first_name ? `${u.first_name} ${u.last_name}` : '—'}
                  </td>
                  <td className={styles.muted}>{u.username}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.company_name || '—'}</td>
                  <td>{u.position || '—'}</td>
                  <td>
                    <span className={u.is_active ? styles.active : styles.inactive}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(u)}>Edit</button>
                    <button
                      className={u.is_active ? styles.btnDeactivate : styles.btnActivate}
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{modal === 'create' ? 'New User' : `Edit ${modal.username}`}</h2>
              <button className={styles.close} onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.row}>
                <label className={styles.label}>
                  First name
                  <input className={styles.input} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Last name
                  <input className={styles.input} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </label>
              </div>
              <div className={styles.row}>
                <label className={styles.label}>
                  Username {modal === 'create' && '*'}
                  <input className={styles.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required={modal === 'create'} />
                </label>
                <label className={styles.label}>
                  Email
                  <input className={styles.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </label>
              </div>
              <div className={styles.row}>
                <label className={styles.label}>
                  Role
                  <select className={styles.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </label>
                <label className={styles.label}>
                  Company
                  <select className={styles.input} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}>
                    <option value="">— None —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              </div>
              <div className={styles.row}>
                <label className={styles.label}>
                  Position
                  <input className={styles.input} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Phone
                  <input className={styles.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </label>
              </div>
              <label className={styles.label}>
                {modal === 'create' ? 'Password *' : 'New password (leave blank to keep current)'}
                <input className={styles.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={modal === 'create'} minLength={8} />
              </label>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Saving…' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
