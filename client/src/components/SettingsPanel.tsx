import { useState, useRef, useEffect } from 'react';
import { useSettings, Theme } from '../hooks/useSettings';

const TRACKS = [
  { name: 'Aventure', src: '/aventure-lofi-chill-nostalgic-469629.mp3' },
  { name: 'Monume', src: '/monume-lofi-lofi-girl-lofi-chill-509453.mp3' },
];

export function SettingsPanel() {
  const { theme, setTheme } = useSettings();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  function openPanel() { setOpen(true); setClosing(false); }
  function closePanel() {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 120);
  }
  const ref = useRef<HTMLDivElement>(null);

  // Music state
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) closePanel();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Autoplay on first user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    function startOnInteraction() {
      if (!playing) {
        audio!.play().then(() => setPlaying(true)).catch(() => {});
      }
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
    }

    // Try immediate autoplay first
    audio.play().then(() => setPlaying(true)).catch(() => {
      // Blocked — wait for first interaction
      document.addEventListener('click', startOnInteraction);
      document.addEventListener('keydown', startOnInteraction);
    });

    return () => {
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('keydown', startOnInteraction);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // On track change, keep playing if was playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playing) audio.play();
  }, [trackIdx]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  function prevTrack() { setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length); }
  function nextTrack() { setTrackIdx(i => (i + 1) % TRACKS.length); }

  return (
    <div ref={ref}>
      <audio ref={audioRef} src={TRACKS[trackIdx].src} onEnded={nextTrack} />

      <button
        className="settings-gear"
        onClick={() => open ? closePanel() : openPanel()}
        aria-label="Settings"
        title="Settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="3" />
          <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
        </svg>
      </button>

      {open && (
        <div className={`settings-popover${closing ? ' settings-popover-closing' : ''}`}>
          {/* Appearance */}
          <div style={{ fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Appearance
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem' }}>
            {(['light', 'dark'] as Theme[]).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="settings-option"
                data-active={theme === t}
              >
                <span className="settings-option-icon">{t === 'light' ? '*' : 'C'}</span>
                <span className="settings-option-label">{t.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Music */}
          <div style={{ fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Music
          </div>
          <div style={{ fontSize: '0.42rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.6rem' }}>
            {TRACKS[trackIdx].name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <button onClick={prevTrack} className="music-ctrl" title="Previous" aria-label="Previous track">‹</button>
            <button onClick={togglePlay} className="music-ctrl music-ctrl-main" title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause music' : 'Play music'}>
              {playing ? '▐▐' : '▶'}
            </button>
            <button onClick={nextTrack} className="music-ctrl" title="Next" aria-label="Next track">›</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>♪</span>
            <input
              type="range" min="0" max="1" step="0.01" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
              aria-label="Volume"
            />
            <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', minWidth: '1.8rem' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
