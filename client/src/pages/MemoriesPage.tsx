import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Memory, getMemories, deleteMemory } from '../api/memories';
import { DraggableWindow } from '../components/DraggableWindow';

export function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  async function fetchMemories(p: number) {
    setLoading(true);
    setError('');
    try {
      const res = await getMemories(p);
      setMemories(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setError('couldn\'t load memories — tap to retry');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMemories(page); }, [page]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleDelete(id: string) {
    const previous = [...memories];
    setMemories(m => m.filter(mem => mem.id !== id));
    try {
      await deleteMemory(id);
      setToast({ message: 'Memory removed', type: 'success' });
    } catch {
      setMemories(previous);
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  }

  if (loading) return <div className="spinner">finding our memories...</div>;

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => fetchMemories(page)}>Try Again</button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="empty-state">
        <p>nothing here yet.</p>
        <p>we're just getting started.</p>
        <Link to="/memories/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
          Create First Memory
        </Link>
      </div>
    );
  }

  return (
    <DraggableWindow title="Memories" defaultWidth={960}>
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="section-header">
          <span className="section-number">01</span>
          <span className="section-title">Memories</span>
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/memories/new" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              + New
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {memories.map(memory => (
            <div key={memory.id} className="card-sm">
              {/* Content + delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.6rem', lineHeight: 2, flex: 1 }}>
                  {memory.content}
                </p>
                <button
                  onClick={() => handleDelete(memory.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    flexShrink: 0, fontFamily: 'Press Start 2P',
                  }}
                  aria-label="Delete memory"
                  title="Delete"
                >
                  x
                </button>
              </div>

              {/* Footer: badges + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge badge-${memory.category}`}>{memory.category}</span>
                <span className="badge">{'*'.repeat(memory.importance)}</span>
                <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
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
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </DraggableWindow>
  );
}
