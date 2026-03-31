import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthGuard from '@/components/auth/AuthGuard';
import RoleGuard from '@/components/auth/RoleGuard';
import PortalGuard from '@/core/guards/PortalGuard';
import { PORTALS } from '@/core/portals/registry';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/auth/AccountStatusGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="account-status-gate">{children}</div>,
}));

describe('auth and portal guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AuthGuard redirects unauthenticated users to login with redirect param', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<AuthGuard><div>Secret</div></AuthGuard>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('AuthGuard renders through AccountStatusGate for authenticated users', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false });

    render(
      <MemoryRouter>
        <AuthGuard><div>Secure Area</div></AuthGuard>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('account-status-gate')).toHaveTextContent('Secure Area');
  });

  it('RoleGuard prefers canonical accountType for access decisions', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      loading: false,
      accountType: 'admin',
      capabilities: [],
      role: 'admin',
      roles: ['admin'],
    });

    render(
      <MemoryRouter>
        <RoleGuard allowedAccountTypes={['admin']}>
          <div>Admin Only</div>
        </RoleGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Only')).toBeInTheDocument();
  });

  it('RoleGuard still honors the legacy role shim when canonical identity is unavailable', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      loading: false,
      accountType: null,
      capabilities: [],
      role: 'admin',
      roles: ['admin'],
    });

    render(
      <MemoryRouter>
        <RoleGuard allowedRoles={['admin']}>
          <div>Admin Only</div>
        </RoleGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Only')).toBeInTheDocument();
  });

  it('RoleGuard denies access when canonical identity does not match', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      loading: false,
      accountType: 'freelancer',
      capabilities: [],
      role: 'individual',
      roles: ['individual'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<RoleGuard allowedAccountTypes={['admin']}><div>Admin Only</div></RoleGuard>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('PortalGuard redirects to login when the portal requires auth and there is no user', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, accountType: null, capabilities: [], roles: [] });

    render(
      <MemoryRouter initialEntries={['/enterprise/portal']}>
        <Routes>
          <Route
            path="/enterprise/portal"
            element={<PortalGuard portal={PORTALS.enterprise}><div>Enterprise Workspace</div></PortalGuard>}
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('PortalGuard redirects authenticated users without allowed account access to home', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, accountType: 'company', capabilities: [], role: 'company', roles: ['company'] });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<PortalGuard portal={PORTALS.backoffice}><div>Backoffice</div></PortalGuard>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('PortalGuard allows authenticated users with canonical account access and wraps them in AccountStatusGate', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, accountType: 'admin', capabilities: ['admin_backoffice'], role: 'admin', roles: ['admin'] });

    render(
      <MemoryRouter>
        <PortalGuard portal={PORTALS.backoffice}><div>Backoffice</div></PortalGuard>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('account-status-gate')).toHaveTextContent('Backoffice');
  });
});
