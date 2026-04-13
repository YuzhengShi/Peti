import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DraggableWindow } from '../components/DraggableWindow';
import { RadarChart } from '../components/RadarChart';
import { getProfiles, ProfileResult } from '../api/profiles';
import type { DimensionType } from '../questions/types';
import type { Band } from '../scoring/utils';

const DIMENSION_NAMES: Record<DimensionType, string> = {
  dailyFunctioning: 'Daily Functioning',
  sleepRegulation: 'Sleep Regulation',
  emotionRegulation: 'Emotion Regulation',
  attachment: 'Attachment',
  personalityFunctioning: 'Personality Functioning',
  bigFive: 'Big Five Traits',
};

const DIMENSION_DESCRIPTIONS: Record<DimensionType, string> = {
  dailyFunctioning: 'how day-to-day activities have been going over the past month.',
  sleepRegulation: 'sleep quality, continuity, and daytime impact.',
  emotionRegulation: 'patterns in how you notice, process, and manage emotions.',
  attachment: 'comfort with closeness and relationship security.',
  personalityFunctioning: 'sense of identity, direction, empathy, and connection.',
  bigFive: 'broad personality tendencies across five trait dimensions.',
};

const BAND_COLORS: Record<Band, { border: string; color: string }> = {
  lower: { border: '#c06060', color: '#c06060' },
  moderate: { border: '#c0a040', color: '#c0a040' },
  higher: { border: '#50a870', color: '#50a870' },
};

/* What each subscale band means — keyed by "dimension:subscale" */
const SUBSCALE_HINTS: Record<string, Record<Band, string>> = {
  // Daily Functioning (higher = more difficulty)
  'dailyFunctioning:cognition':    { lower: 'Sharp focus and clear memory', moderate: 'Occasional difficulty concentrating or remembering', higher: 'Frequent difficulty with concentration and memory' },
  'dailyFunctioning:mobility':     { lower: 'Moves around with ease', moderate: 'Some difficulty with physical activities', higher: 'Substantial difficulty with movement and activity' },
  'dailyFunctioning:self-care':    { lower: 'Manages personal care well', moderate: 'Mild difficulty with self-care', higher: 'Notable difficulty managing personal hygiene' },
  'dailyFunctioning:getting-along':{ lower: 'Comfortable in social interactions', moderate: 'Some difficulty getting along with others', higher: 'Significant difficulty in social situations' },
  'dailyFunctioning:life-activities':{ lower: 'Handles daily responsibilities well', moderate: 'Some difficulty with household or work tasks', higher: 'Substantial difficulty managing daily responsibilities' },
  'dailyFunctioning:participation':{ lower: 'Actively engaged in community life', moderate: 'Some difficulty participating socially', higher: 'Significant barriers to social participation' },
  // Sleep (higher = more disturbance)
  'sleepRegulation:quality':       { lower: 'Restful, refreshing sleep', moderate: 'Sometimes unrefreshing sleep', higher: 'Consistently poor sleep quality' },
  'sleepRegulation:continuity':    { lower: 'Falls and stays asleep easily', moderate: 'Occasional difficulty falling or staying asleep', higher: 'Frequent difficulty falling or staying asleep' },
  'sleepRegulation:daytime-impact':{ lower: 'Alert and energized during the day', moderate: 'Some daytime fatigue', higher: 'Significant daytime fatigue and impairment' },
  // Emotion Regulation — adaptive (higher = more use of healthy strategy)
  'emotionRegulation:awareness':   { lower: 'Less tuned in to emotions', moderate: 'Sometimes notices emotional patterns', higher: 'Strong emotional awareness' },
  'emotionRegulation:acceptance':  { lower: 'Tends to resist or judge emotions', moderate: 'Sometimes allows emotions without judgment', higher: 'Readily accepts emotions as they come' },
  'emotionRegulation:reappraisal': { lower: 'Less likely to reframe situations', moderate: 'Sometimes shifts perspective on challenges', higher: 'Regularly finds new perspectives' },
  'emotionRegulation:problem-focused':{ lower: 'Less action-oriented with triggers', moderate: 'Sometimes takes steps to address causes', higher: 'Actively addresses emotional triggers' },
  // Emotion Regulation — maladaptive (higher = more use)
  'emotionRegulation:suppression': { lower: 'Rarely bottles up emotions', moderate: 'Sometimes suppresses emotional expression', higher: 'Frequently holds back or hides emotions' },
  'emotionRegulation:rumination':  { lower: 'Rarely dwells on negative thoughts', moderate: 'Sometimes gets stuck in negative thinking', higher: 'Frequently caught in repetitive negative thoughts' },
  // Attachment (higher = more of that dimension)
  'attachment:anxiety':            { lower: 'Secure and comfortable with distance', moderate: 'Some sensitivity to closeness changes', higher: 'Heightened fear of rejection or abandonment' },
  'attachment:avoidance':          { lower: 'Comfortable with emotional closeness', moderate: 'Some discomfort with deep intimacy', higher: 'Strong preference for emotional distance' },
  // Personality Functioning (higher = better)
  'personalityFunctioning:identity':      { lower: 'Less stable sense of self', moderate: 'Generally consistent self-concept', higher: 'Strong, coherent sense of who you are' },
  'personalityFunctioning:self-direction':{ lower: 'Less clarity in goals and reflection', moderate: 'Generally goal-oriented with some reflection', higher: 'Clear goals and strong self-reflection' },
  'personalityFunctioning:empathy':       { lower: 'Less attuned to others\' perspectives', moderate: 'Generally aware of others\' experiences', higher: 'Deeply attuned to others\' feelings' },
  'personalityFunctioning:intimacy':      { lower: 'Difficulty forming close connections', moderate: 'Generally capable of meaningful bonds', higher: 'Strong capacity for deep, close relationships' },
  // Big Five (higher = more of that trait)
  'bigFive:neuroticism':       { lower: 'Calm and emotionally steady', moderate: 'Typical emotional reactivity', higher: 'More emotionally reactive and sensitive' },
  'bigFive:extraversion':      { lower: 'Quieter and more reserved', moderate: 'Balanced social energy', higher: 'Outgoing, energetic, and sociable' },
  'bigFive:openness':          { lower: 'Prefers routine and the familiar', moderate: 'Sometimes curious and creative', higher: 'Highly curious, creative, and open to novelty' },
  'bigFive:agreeableness':     { lower: 'More independent and skeptical', moderate: 'Generally cooperative', higher: 'Very warm, trusting, and cooperative' },
  'bigFive:conscientiousness': { lower: 'More flexible and spontaneous', moderate: 'Reasonably organized and disciplined', higher: 'Highly organized, disciplined, and reliable' },
};

