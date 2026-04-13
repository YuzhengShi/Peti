import type { Band } from '../scoring/utils';
import type { DimensionType } from '../questions/types';

interface RadarChartProps {
  results: { dimension: DimensionType; band: Band }[];
  size?: number;
}

const DIMENSION_LABELS: Record<DimensionType, string> = {
  dailyFunctioning: 'Functioning',
  sleepRegulation: 'Sleep',
  emotionRegulation: 'Emotion Reg.',
  attachment: 'Attachment',
  personalityFunctioning: 'Personality',
  bigFive: 'Big Five',
};

const BAND_RADIUS: Record<Band, number> = {
  lower: 0.33,
  moderate: 0.67,
  higher: 1.0,
};

const DIMENSION_ORDER: DimensionType[] = [
  'dailyFunctioning',
  'sleepRegulation',
  'emotionRegulation',
  'attachment',
  'personalityFunctioning',
  'bigFive',
];

const CX = 190;
const CY = 190;
const MAX_R = 110;
const N = 6;

function angle(i: number) {
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function point(i: number, r: number) {
  const a = angle(i);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function hexPath(r: number) {
  return (
    Array.from({ length: N }, (_, i) => {
      const p = point(i, r);
      return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
    }).join(' ') + ' Z'
  );
}

export function RadarChart({ results, size = 280 }: RadarChartProps) {
  const resultMap = new Map(results.map(r => [r.dimension, r.band]));

  const dataPath =
    DIMENSION_ORDER.map((dim, i) => {
      const band = resultMap.get(dim) ?? 'moderate';
      const r = BAND_RADIUS[band] * MAX_R;
      const p = point(i, r);
      return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
    }).join(' ') + ' Z';

  // Label offsets to avoid overlap with chart
  const labelOffset = (i: number) => {
    const base = point(i, MAX_R + 38);
    // Nudge top/bottom labels vertically
    if (i === 0) return { ...base, y: base.y - 4 };
    if (i === 3) return { ...base, y: base.y + 4 };
    return base;
  };

  return (
    <svg viewBox="0 0 380 380" width={size} height={size}>
      <style>{`
        .radar-point { cursor: pointer; }
        .radar-point .radar-label { opacity: 0; transition: opacity 0.3s ease; }
        .radar-point:hover .radar-label { opacity: 1; }
        .radar-point:hover circle { r: 5; }
      `}</style>
      {/* Grid rings */}
      {[0.33, 0.67, 1.0].map(scale => (
        <path
          key={scale}
          d={hexPath(scale * MAX_R)}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="1"
          opacity="0.25"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: N }, (_, i) => {
        const p = point(i, MAX_R);
        return (
          <line
            key={i}
            x1={CX} y1={CY} x2={p.x} y2={p.y}
            stroke="var(--text-primary)"
            strokeWidth="1"
            opacity="0.2"
          />
        );
      })}

      {/* Data fill */}
      <path d={dataPath} fill="rgba(100,180,120,0.2)" stroke="rgba(100,180,120,0.7)" strokeWidth="2" />

      {/* Data points with hover labels */}
      {DIMENSION_ORDER.map((dim, i) => {
        const band = resultMap.get(dim) ?? 'moderate';
        const r = BAND_RADIUS[band] * MAX_R;
        const p = point(i, r);
        return (
          <g key={dim} className="radar-point">
            <circle cx={p.x} cy={p.y} r="3.5" fill="rgba(100,180,120,0.9)" style={{ transition: 'r 0.2s ease' }} />
            <text
              className="radar-label"
              x={p.x} y={p.y - 12}
              textAnchor="middle"
              dominantBaseline="auto"
              style={{ fontSize: '9px', fontFamily: "'Press Start 2P'", fill: 'var(--text-muted)' }}
            >
              {band}
            </text>
          </g>
        );
      })}

      {/* Dimension labels */}
      {DIMENSION_ORDER.map((dim, i) => {
        const lp = labelOffset(i);
        return (
          <text
            key={dim}
            x={lp.x} y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: '9px', fontFamily: "'Press Start 2P'", fill: 'var(--text-secondary)' }}
          >
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
}
