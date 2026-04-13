import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useOnboarding
const mockUseOnboarding = vi.fn();
vi.mock('../hooks/useOnboarding', () => ({
  useOnboarding: () => mockUseOnboarding(),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  it('shows Login and Register links when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    mockUseOnboarding.mockReturnValue({ onboarded: false });

    renderNavbar();

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows username and Logout when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' },
      logout: vi.fn(),
    });
    mockUseOnboarding.mockReturnValue({ onboarded: false });

    renderNavbar();

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('shows Dashboard and Profile links when onboarded', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' },
      logout: vi.fn(),
    });
    mockUseOnboarding.mockReturnValue({ onboarded: true });

    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('shows Admin link only for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' },
      logout: vi.fn(),
    });
    mockUseOnboarding.mockReturnValue({ onboarded: true });

    renderNavbar();

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('always shows Peti brand link', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    mockUseOnboarding.mockReturnValue({ onboarded: false });

    renderNavbar();

    expect(screen.getByText('Peti')).toBeInTheDocument();
  });
});
