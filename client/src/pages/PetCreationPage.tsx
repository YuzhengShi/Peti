import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { createPet } from '../api/pets';
import { useOnboarding } from '../hooks/useOnboarding';
import { ApiError } from '../api/fetch';

export function PetCreationPage() {
  const navigate = useNavigate();
  const { setPetCreated } = useOnboarding();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = name.trim();
    if (!trimmed) {
      setError('your companion needs a name!');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError('name should be 2-20 characters');
      return;
    }

    setSubmitting(true);
    try {
      await createPet({ name: trimmed });
      setPetCreated();
      navigate('/test');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('something went wrong — try again');
      }
      setSubmitting(false);
    }
  }

  return (
    <DraggableWindow title="Name Your Companion" defaultWidth={520} defaultHeight={420}>
      <div style={{ padding: '2rem' }}>
        {/* Placeholder sprite */}
        <div style={{
          width: 96, height: 96, margin: '0 auto 2rem',
          borderRadius: 16,
          background: 'var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          🥚
        </div>

        <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 2, textAlign: 'center', marginBottom: '2rem' }}>
          a new companion is waiting to hatch.<br />
          what will you call them?
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pet-name">name</label>
            <input
              id="pet-name"
              className={`input${error ? ' input-error' : ''}`}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="enter a name..."
              maxLength={20}
              autoFocus
            />
            {error && <div className="field-error">{error}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'hatching...' : 'Begin'}
            </button>
          </div>
        </form>
      </div>
    </DraggableWindow>
  );
}