export function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'detail' | 'radar'>('detail');
  const [hoveredSub, setHoveredSub] = useState<{ key: string; maxWidth: number } | null>(null);
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
    (async () => {
      try {
        const data = await getProfiles();
        setProfiles(data);
      } catch {
        setError("couldn't load profile — tap to retry");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DraggableWindow title="Full Profile" defaultWidth={840} defaultHeight={640}>
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
        <div style={{ padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="section-header" style={{ justifyContent: 'center' }}>
              <span className="section-title">Your Personality Profile</span>
            </div>
            <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 2 }}>
              descriptive ranges only — these help peti, not define you.
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
                <RadarChart
                  results={profiles.map(p => ({ dimension: p.dimensionType, band: p.scores.aggregate }))}
                  size={320}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {profiles.map(profile => {
                  const band = profile.scores.aggregate;
                  const bandStyle = BAND_COLORS[band];
                  return (
                    <div key={profile.id} className="card-sm">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.65rem' }}>
                          {DIMENSION_NAMES[profile.dimensionType]}
                        </h3>
                        <span className="badge" style={{ borderColor: bandStyle.border, color: bandStyle.color }}>
                          {band}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', lineHeight: 2, marginBottom: '0.75rem' }}>
                        {DIMENSION_DESCRIPTIONS[profile.dimensionType]}
                      </p>

                      {/* Subscales */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        {Object.entries(profile.scores.subscales).map(([name, subBand]) => {
                          const subStyle = BAND_COLORS[subBand];
                          const key = `${profile.dimensionType}:${name}`;
                          const hint = SUBSCALE_HINTS[key]?.[subBand];
                          const isActive = hoveredSub?.key === key;
                          return (
                            <span
                              key={name}
                              className="badge"
                              style={{ borderColor: subStyle.border, color: subStyle.color, fontSize: '0.45rem', cursor: 'default', position: 'relative' }}
                              onMouseEnter={(e) => {
                                const badgeRect = e.currentTarget.getBoundingClientRect();
                                const card = e.currentTarget.closest('.card-sm');
                                const cardRect = card?.getBoundingClientRect();
                                const available = cardRect ? cardRect.right - badgeRect.left - 12 : 260;
                                setHoveredSub({ key, maxWidth: Math.min(260, Math.max(120, available)) });
                              }}
                              onMouseLeave={() => setHoveredSub(null)}
                            >
                              {name}: {subBand}
                              {hint && (
                                <span className="subscale-tooltip" style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 'calc(100% + 8px)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: 6,
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.5rem',
                                  lineHeight: 1.8,
                                  color: 'var(--text-secondary)',
                                  textTransform: 'none',
                                  whiteSpace: 'normal',
                                  maxWidth: isActive ? `${hoveredSub!.maxWidth}px` : '260px',
                                  width: 'max-content',
                                  pointerEvents: 'none',
                                  zIndex: 10,
                                  opacity: isActive ? 1 : 0,
                                  transition: 'opacity 0.2s ease',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                }}>
                                  {hint}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      {/* Last updated */}
                      <p style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>
                        {profile.isStable ? 'stable trait' : 'dynamic — re-assessed periodically'}
                        {' · '}
                        updated {new Date(profile.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DraggableWindow>
  );
}
