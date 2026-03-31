import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createTestQueryClient } from '@/test/test-utils';

const mockState = {
  session: null as any,
  roles: [] as Array<{ role: 'individual' | 'company' | 'admin' | 'expert' | 'student' | 'instructor'; is_primary: boolean }>,
  profile: {
    account_status: 'active' as 'pending_verification' | 'pending_approval' | 'active' | 'suspended' | 'banned' | 'deactivated',
    account_type: null as null | 'freelancer' | 'company' | 'admin' | 'expert' | 'student' | 'instructor' | 'individual',
    capabilities: [] as string[],
    approval_status: null as null | 'auto_approved' | 'pending_review' | 'approved' | 'rejected',
    badges: [] as string[],
    entitlements: [] as string[],
  },
  signUpError: null as any,
  signInError: null as any,
  resetPasswordError: null as any,
  updatePasswordError: null as any,
};

const onAuthStateChange = vi.fn();
const getSession = vi.fn();
const signUp = vi.fn();
const signInWithPassword = vi.fn();
const signOut = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const channelUnsubscribe = vi.fn();

function createAwaitableChain(getResult: () => any, methods: string[] = ['eq', 'order', 'maybeSingle']) {
  const chain: any = {};
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = (resolve: any, reject: any) => Promise.resolve(getResult()).then(resolve, reject);
  return chain;
}

const from = vi.fn((table: string) => {
  if (table === 'user_roles') {
    return {
      select: vi.fn(() => createAwaitableChain(() => ({ data: mockState.roles, error: null }), ['eq', 'order'])),
    };
  }

  if (table === 'profiles') {
    return {
      select: vi.fn(() => createAwaitableChain(() => ({ data: mockState.profile, error: null }), ['eq', 'maybeSingle'])),
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: any[]) => onAuthStateChange(...args),
      getSession: (...args: any[]) => getSession(...args),
      signUp: (...args: any[]) => signUp(...args),
      signInWithPassword: (...args: any[]) => signInWithPassword(...args),
      signOut: (...args: any[]) => signOut(...args),
      resetPasswordForEmail: (...args: any[]) => resetPasswordForEmail(...args),
      updateUser: (...args: any[]) => updateUser(...args),
    },
    from: (...args: [string]) => from(...args),
  },
}));

