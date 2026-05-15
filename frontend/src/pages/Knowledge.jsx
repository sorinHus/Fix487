import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getKBArticles, getKBCategories, createKBArticle } from '../api/knowledge';
import styles from './Knowledge.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = { title: '', body: '', category: '', is_published: true };

export default function Knowledge() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = ['admin', 'dispatcher', 'technician'].includes(user?.role);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const { data } = await getKBArticles(params);
      setArticles(data);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    getKBCategories().then(r => setCategories(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        body: form.body,
        is_published: form.is_published,
        ...(form.category && { category: form.category }),
      };
      const { data } = await createKBArticle(payload);
      setShowModal(false);
      setForm(EMPTY_FORM);
      navigate(`/knowledge/${data.id}`);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to create article.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>+ New Article</button>
        )}
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder="Search articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.select} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.article_count})</option>)}
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : articles.length === 0 ? (
        <p className={styles.empty}>No articles found.</p>
      ) : (
        <div className={styles.grid}>
          {articles.map(a => (
            <div key={a.id} className={styles.card} onClick={() => navigate(`/knowledge/${a.id}`)}>
              <div className={styles.cardTop}>
                {a.category_name && <span className={styles.categoryTag}>{a.category_name}</span>}
                {!a.is_published && <span className={styles.draftTag}>Draft</span>}
              </div>
              <h2 className={styles.articleTitle}>{a.title}</h2>
              <div className={styles.cardMeta}>
                <span>{a.author_name}</span>
                <span>·</span>
                <span>{formatDate(a.updated_at)}</span>
                <span>·</span>
                <span>{a.views_count} views</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Article</h2>
              <button className={styles.close} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <label className={styles.label}>
                Title *
                <input className={styles.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </label>
              <label className={styles.label}>
                Category
                <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className={styles.label}>
                Body *
                <textarea className={styles.textarea} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} required />
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                Publish immediately
              </label>
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
