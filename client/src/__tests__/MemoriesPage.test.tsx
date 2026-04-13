import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MemoriesPage } from '../pages/MemoriesPage';

// Mock the API module
vi.mock('../api/memories', () => ({
  getMemories: vi.fn(),
  deleteMemory: vi.fn(),
  updateMemory: vi.fn(),
}));

// Mock DraggableWindow to just render children (avoids window.innerWidth issues in jsdom)
vi.mock('../components/DraggableWindow', () => ({
  DraggableWindow: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="draggable-window" data-title={title}>
      {children}
    </div>
  ),
}));

// Mock useDebounce to pass through immediately
vi.mock('../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

import { getMemories, deleteMemory } from '../api/memories';

const MOCK_MEMORIES = [
  {
    id: '1',
    content: 'User likes reading before bed',
    category: 'observation',
    importance: 3,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: '2',
    content: 'Suggested journaling for stress — user said it helped',
    category: 'strategy',
    importance: 4,
    isActive: true,
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <MemoriesPage />
    </MemoryRouter>,
  );
}

describe('MemoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching', () => {
    // Never resolve — stay in loading
    (getMemories as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText('finding our memories...')).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch failure', async () => {
    (getMemories as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("couldn't load memories — tap to retry")).toBeInTheDocument();
    });
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders memory cards after successful fetch', async () => {
    (getMemories as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: MOCK_MEMORIES,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('User likes reading before bed')).toBeInTheDocument();
    });
    expect(screen.getByText('Suggested journaling for stress — user said it helped')).toBeInTheDocument();
    // Category appears both in filter dropdown and badge — check badge exists
    const observationBadges = screen.getAllByText('observation');
    expect(observationBadges.length).toBeGreaterThanOrEqual(2); // dropdown option + badge
    const strategyBadges = screen.getAllByText('strategy');
    expect(strategyBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows empty state when no memories exist', async () => {
    (getMemories as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('nothing here yet.')).toBeInTheDocument();
    });
    expect(screen.getByText('Create First Memory')).toBeInTheDocument();
  });

  it('optimistically removes memory on delete', async () => {
    (getMemories as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: MOCK_MEMORIES,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    (deleteMemory as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('User likes reading before bed')).toBeInTheDocument();
    });

    // Click the delete button (the "x") for the first memory
    const deleteButtons = screen.getAllByLabelText('Delete memory');
    fireEvent.click(deleteButtons[0]);

    // Memory should be immediately removed (optimistic)
    await waitFor(() => {
      expect(screen.queryByText('User likes reading before bed')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Suggested journaling for stress — user said it helped')).toBeInTheDocument();
  });
});
