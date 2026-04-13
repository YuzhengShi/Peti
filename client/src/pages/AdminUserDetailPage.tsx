import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { getUser, updateUserRole, deleteUser, AdminUserDetail } from '../api/admin';
import { useAuth } from '../hooks/useAuth';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function fetchUser() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getUser(id);
      setDetail(data);
    } catch {
      setError("couldn't load user details — tap to retry");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUser(); }, [id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleRoleChange(newRole: string) {
    if (!id || !detail) return;
    try {
      await updateUserRole(id, newRole);
      setDetail({ ...detail, role: newRole });
      setToast({ message: 'role updated', type: 'success' });
    } catch {
      setToast({ message: 'failed to update role', type: 'error' });
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteUser(id);
      setToast({ message: 'user deleted', type: 'success' });
      setTimeout(() => navigate('/admin'), 500);
    } catch {
      setToast({ message: 'failed to delete user', type: 'error' });
      setConfirmDelete(false);
    }
  }

  const isSelf = currentUser?.id === id;

  return (
    <DraggableWindow title="User Detail" defaultWidth={640} defaultHeight={560}>
      {loading ? (
        <div className="spinner">loading user...</div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchUser}>Try Again</button>
        </div>
      ) : detail ? (
        <div style={{ padding: '1.5rem' }}>
          {/* Back link */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/admin')}
            style={{ marginBottom: '1.5rem' }}
          >
            &larr; Back
          </button>

          {/* User info card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '0.7rem', marginBottom: '0.75rem' }}>{detail.username}</h2>
                <p style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{detail.email}</p>
                <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>
                  joined {new Date(detail.createdAt!).toLocaleDateString()}
                </p>
              </div>
              <span
                className="badge"
                style={detail.role === 'admin' ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}
              >
                {detail.role}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {detail.pet && (
              <div className="card-sm">
                <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pet</p>
                <p style={{ fontSize: '0.55rem' }}>{detail.pet.name} (Lv. {detail.pet.level})</p>
              </div>
            )}
            <div className="card-sm">
              <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Memories</p>
              <p style={{ fontSize: '0.55rem' }}>{detail._count.memories}</p>
            </div>
            <div className="card-sm">
              <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Messages</p>
              <p style={{ fontSize: '0.55rem' }}>{detail._count.messages}</p>
            </div>
            <div className="card-sm">
              <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Profiles</p>
              <p style={{ fontSize: '0.55rem' }}>{detail._count.profiles}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {/* Role toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>Role:</label>
              <select
                className="select"
                value={detail.role}
                onChange={e => handleRoleChange(e.target.value)}
                disabled={isSelf}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {isSelf && (
                <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>
                  (can't change own role)
                </span>
              )}
            </div>

            {/* Delete */}
            {!isSelf && (
              confirmDelete ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.45rem', color: 'var(--error)' }}>are you sure?</span>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>Yes, Delete</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
                  Delete User
                </button>
              )
            )}
          </div>
        </div>
      ) : null}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </DraggableWindow>
  );
}
