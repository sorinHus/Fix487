import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getKBArticle, updateKBArticle } from '../api/knowledge';
import styles from './KBArticle.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function KBArticle() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', is_published: true });
  const [saving, setSaving] = useState(false);

  const canEdit = ['admin', 'dispatcher', 'technician'].includes(user?.role);

  useEffect(() => {
    getKBArticle(id)
      .then(r => {
        setArticle(r.data);
        setForm({ title: r.data.title, body: r.data.body, is_published: r.data.is_published });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateKBArticle(id, form);
      setArticle(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (!article) return <div className={styles.loading}>Article not found.</div>;

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/knowledge')}>← Back to Knowledge Base</button>

      <div className={styles.card}>
        <div className={styles.articleHeader}>
          <div className={styles.tags}>
            {article.category_name && <span className={styles.categoryTag}>{article.category_name}</span>}
            {!article.is_published && <span className={styles.draftTag}>Draft</span>}
          </div>
          {canEdit && !editing && (
            <button className={styles.btnSecondary} onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <input
              className={styles.titleInput}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className={styles.bodyInput}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={20}
            />
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Published
            </label>
            <div className={styles.editActions}>
              <button className={styles.btnSecondary} onClick={() => setEditing(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>{article.title}</h1>
            <div className={styles.meta}>
              <span>By <strong>{article.author_name}</strong></span>
              <span>·</span>
              <span>Updated {formatDate(article.updated_at)}</span>
              <span>·</span>
              <span>{article.views_count} views</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.body}>{article.body}</div>
          </>
        )}
      </div>
    </div>
  );
}
