import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarChart } from '../components/RadarChart';
import type { Band } from '../scoring/utils';
import type { DimensionType } from '../questions/types';

const ALL_DIMENSIONS: DimensionType[] = [
  'dailyFunctioning',
  'sleepRegulation',
  'emotionRegulation',
  'attachment',
  'personalityFunctioning',
  'bigFive',
];

function makeResults(band: Band) {
  return ALL_DIMENSIONS.map(d => ({ dimension: d, band }));
}

describe('RadarChart', () => {
  it('renders an SVG with all 6 dimension labels', () => {
    const { container } = render(<RadarChart results={makeResults('moderate')} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    expect(screen.getByText('Functioning')).toBeInTheDocument();
    expect(screen.getByText('Sleep')).toBeInTheDocument();
    expect(screen.getByText('Emotion Reg.')).toBeInTheDocument();
    expect(screen.getByText('Attachment')).toBeInTheDocument();
    expect(screen.getByText('Personality')).toBeInTheDocument();
    expect(screen.getByText('Big Five')).toBeInTheDocument();
  });

  it('renders 3 grid hexagons (lower/moderate/higher rings)', () => {
    const { container } = render(<RadarChart results={makeResults('higher')} />);
    // 3 grid paths + 1 data path = 4 total paths
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(4);
  });

  it('renders 6 data points', () => {
    const { container } = render(<RadarChart results={makeResults('lower')} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });

  it('uses custom size prop for SVG dimensions', () => {
    const { container } = render(<RadarChart results={makeResults('moderate')} size={400} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '400');
    expect(svg).toHaveAttribute('height', '400');
  });

  it('defaults missing dimensions to moderate band', () => {
    // Only provide 3 of 6 dimensions
    const partial = [
      { dimension: 'bigFive' as DimensionType, band: 'higher' as Band },
      { dimension: 'attachment' as DimensionType, band: 'lower' as Band },
      { dimension: 'sleepRegulation' as DimensionType, band: 'higher' as Band },
    ];
    const { container } = render(<RadarChart results={partial} />);
    // Should still render all 6 data points without error
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });
});
