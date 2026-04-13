import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';


const STEPS = [
  { num: '01', title: 'Meet Your Pet', desc: 'Create an account and hatch your pixel companion.' },
  { num: '02', title: 'Know Each Other', desc: 'Take a personality quiz. Your pet asks the questions.' },
  { num: '03', title: 'Daily Companion', desc: 'Chat every day. It remembers and grows with you.' },
  { num: '04', title: 'Real Help', desc: 'Specialists for health, work, relationships, and growth.' },
];

export function HomePage() {
  const { user } = useAuth();
  const { theme } = useSettings();
  const [showHow, setShowHow] = useState(false);
  const [closingHow, setClosingHow] = useState(false);

  function closeHow() {
    setClosingHow(true);
    setTimeout(() => { setShowHow(false); setClosingHow(false); }, 120);
  }

  return (
    <>
      {/* Hero */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem 2rem 6rem',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            lineHeight: 1.4,
            marginBottom: '1.5rem',
          }}>
            Hello,<br />
            I'm Peti.
          </h1>

          <p style={{
            fontSize: '0.65rem',
            lineHeight: 2.4,
            color: theme === 'dark' ? '#d8cfc4' : 'var(--text-secondary)',
            textShadow: theme === 'dark' ? '0 1px 6px rgba(0,0,0,0.8)' : 'none',
            maxWidth: 520,
            marginBottom: '2.5rem',
          }}>
            A pixel companion that truly knows you.
            I remember your conversations, understand
            your personality, and grow with you over time.
          </p>

          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Go to Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Get Started
              </Link>
              <button className="btn btn-secondary" onClick={() => setShowHow(true)}>
                Learn More
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How it works modal */}
      {showHow && (
        <>
          <div className="modal-overlay" onClick={closeHow} aria-hidden="true" />
          <div className="modal" role="dialog" aria-label="How it works">
            <div className={`card${closingHow ? ' draggable-window-closing' : ''}`} style={{ maxWidth: 780, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  onClick={closeHow}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Press Start 2P', fontSize: '0.7rem' }}
                  aria-label="Close"
                >
                  x
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {STEPS.map(step => (
                  <div key={step.num} className="card-sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem' }}>{step.title}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{step.num}</span>
                    </div>
                    <p style={{ fontSize: '0.5rem', lineHeight: 2.2, color: 'var(--text-secondary)' }}>{step.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }} onClick={closeHow}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
