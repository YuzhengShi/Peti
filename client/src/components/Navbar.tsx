import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();
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
    <nav className="navbar" style={{ opacity: loggingOut ? 0 : 1, transition: 'opacity 0.12s ease-in' }}>
      <Link to="/" className="navbar-brand">Peti</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/memories">Memories</Link>
            <Link to="/memories/new">New</Link>
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