function Consumer() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="account-type">{auth.accountType ?? 'none'}</div>
      <div data-testid="role">{auth.role ?? 'none'}</div>
      <div data-testid="roles">{auth.roles.join(',')}</div>
      <div data-testid="capabilities">{auth.capabilities.join(',')}</div>
      <div data-testid="status">{auth.accountStatus ?? 'none'}</div>
      <div data-testid="approval">{auth.approvalStatus ?? 'none'}</div>
      <div data-testid="badges">{auth.badges.join(',') || 'none'}</div>
      <div data-testid="entitlements">{auth.entitlements.join(',') || 'none'}</div>
      <div data-testid="verified">{String(auth.isEmailVerified)}</div>
      <div data-testid="has-capability">{String(auth.hasCapability('post_jobs'))}</div>
      <button onClick={() => auth.signIn('test@devwady.com', 'secret')}>sign-in</button>
      <button onClick={() => auth.signUp('new@devwady.com', 'secret', { accountType: 'company' })}>sign-up</button>
      <button onClick={() => auth.resetPassword('reset@devwady.com')}>reset</button>
      <button onClick={() => auth.updatePassword('new-secret')}>update-password</button>
      <button
        onClick={async () => {
          try {
            await auth.switchRole('individual');
            (window as any).__switchRoleResult = 'resolved';
          } catch (error: any) {
            (window as any).__switchRoleResult = error.message;
          }
        }}
      >
        switch-role
      </button>
      <button
        onClick={async () => {
          const result = await auth.addRole('student');
          (window as any).__addRoleResult = result.error?.message ?? 'none';
        }}
      >
        add-role
      </button>
      <button onClick={() => auth.signOut()}>sign-out</button>
    </div>
  );
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).__switchRoleResult = null;
    (window as any).__addRoleResult = null;
    mockState.session = {
      user: {
        id: 'user-1',
        email: 'user@devwady.com',
        email_confirmed_at: '2026-01-01T00:00:00Z',
      },
    };
    mockState.roles = [{ role: 'individual', is_primary: true }];
    mockState.profile = {
      account_status: 'pending_approval',
      account_type: 'freelancer',
      capabilities: [],
      approval_status: null,
      badges: [],
      entitlements: [],
    };

    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: channelUnsubscribe } } });
    getSession.mockResolvedValue({ data: { session: mockState.session } });
    signUp.mockResolvedValue({ error: mockState.signUpError });
    signInWithPassword.mockResolvedValue({ error: mockState.signInError });
    signOut.mockResolvedValue({ error: null });
    resetPasswordForEmail.mockResolvedValue({ error: mockState.resetPasswordError });
    updateUser.mockResolvedValue({ error: mockState.updatePasswordError });
  });

  it('hydrates canonical account state from profiles first and keeps role/roles as a single-role compatibility shim', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('account-type')).toHaveTextContent('freelancer');
    expect(screen.getByTestId('role')).toHaveTextContent('individual');
    expect(screen.getByTestId('roles')).toHaveTextContent('individual');
    expect(screen.getByTestId('capabilities')).toHaveTextContent('apply_jobs');
    expect(screen.getByTestId('status')).toHaveTextContent('pending_approval');
    expect(screen.getByTestId('approval')).toHaveTextContent('pending_review');
    expect(screen.getByTestId('badges')).toHaveTextContent('none');
    expect(screen.getByTestId('entitlements')).toHaveTextContent('none');
    expect(screen.getByTestId('verified')).toHaveTextContent('true');
    expect(screen.getByTestId('has-capability')).toHaveTextContent('false');
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('marks approved status only for active accounts with a canonical account type', async () => {
    mockState.roles = [];
    mockState.profile = {
      account_status: 'active',
      account_type: 'company',
      capabilities: [],
      approval_status: null,
      badges: [],
      entitlements: [],
    };
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('account-type')).toHaveTextContent('company');
    expect(screen.getByTestId('approval')).toHaveTextContent('approved');
    expect(screen.getByTestId('has-capability')).toHaveTextContent('true');
  });

  it('delegates sign-in, sign-up, reset, and password update to Supabase auth', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    fireEvent.click(screen.getByText('sign-in'));
    fireEvent.click(screen.getByText('sign-up'));
    fireEvent.click(screen.getByText('reset'));
    fireEvent.click(screen.getByText('update-password'));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({ email: 'test@devwady.com', password: 'secret' });
      expect(signUp).toHaveBeenCalledWith({
        email: 'new@devwady.com',
        password: 'secret',
        options: { data: { accountType: 'company' }, emailRedirectTo: window.location.origin },
      });
      expect(resetPasswordForEmail).toHaveBeenCalledWith('reset@devwady.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      expect(updateUser).toHaveBeenCalledWith({ password: 'new-secret' });
    });
  });

  it('keeps canonical identity stable when deprecated switchRole and addRole are called', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('account-type')).toHaveTextContent('freelancer'));

    fireEvent.click(screen.getByText('switch-role'));
    fireEvent.click(screen.getByText('add-role'));

    await waitFor(() => {
      expect((window as any).__switchRoleResult).toContain('disabled');
      expect((window as any).__addRoleResult).toContain('disabled');
    });

    expect(screen.getByTestId('account-type')).toHaveTextContent('freelancer');
    expect(screen.getByTestId('role')).toHaveTextContent('individual');
    expect(screen.getByTestId('roles')).toHaveTextContent('individual');
  });

  it('signs out cleanly and clears auth state', async () => {
    const queryClient = createTestQueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('account-type')).toHaveTextContent('freelancer'));

    fireEvent.click(screen.getByText('sign-out'));

    await waitFor(() => {
      expect(screen.getByTestId('account-type')).toHaveTextContent('none');
      expect(screen.getByTestId('role')).toHaveTextContent('none');
      expect(screen.getByTestId('roles')).toHaveTextContent('');
    });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalled();
  });
});
