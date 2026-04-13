import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Memory, getMemories, deleteMemory, updateMemory } from '../api/memories';
import { DraggableWindow } from '../components/DraggableWindow';
import { useDebounce } from '../hooks/useDebounce';

const CATEGORIES = ['observation', 'strategy', 'preference', 'milestone'] as const;

export function MemoriesPage({ onClose }: { onClose?: () => void } = {}) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Search & filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchMemories(p: number) {
    setLoading(true);
    setError('');
    try {
      const res = await getMemories(p, 20, {
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
      });
      setMemories(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setError("couldn't load memories — tap to retry");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    fetchMemories(1);
  }, [debouncedSearch, categoryFilter]);

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
      setToast({ message: 'memory removed', type: 'success' });
    } catch {
      setMemories(previous);
      setToast({ message: 'failed to delete', type: 'error' });
    }
  }

  function startEdit(memory: Memory) {
    setEditingId(memory.id);
    setEditContent(memory.content);
    setEditCategory(memory.category);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
    setEditCategory('');
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const updated = await updateMemory(id, {
        content: editContent,
        category: editCategory,
      });
      setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      setToast({ message: 'memory updated', type: 'success' });
      cancelEdit();
    } catch {
      setToast({ message: 'failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <>
      {loading && memories.length === 0 ? (
        <div className="spinner">finding our memories...</div>
      ) : error && memories.length === 0 ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchMemories(page)}>Try Again</button>
        </div>
      ) : (
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

          {/* Search & filter controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              className="input"
              type="text"
              placeholder="search memories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: '1 1 200px' }}
              aria-label="Search memories"
            />
            <select
              className="select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ flex: '0 0 auto', width: 'auto', minWidth: 160 }}
              aria-label="Filter by category"
            >
              <option value="">all categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {memories.length === 0 ? (
            <div className="empty-state">
              <p>nothing here yet.</p>
              <p>we're just getting started.</p>
              <Link to="/memories/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                Create First Memory
              </Link>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                {memories.map(memory => (
                  <div key={memory.id} className="card-sm">
                    {editingId === memory.id ? (
                      /* Edit mode */
                      <div>
                        <textarea
                          className="textarea"
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          style={{ minHeight: 80, marginBottom: '0.75rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            className="select"
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            style={{ width: 'auto', minWidth: 140 }}
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => saveEdit(memory.id)} disabled={saving}>
                              {saving ? 'saving...' : 'Save'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.6rem', lineHeight: 2, flex: 1 }}>
                            {memory.content}
                          </p>
                          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                            <button
                              onClick={() => startEdit(memory)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.55rem', color: 'var(--text-muted)',
                                fontFamily: 'Press Start 2P',
                              }}
                              aria-label="Edit memory"
                              title="Edit"
                            >
                              e
                            </button>
                            <button
                              onClick={() => handleDelete(memory.id)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.65rem', color: 'var(--text-muted)',
                                fontFamily: 'Press Start 2P',
                              }}
                              aria-label="Delete memory"
                              title="Delete"
                            >
                              x
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${memory.category}`}>{memory.category}</span>
                          <span className="badge">{'*'.repeat(memory.importance)}</span>
                          <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
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
            </>
          )}
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">{toast.message}</div>}
    </>
  );

  return (
    <DraggableWindow title="Memories" defaultWidth={960} onClose={onClose}>
      {content}
    </DraggableWindow>
  );
}
