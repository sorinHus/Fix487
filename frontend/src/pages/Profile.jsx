import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import styles from './Profile.module.css';

const ROLE_LABELS = {
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  client: 'Client',
};

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
    phone:      user?.phone      || '',
    position:   user?.position   || '',
  });
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'ok'|'err', text }

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/auth/me/', {
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      form.phone,
        position:   form.position,
      });
      await refreshUser();
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err) {
      const d = err.response?.data;
      setProfileMsg({ type: 'err', text: d ? Object.values(d).flat().join(' ') : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
    } catch (err) {
      const d = err.response?.data;
      setPwMsg({ type: 'err', text: d ? Object.values(d).flat().join(' ') : 'Failed to change password.' });
    } finally {
      setChangingPw(false);
    }
  };

  const initials = user
    ? (`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || (user.username?.[0] ?? '').toUpperCase())
    : '';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>

      <div className={styles.layout}>
        {/* Left: avatar + identity */}
        <div className={styles.identity}>
          <div className={styles.avatar}>{initials}</div>
          <p className={styles.username}>@{user?.username}</p>
          <span className={styles.role}>{ROLE_LABELS[user?.role]}</span>
        </div>

        {/* Right: forms */}
        <div className={styles.forms}>
          {/* Personal info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Personal information</h2>
            <form onSubmit={handleProfileSave} className={styles.form}>
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
              <label className={styles.label}>
                Email
                <input className={styles.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              <div className={styles.row}>
                <label className={styles.label}>
                  Phone
                  <input className={styles.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Position
                  <input className={styles.input} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </label>
              </div>
              {profileMsg && (
                <p className={profileMsg.type === 'ok' ? styles.msgOk : styles.msgErr}>{profileMsg.text}</p>
              )}
              <div className={styles.actions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Change password</h2>
            <form onSubmit={handlePasswordChange} className={styles.form}>
              <label className={styles.label}>
                Current password
                <input className={styles.input} type="password" value={pwForm.old_password} onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} required />
              </label>
              <div className={styles.row}>
                <label className={styles.label}>
                  New password
                  <input className={styles.input} type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={8} />
                </label>
                <label className={styles.label}>
                  Confirm new password
                  <input className={styles.input} type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required minLength={8} />
                </label>
              </div>
              {pwMsg && (
                <p className={pwMsg.type === 'ok' ? styles.msgOk : styles.msgErr}>{pwMsg.text}</p>
              )}
              <div className={styles.actions}>
                <button type="submit" className={styles.btnPrimary} disabled={changingPw}>
                  {changingPw ? 'Changing…' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
