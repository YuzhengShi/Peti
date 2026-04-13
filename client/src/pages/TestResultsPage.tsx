import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { RadarChart } from '../components/RadarChart';
import { getProfiles, ProfileResult } from '../api/profiles';

export function TestResultsPage() {
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfiles();
        setProfiles(data);
      } catch {
        setError("couldn't load your results — tap to retry");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const radarData = profiles.map(p => ({
    dimension: p.dimensionType,
    band: p.scores.aggregate,
  }));

  return (
    <DraggableWindow title="Your Results" defaultWidth={640} defaultHeight={560}>
      {loading ? (
        <div className="spinner">preparing your profile...</div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <p>no results yet.</p>
          <p>complete the personality test first.</p>
          <Link to="/test" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
            Take the Test
          </Link>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '0.65rem', marginBottom: '1rem' }}>here's what we learned</h2>
          <p style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', lineHeight: 2, marginBottom: '2rem' }}>
            these are descriptive ranges — not labels or scores.<br />
            they help peti understand how to be a better companion.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <RadarChart results={radarData} size={260} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Meet Peti
            </Link>
            <Link to="/profile" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Full Profile
            </Link>
          </div>
        </div>
      )}
    </DraggableWindow>
  );
}
