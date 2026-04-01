import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleGuard from '@/components/auth/RoleGuard';
import AuthGuard from '@/components/auth/AuthGuard';

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/auth/AccountStatusGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Instructor website-layer route gating', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects a student away from /instructor/questions', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, accountType: 'student', capabilities: [] });

    render(
      <MemoryRouter initialEntries={['/instructor/questions']}>
        <Routes>
          <Route
            path="/instructor/questions"
            element={
              <AuthGuard>
                <RoleGuard allowedAccountTypes={['instructor', 'admin']}>
                  <div>Questions Page</div>
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('allows an instructor to access /instructor/questions', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, accountType: 'instructor', capabilities: ['create_courses'] });

    render(
      <MemoryRouter initialEntries={['/instructor/questions']}>
        <Routes>
          <Route
            path="/instructor/questions"
            element={
              <AuthGuard>
                <RoleGuard allowedAccountTypes={['instructor', 'admin']}>
                  <div>Questions Page</div>
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Questions Page')).toBeInTheDocument();
  });

  it('allows an admin to access /instructor/questions', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, loading: false, accountType: 'admin', capabilities: ['admin_backoffice'] });

    render(
      <MemoryRouter initialEntries={['/instructor/questions']}>
        <Routes>
          <Route
            path="/instructor/questions"
            element={
              <AuthGuard>
                <RoleGuard allowedAccountTypes={['instructor', 'admin']}>
                  <div>Questions Page</div>
                </RoleGuard>
              </AuthGuard>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Questions Page')).toBeInTheDocument();
  });
});
