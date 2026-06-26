import React, { useState } from 'react';
import { User, X, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/api';
import toast from 'react-hot-toast';

const formatRole = (role) =>
  (role || 'User').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function ProfileMenu() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const close = () => {
    setOpen(false);
    setShowForm(false);
    setErr('');
    setCur(''); setNw(''); setConfirm('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!cur || !nw) { setErr('Please fill in both fields.'); return; }
    if (nw !== confirm) { setErr('New passwords do not match.'); return; }
    setLoading(true);
    try {
      await changePassword(token, cur, nw);
      toast.success('Password changed successfully.');
      close();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-full)' }}
        title="Your profile"
      >
        <User size={15} style={{ color: 'var(--color-muted)' }} />
        <span className="hidden sm:inline" style={{ color: 'var(--color-body)', fontSize: 13, fontWeight: 500 }}>
          {formatRole(user?.role)}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(24,29,38,0.45)' }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>Your Profile</h3>
              <button onClick={close} style={{ color: 'var(--color-faint)' }}><X size={18} /></button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%', fontSize: 18, fontWeight: 600 }}
              >
                {(user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>{user?.name || 'User'}</p>
                <p className="truncate" style={{ fontSize: 13, color: 'var(--color-muted)' }}>{user?.email}</p>
                <span
                  className="inline-block mt-1"
                  style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--color-muted)', background: 'var(--color-surface-strong)', borderRadius: 'var(--rounded-full)', padding: '1px 8px' }}
                >
                  {formatRole(user?.role)}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 16 }}>
              {!showForm ? (
                <button onClick={() => setShowForm(true)} className="ed-btn ed-btn-secondary" style={{ width: '100%' }}>
                  <KeyRound size={15} /> Change password
                </button>
              ) : (
                <form onSubmit={submit}>
                  <div className="mb-3 relative">
                    <label className="ed-label">Current password</label>
                    <input type={showPw ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} className="ed-input" style={{ height: 40, paddingRight: 38 }} />
                  </div>
                  <div className="mb-3">
                    <label className="ed-label">New password</label>
                    <input type={showPw ? 'text' : 'password'} value={nw} onChange={(e) => setNw(e.target.value)} className="ed-input" style={{ height: 40 }} />
                  </div>
                  <div className="mb-3">
                    <label className="ed-label">Confirm new password</label>
                    <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="ed-input" style={{ height: 40 }} />
                  </div>
                  <label className="flex items-center gap-2 mb-3" style={{ fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                    Show passwords
                  </label>
                  <p style={{ fontSize: 11, color: 'var(--color-faint)', marginBottom: 12 }}>
                    Min 8 chars with an uppercase letter, a number, and a special character.
                  </p>
                  {err && (
                    <div className="mb-3 rounded-md px-3 py-2" style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: 12 }}>
                      {err}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowForm(false); setErr(''); }} className="ed-btn ed-btn-ghost" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="ed-btn ed-btn-primary" style={{ flex: 1 }}>
                      {loading ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
