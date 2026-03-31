import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { createTestQueryClient } from '@/test/test-utils';

const mockState = {
  session: null as any,
  roles: [] as Array<{ role: 'individual' | 'company' | 'admin' | 'expert' | 'student' | 'instructor'; is_primary: boolean }>,
  accountStatus: 'active',
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

const userRolesUpdateCalls: any[] = [];
const userRolesInsertCalls: any[] = [];

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
      update: vi.fn((payload: any) => {
        userRolesUpdateCalls.push(payload);
        if (payload.is_primary === false) {
          mockState.roles = mockState.roles.map((r) => ({ ...r, is_primary: false }));
        }
        if (payload.is_primary === true) {
          mockState.roles = mockState.roles.map((r) => ({ ...r, is_primary: r.role === 'individual' }));
        }
        return createAwaitableChain(() => ({ data: null, error: null }), ['eq']);
      }),
      insert: vi.fn((payload: any) => {
        userRolesInsertCalls.push(payload);
        mockState.roles = [
          ...mockState.roles,
          { role: payload.role, is_primary: Boolean(payload.is_primary) },
        ];
        return Promise.resolve({ error: null });
      }),
    };
  }

  if (table === 'profiles') {
    return {
      select: vi.fn(() => createAwaitableChain(() => ({ data: { account_status: mockState.accountStatus }, error: null }), ['eq', 'maybeSingle'])),
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
      <div data-testid="role">{auth.role ?? 'none'}</div>
      <div data-testid="roles">{auth.roles.join(',')}</div>
      <div data-testid="status">{auth.accountStatus ?? 'none'}</div>
      <div data-testid="verified">{String(auth.isEmailVerified)}</div>
      <button onClick={() => auth.signIn('test@devwady.com', 'secret')}>sign-in</button>
      <button onClick={() => auth.signUp('new@devwady.com', 'secret', { role: 'company' })}>sign-up</button>
      <button onClick={() => auth.resetPassword('reset@devwady.com')}>reset</button>
      <button onClick={() => auth.updatePassword('new-secret')}>update-password</button>
      <button onClick={() => auth.switchRole('individual')}>switch-role</button>
      <button onClick={() => auth.addRole('student')}>add-role</button>
      <button onClick={() => auth.signOut()}>sign-out</button>
    </div>
  );
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.session = {
      user: {
        id: 'user-1',
        email: 'user@devwady.com',
        email_confirmed_at: '2026-01-01T00:00:00Z',
      },
    };
    mockState.roles = [
      { role: 'company', is_primary: true },
      { role: 'individual', is_primary: false },
    ];
    mockState.accountStatus = 'active';

    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: channelUnsubscribe } } });
    getSession.mockResolvedValue({ data: { session: mockState.session } });
    signUp.mockResolvedValue({ error: mockState.signUpError });
    signInWithPassword.mockResolvedValue({ error: mockState.signInError });
    signOut.mockResolvedValue({ error: null });
    resetPasswordForEmail.mockResolvedValue({ error: mockState.resetPasswordError });
    updateUser.mockResolvedValue({ error: mockState.updatePasswordError });
    userRolesUpdateCalls.length = 0;
    userRolesInsertCalls.length = 0;
  });

  it('hydrates session, primary role, roles, and account status from Supabase', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('role')).toHaveTextContent('company');
    expect(screen.getByTestId('roles')).toHaveTextContent('company,individual');
    expect(screen.getByTestId('status')).toHaveTextContent('active');
    expect(screen.getByTestId('verified')).toHaveTextContent('true');
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(getSession).toHaveBeenCalledTimes(1);
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
        options: { data: { role: 'company' }, emailRedirectTo: window.location.origin },
      });
      expect(resetPasswordForEmail).toHaveBeenCalledWith('reset@devwady.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      expect(updateUser).toHaveBeenCalledWith({ password: 'new-secret' });
    });
  });

  it('switches the active role and clears the query cache', async () => {
    const queryClient = createTestQueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('company'));

    fireEvent.click(screen.getByText('switch-role'));

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('individual'));
    expect(clearSpy).toHaveBeenCalled();
    expect(userRolesUpdateCalls).toEqual([{ is_primary: false }, { is_primary: true }]);
  });

  it('adds a new role, refetches roles, and signs out cleanly', async () => {
    const queryClient = createTestQueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('company,individual'));

    fireEvent.click(screen.getByText('add-role'));
    await waitFor(() => expect(screen.getByTestId('roles')).toHaveTextContent('student'));
    expect(userRolesInsertCalls[0]).toEqual({ user_id: 'user-1', role: 'student', is_primary: false });

    fireEvent.click(screen.getByText('sign-out'));
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('none'));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalled();
  });
});
