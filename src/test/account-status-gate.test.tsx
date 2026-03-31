import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountStatusGate from '@/components/auth/AccountStatusGate';

const mockUseAuth = vi.fn();
const mockUseLanguage = vi.fn();
const resend = vi.fn();
const refreshSession = vi.fn();
const signOut = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const profileUpdate = vi.fn();
const profileSelect = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => mockUseLanguage(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccess(...args),
    error: (...args: any[]) => toastError(...args),
  },
}));

function createAwaitableChain(resultFactory: () => any, methods: string[] = ['eq', 'maybeSingle']) {
  const chain: any = {};
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = (resolve: any, reject: any) => Promise.resolve(resultFactory()).then(resolve, reject);
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resend: (...args: any[]) => resend(...args),
      refreshSession: (...args: any[]) => refreshSession(...args),
    },
    from: (table: string) => {
      if (table !== 'profiles') throw new Error('Unexpected table');
      return {
        select: (...args: any[]) => profileSelect(...args),
        update: (...args: any[]) => profileUpdate(...args),
      };
    },
  },
}));

describe('AccountStatusGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguage.mockReturnValue({ lang: 'en' });
    resend.mockResolvedValue({ error: null });
    refreshSession.mockResolvedValue({ data: {} });
    profileSelect.mockImplementation(() => createAwaitableChain(() => ({ data: { status_reason: 'Terms violation' } }))); 
    profileUpdate.mockImplementation(() => createAwaitableChain(() => ({ error: null }), ['eq']));
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  it('shows email verification state and resends the verification email', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'user@devwady.com' },
      accountStatus: 'active',
      isEmailVerified: false,
      signOut,
    });

    render(
      <MemoryRouter>
        <AccountStatusGate><div>Child</div></AccountStatusGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Please verify your email/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Resend verification email/i }));

    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith({ type: 'signup', email: 'user@devwady.com' });
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it('auto-signs out banned users and shows the disabled screen', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'user@devwady.com' },
      accountStatus: 'banned',
      isEmailVerified: true,
      signOut,
    });

    render(
      <MemoryRouter>
        <AccountStatusGate><div>Child</div></AccountStatusGate>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Account disabled/i)).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });

  it('shows pending approval state for company accounts', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'user@devwady.com' },
      accountStatus: 'pending_approval',
      isEmailVerified: true,
      signOut,
    });

    render(
      <MemoryRouter>
        <AccountStatusGate><div>Child</div></AccountStatusGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Account under review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact support/i })).toBeInTheDocument();
  });

  it('reactivates deactivated users using the existing profiles table', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'user@devwady.com' },
      accountStatus: 'deactivated',
      isEmailVerified: true,
      signOut,
    });

    render(
      <MemoryRouter>
        <AccountStatusGate><div>Child</div></AccountStatusGate>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Reactivate my account/i }));

    await waitFor(() => {
      expect(profileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ account_status: 'active' }),
      );
      expect(toastSuccess).toHaveBeenCalled();
    });
  });
});
