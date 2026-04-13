import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { getUsers } from '../api/admin';
import type { User } from '../api/auth';
import { useDebounce } from '../hooks/useDebounce';

export function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  async function fetchUsers(p: number, q?: string) {
    setLoading(true);
    setError('');
    try {
      const res = await getUsers(p, 20, q || undefined);
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      setError("couldn't load users — tap to retry");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    fetchUsers(1, debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page]);

  return (
    <DraggableWindow title="Admin" defaultWidth={960} defaultHeight={620}>
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="section-header">
          <span className="section-number">{total}</span>
          <span className="section-title">Users</span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            className="input"
            type="text"
            placeholder="search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="spinner">finding users...</div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => fetchUsers(page, debouncedSearch)}>
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>no users found.</p>
          </div>
        ) : (
          <>
            {/* User table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.5rem', lineHeight: 2.2 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Username</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Email</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Role</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.6rem 0.8rem' }}>
                        <Link
                          to={`/admin/users/${user.id}`}
                          style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                        >
                          {user.username}
                        </Link>
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem' }}>
                        <span className="badge" style={user.role === 'admin' ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(user.createdAt!).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Prev
                </button>
                <span>{page} / {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DraggableWindow>
  );
}
