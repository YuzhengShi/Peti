import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { RadarChart } from '../components/RadarChart';
import { getProfiles, getProfileContent, ProfileResult } from '../api/profiles';
import type { Band } from '../scoring/utils';

/* ---- Markdown section parser ---- */

interface ProfileSection {
  title: string;
  content: string;
}

function parseProfileSections(markdown: string): ProfileSection[] {
  const sections: ProfileSection[] = [];
  const lines = markdown.split('\n');
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = line.slice(3).trim();
      currentLines = [];
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  return sections;
}

/* ---- Inline markdown renderer ---- */

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderSectionContent(content: string) {
  const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!cleaned) return null;

  return (
    <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 2.2 }}>
      {renderInlineMarkdown(cleaned.replace(/\n/g, ' '))}
    </p>
  );
}

/* ---- Section display order and which to skip ---- */

const SECTION_ORDER = [
  'Who They Are',
  'Personality (Big Five)',
  'Attachment Pattern',
  'Personality Functioning',
  'Sleep & Energy Baseline',
  'Emotion Regulation Baseline',
  'Daily Functioning Baseline',
  'Cross-Domain Connections',
];

const SKIP_SECTIONS = new Set(['The Basics', 'What Peti Knows About Them', 'Notes for Peti']);

/* ---- Band colors (reused from old version) ---- */

const BAND_COLORS: Record<Band, { border: string; color: string }> = {
  lower: { border: '#c06060', color: '#c06060' },
  moderate: { border: '#c0a040', color: '#c0a040' },
  higher: { border: '#50a870', color: '#50a870' },
};

/* ---- Fallback: band-badge cards when no generated content ---- */

const DIMENSION_NAMES: Record<string, string> = {
  dailyFunctioning: 'Daily Functioning',
  sleepRegulation: 'Sleep Regulation',
  emotionRegulation: 'Emotion Regulation',
  attachment: 'Attachment',
  personalityFunctioning: 'Personality Functioning',
  bigFive: 'Big Five Traits',
};

function FallbackCards({ profiles }: { profiles: ProfileResult[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {profiles.map(profile => {
        const band = profile.scores.aggregate;
        const bandStyle = BAND_COLORS[band];
        return (
          <div key={profile.id} className="card-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.65rem' }}>{DIMENSION_NAMES[profile.dimensionType]}</h3>
              <span className="badge" style={{ borderColor: bandStyle.border, color: bandStyle.color }}>{band}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(profile.scores.subscales).map(([name, subBand]) => {
                const s = BAND_COLORS[subBand];
                return (
                  <span key={name} className="badge" style={{ borderColor: s.border, color: s.color, fontSize: '0.45rem' }}>
                    {name}: {subBand}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Main component ---- */

export function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [profileContent, setProfileContent] = useState<string | null>(null);
  const [profileSummary, setProfileSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'detail' | 'radar'>('detail');
  const [fading, setFading] = useState(false);
  const pendingView = useRef<'detail' | 'radar' | null>(null);

  function switchView(next: 'detail' | 'radar') {
    if (next === view || fading) return;
    pendingView.current = next;
    setFading(true);
    setTimeout(() => {
      setView(next);
      pendingView.current = null;
      setFading(false);
    }, 250);
  }

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
        setProfileContent(contentData.content);
        setProfileSummary(contentData.summary);
      } catch {
        if (!cancelled) setError("couldn't load profile — tap to retry");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const radarData = profiles.map(p => ({
    dimension: p.dimensionType,
    band: p.scores.aggregate,
  }));

  const displaySource = profileSummary || profileContent;
  const sections = displaySource ? parseProfileSections(displaySource) : [];
  const sectionMap = new Map(sections.map(s => [s.title, s.content]));

  // Ordered sections, filtering out skipped ones and those not present
  const displaySections = SECTION_ORDER
    .filter(title => sectionMap.has(title))
    .map(title => ({ title, content: sectionMap.get(title)! }));

  // Also include any sections not in our order list (except skipped ones)
  for (const s of sections) {
    if (!SECTION_ORDER.includes(s.title) && !SKIP_SECTIONS.has(s.title)) {
      displaySections.push(s);
    }
  }

  return (
    <DraggableWindow title="Full Profile" defaultWidth={840} defaultHeight={680}>
      {loading ? (
        <div className="spinner">loading your profile...</div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <p>no profile yet.</p>
          <p>take the personality test to build one.</p>
          <Link to="/test" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
            Take the Test
          </Link>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="section-header" style={{ justifyContent: 'center' }}>
              <span className="section-title">Your Personality Profile</span>
            </div>
            <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 2 }}>
              descriptive patterns — these help peti, not define you.
            </p>

            {/* View toggle */}
            <div style={{ display: 'inline-flex', gap: 0, marginTop: '1rem', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <button
                onClick={() => switchView('detail')}
                className={view === 'detail' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.45rem', padding: '0.5rem 1rem', borderRadius: 0, border: 'none' }}
              >
                Detail
              </button>
              <button
                onClick={() => switchView('radar')}
                className={view === 'radar' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.45rem', padding: '0.5rem 1rem', borderRadius: 0, border: 'none' }}
              >
                Radar
              </button>
            </div>
          </div>

          <div style={{
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.25s ease',
          }}>
            {view === 'radar' ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                <RadarChart results={radarData} size={320} />
              </div>
            ) : displaySource ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displaySections.map((section, i) => (
                  <div key={i} className="card-sm">
                    <h3 style={{ fontSize: '0.65rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                      {section.title}
                    </h3>
                    {renderSectionContent(section.content)}
                  </div>
                ))}
              </div>
            ) : (
              <FallbackCards profiles={profiles} />
            )}
          </div>
        </div>
      )}
    </DraggableWindow>
  );
}
