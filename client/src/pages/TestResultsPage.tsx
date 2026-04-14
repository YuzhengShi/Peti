import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { RadarChart } from '../components/RadarChart';
import { getProfiles, getProfileContent, generateProfile, ProfileResult } from '../api/profiles';

const GENERATING_MESSAGES = [
  'reading your responses...',
  'analyzing personality patterns...',
  'mapping emotional landscape...',
  'building your profile...',
  'almost there...',
];

/** Extract condensed "Who They Are" — first sentence per bold subsection */
function extractWhoTheyAre(content: string): string | null {
  const start = content.indexOf('## Who They Are');
  if (start === -1) return null;
  const afterHeader = content.indexOf('\n', start);
  const end = content.indexOf('\n---', afterHeader);
  const full = end === -1 ? content.slice(afterHeader).trim() : content.slice(afterHeader, end).trim();

  // Extract first 1-2 sentences from each bold-header subsection
  const pattern = /\*\*([^*]+):\*\*\s*((?:[^.!?]*[.!?]){1,2})/g;
  const sentences: string[] = [];
  let match;
  while ((match = pattern.exec(full)) !== null) {
    sentences.push(`**${match[1]}:** ${match[2].trim()}`);
  }
  return sentences.length > 0 ? sentences.join('\n\n') : full.slice(0, 500) + '...';
}

/** Render a markdown-ish block as React elements (bold, paragraphs) */
function renderMarkdownBlock(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  return paragraphs.map((para, i) => {
    // Skip HTML comments
    if (para.trim().startsWith('<!--')) return null;

    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 2.2, marginBottom: '1rem' }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export function TestResultsPage() {
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [profileContent, setProfileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgFading, setMsgFading] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cycle generating messages
  useEffect(() => {
    if (!generating) return;
    msgTimer.current = setInterval(() => {
      setMsgFading(true);
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % GENERATING_MESSAGES.length);
        setMsgFading(false);
      }, 300);
    }, 4000);
    return () => { if (msgTimer.current) clearInterval(msgTimer.current); };
  }, [generating]);

  // Initial load: fetch profiles + check for existing generated content
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileData, contentData] = await Promise.all([
          getProfiles(),
          getProfileContent(),
        ]);
        if (cancelled) return;

        setProfiles(profileData);

        if (contentData.content) {
          setProfileContent(contentData.content);
          setLoading(false);
        } else {
          // No generated content — trigger generation
          setLoading(false);
          setGenerating(true);
          try {
            const result = await generateProfile();
            if (cancelled) return;
            setProfileContent(result.content);
          } catch {
            if (cancelled) return;
            setError('profile generation failed — please try again');
          } finally {
            if (!cancelled) setGenerating(false);
          }
        }
      } catch {
        if (!cancelled) {
          setError("couldn't load your results — tap to retry");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const radarData = profiles.map(p => ({
    dimension: p.dimensionType,
    band: p.scores.aggregate,
  }));

  const whoTheyAre = profileContent ? extractWhoTheyAre(profileContent) : null;

  return (
    <DraggableWindow title="Your Results" defaultWidth={580} defaultHeight={generating ? 360 : 540}>
      {loading ? (
        <div className="spinner">loading...</div>
      ) : generating ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '2rem' }}>
            <span style={{
              opacity: msgFading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              {GENERATING_MESSAGES[msgIndex]}
            </span>
          </div>
          <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 2 }}>
            this takes about 20-30 seconds
          </p>
        </div>
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
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="section-header" style={{ justifyContent: 'center' }}>
              <span className="section-title">here's what we learned</span>
            </div>
            <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 2, marginBottom: '1.5rem' }}>
              these are descriptive patterns — not labels or scores.<br />
              they help peti understand how to be a better companion.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 1.5rem' }}>
            <RadarChart results={radarData} size={280} />
          </div>

          {whoTheyAre && (
            <div className="card-sm" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.6rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Who You Are
              </h3>
              {renderMarkdownBlock(whoTheyAre)}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingBottom: '1rem' }}>
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
