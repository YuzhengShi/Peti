import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMemory } from '../api/memories';
import { ApiError } from '../api/fetch';
import { DraggableWindow } from '../components/DraggableWindow';

const CATEGORIES = [
  { value: 'observation', label: 'Observation' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'preference', label: 'Preference' },
  { value: 'milestone', label: 'Milestone' },
];

export function MemoryCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ content: '', category: '', importance: '1' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.content.trim()) errs.content = 'Content is required';
    else if (form.content.length > 2000) errs.content = 'Under 2000 characters';
    if (!form.category) errs.category = 'Select a category';
    const imp = parseInt(form.importance);
    if (isNaN(imp) || imp < 1 || imp > 5) errs.importance = 'Between 1 and 5';
    return errs;
  }

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await createMemory({ content: form.content.trim(), category: form.category, importance: parseInt(form.importance) });
      navigate('/memories');
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else if (err instanceof ApiError) setServerError(err.message);
      else setServerError('Something went wrong');
    } finally { setSubmitting(false); }
  }

  return (
    <DraggableWindow title="New Memory" defaultWidth={560}>
      <div style={{ padding: '1.5rem' }}>
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert-error">{serverError}</div>}

        <div className="form-group">
          <label htmlFor="content">What happened?</label>
          <textarea id="content" className={`textarea ${errors.content ? 'input-error' : ''}`}
            value={form.content} onChange={e => handleChange('content', e.target.value)}
            placeholder="Describe the memory..." rows={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
            {errors.content ? <span className="field-error">{errors.content}</span> : <span />}
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>{form.content.length}/2000</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" className={`select ${errors.category ? 'input-error' : ''}`}
            value={form.category} onChange={e => handleChange('category', e.target.value)}>
            <option value="">Select...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <div className="field-error">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="importance">Importance (1-5)</label>
          <input id="importance" type="number" min="1" max="5"
            className={`input ${errors.importance ? 'input-error' : ''}`}
            value={form.importance} onChange={e => handleChange('importance', e.target.value)}
            style={{ maxWidth: 140 }} />
          {errors.importance && <div className="field-error">{errors.importance}</div>}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Memory'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/memories')}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </DraggableWindow>
  );
}
