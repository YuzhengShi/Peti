import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';

export function Navbar() {
  const { user, logout } = useAuth();
  const { onboarded } = useOnboarding();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    document.body.classList.add('logging-out');
    setTimeout(async () => {
      await logout();
      navigate('/');
      document.body.classList.remove('logging-out');
      setLoggingOut(false);
    }, 150);
  }

  return (
    <nav className="navbar" aria-label="Main navigation" style={{ opacity: loggingOut ? 0 : 1, transition: 'opacity 0.12s ease-in' }}>
      <Link to="/" className="navbar-brand">Peti</Link>
      <div className="navbar-links">
        {user ? (
          <>
            {onboarded && (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/profile">Profile</Link>
                {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              </>
            )}
            <span className="nav-username">{user.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
