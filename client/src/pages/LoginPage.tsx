import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/fetch';
import { DraggableWindow } from '../components/DraggableWindow';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
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
      await login(form.email, form.password);
      navigate('/memories');
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError('Something went wrong');
    } finally { setSubmitting(false); }
  }

  return (
    <DraggableWindow title="Welcome Back" defaultWidth={460} defaultHeight={460}>
      <div style={{ padding: '1.5rem' }}>
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert-error">{serverError}</div>}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
            value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="email" />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className={`input ${errors.password ? 'input-error' : ''}`}
            value={form.password} onChange={e => handleChange('password', e.target.value)} autoComplete="current-password" />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 2 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Register</Link>
        </p>
      </form>
      </div>
    </DraggableWindow>
  );
}
