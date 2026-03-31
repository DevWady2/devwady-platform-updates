import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostLoginRedirect from '@/components/auth/PostLoginRedirect';

const navigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseLanguage = vi.fn();
const mockUseProfileCompleteness = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock('@/hooks/useProfileCompleteness', () => ({
  useProfileCompleteness: () => mockUseProfileCompleteness(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('PostLoginRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguage.mockReturnValue({ lang: 'en' });
    mockUseProfileCompleteness.mockReturnValue({ score: 100, loading: false });
  });

  it('redirects unauthenticated users to login', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      accountStatus: null,
      isEmailVerified: false,
      loading: false,
    });

    render(
      <MemoryRouter>
        <PostLoginRedirect />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login', { replace: true }));
  });

  it('sends low-completeness individuals to freelancer onboarding', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      role: 'individual',
      accountStatus: 'active',
      isEmailVerified: true,
      loading: false,
    });
    mockUseProfileCompleteness.mockReturnValue({ score: 10, loading: false });

    render(
      <MemoryRouter>
        <PostLoginRedirect />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/onboarding/freelancer', { replace: true }));
  });

  it('routes verified companies with complete profiles to the enterprise portal', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      role: 'company',
      accountStatus: 'active',
      isEmailVerified: true,
      loading: false,
    });

    render(
      <MemoryRouter>
        <PostLoginRedirect />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('sends unverified non-admin users to verify-email', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      role: 'company',
      accountStatus: 'active',
      isEmailVerified: false,
      loading: false,
    });

    render(
      <MemoryRouter>
        <PostLoginRedirect />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/verify-email', { replace: true }));
  });

  it('honors redirect param once profile score is sufficient', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      role: 'company',
      accountStatus: 'active',
      isEmailVerified: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/post-login?redirect=%2Fsettings']}>
        <PostLoginRedirect />
      </MemoryRouter>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/settings', { replace: true }));
  });
});
