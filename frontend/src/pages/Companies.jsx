import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import styles from './Companies.module.css';

const EMPTY_FORM = {
  name: '', address: '', phone: '', email: '', website: '',
  sla_resolution_critical: 4, sla_resolution_high: 24,
  sla_resolution_medium: 72, sla_resolution_low: 168,
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | company object
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/companies/');
      setCompanies(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setModal('create');
  };

  const openEdit = (c) => {
    setForm({
      name: c.name, address: c.address, phone: c.phone,
      email: c.email, website: c.website,
      sla_resolution_critical: c.sla_resolution_critical,
      sla_resolution_high: c.sla_resolution_high,
      sla_resolution_medium: c.sla_resolution_medium,
      sla_resolution_low: c.sla_resolution_low,
    });
    setError('');
    setModal(c);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (modal === 'create') {
        await api.post('/companies/', form);
      } else {
        await api.patch(`/companies/${modal.id}/`, form);
      }
      setModal(null);
      fetchCompanies();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Companies</h1>
          <p className={styles.subtitle}>{companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>+ New Company</button>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : companies.length === 0 ? (
          <p className={styles.empty}>No companies found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Website</th>
                <th>SLA Critical</th>
                <th>SLA High</th>
                <th>SLA Medium</th>
                <th>SLA Low</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id}>
                  <td className={styles.name}>{c.name}</td>
                  <td className={styles.muted}>{c.phone || '—'}</td>
                  <td className={styles.muted}>{c.email || '—'}</td>
                  <td className={styles.muted}>
                    {c.website ? <a href={c.website} target="_blank" rel="noreferrer" className={styles.link}>{c.website.replace(/^https?:\/\//, '')}</a> : '—'}
                  </td>
                  <td><span className={styles.slaBadge}>{c.sla_resolution_critical}h</span></td>
                  <td><span className={styles.slaBadge}>{c.sla_resolution_high}h</span></td>
                  <td><span className={styles.slaBadge}>{c.sla_resolution_medium}h</span></td>
                  <td><span className={styles.slaBadge}>{c.sla_resolution_low}h</span></td>
                  <td className={styles.actions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(c)}>Edit</button>
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
              <h2 className={styles.modalTitle}>{modal === 'create' ? 'New Company' : `Edit ${modal.name}`}</h2>
              <button className={styles.close} onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.errorMsg}>{error}</p>}

              <label className={styles.label}>
                Company name *
                <input className={styles.input} {...f('name')} required />
              </label>

              <div className={styles.row}>
                <label className={styles.label}>
                  Phone
                  <input className={styles.input} {...f('phone')} />
                </label>
                <label className={styles.label}>
                  Email
                  <input className={styles.input} type="email" {...f('email')} />
                </label>
              </div>

              <div className={styles.row}>
                <label className={styles.label}>
                  Website
                  <input className={styles.input} {...f('website')} placeholder="https://…" />
                </label>
                <label className={styles.label}>
                  Address
                  <input className={styles.input} {...f('address')} />
                </label>
              </div>

              <p className={styles.sectionLabel}>SLA resolution times (hours)</p>
              <div className={styles.slaGrid}>
                <label className={styles.label}>
                  Critical
                  <input className={styles.input} type="number" min="1" {...f('sla_resolution_critical')} />
                </label>
                <label className={styles.label}>
                  High
                  <input className={styles.input} type="number" min="1" {...f('sla_resolution_high')} />
                </label>
                <label className={styles.label}>
                  Medium
                  <input className={styles.input} type="number" min="1" {...f('sla_resolution_medium')} />
                </label>
                <label className={styles.label}>
                  Low
                  <input className={styles.input} type="number" min="1" {...f('sla_resolution_low')} />
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Saving…' : modal === 'create' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
