import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../api/fetch';
import { DraggableWindow } from '../components/DraggableWindow';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.username) errs.username = 'Username is required';
    else if (form.username.length < 3 || form.username.length > 20) errs.username = 'Must be 3-20 characters';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Needs an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Needs a number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
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
      await register(form.email, form.username, form.password);
      navigate('/memories');
    } catch (err) {
      if (err instanceof ApiError) err.details ? setErrors(err.details) : setServerError(err.message);
      else setServerError('Something went wrong');
    } finally { setSubmitting(false); }
  }

  return (
    <DraggableWindow title="Create Account" defaultWidth={460} defaultHeight={660}>
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
          <label htmlFor="username">Username</label>
          <input id="username" type="text" className={`input ${errors.username ? 'input-error' : ''}`}
            value={form.username} onChange={e => handleChange('username', e.target.value)} autoComplete="username" />
          {errors.username && <div className="field-error">{errors.username}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className={`input ${errors.password ? 'input-error' : ''}`}
            value={form.password} onChange={e => handleChange('password', e.target.value)} autoComplete="new-password" />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} autoComplete="new-password" />
          {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={submitting}>
          {submitting ? 'Creating...' : 'Register'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 2 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Login</Link>
        </p>
      </form>
      </div>
    </DraggableWindow>
  );
}
