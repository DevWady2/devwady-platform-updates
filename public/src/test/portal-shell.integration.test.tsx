import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EnterpriseLayout from '@/portals/enterprise/EnterpriseLayout';
import TalentLayout from '@/portals/talent/TalentLayout';
import ConsultingLayout from '@/portals/consulting/ConsultingLayout';
import AcademyLayout from '@/portals/academy/AcademyLayout';
import BackofficeLayout from '@/portals/backoffice/BackofficeLayout';

const authState = {
  user: { email: 'tester@devwady.com' },
  loading: false,
  accountType: 'company' as string,
  role: 'company' as string,
  roles: ['company'] as string[],
  signOut: vi.fn(async () => {}),
};

const languageState = {
  lang: 'en',
  dir: 'ltr',
  setLang: vi.fn(),
  t: (key: string) => key,
};

const themeState = {
  theme: 'light',
  toggleTheme: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => languageState,
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => themeState,
}));

vi.mock('@/components/auth/AccountStatusGate', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">bell</div>,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

function setAuthAccountType(accountType: string) {
  authState.accountType = accountType;
  authState.role = accountType === 'freelancer' ? 'individual' : accountType;
  authState.roles = authState.role ? [authState.role] : [];
}

function renderAt(path: string, element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('shared portal shell integration', () => {
  beforeEach(() => {
    authState.loading = false;
    authState.user = { email: 'tester@devwady.com' };
    setAuthAccountType('company');
    authState.signOut.mockClear();

    languageState.lang = 'en';
    languageState.dir = 'ltr';
    languageState.setLang.mockClear();

    themeState.theme = 'light';
    themeState.toggleTheme.mockClear();
  });

  it('renders enterprise shell with sidebar, breadcrumb, and child content', () => {
    renderAt(
      '/enterprise/portal/projects/123e4567-e89b-12d3-a456-426614174000',
      <EnterpriseLayout><div>Enterprise page body</div></EnterpriseLayout>
    );

    expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('My Projects')).toBeInTheDocument();
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Enterprise page body')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('renders talent company navigation for company users', () => {
    setAuthAccountType('company');

    renderAt(
      '/talent/portal/company/jobs',
      <TalentLayout><div>Talent company body</div></TalentLayout>
    );

    expect(screen.getAllByText('Talent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Job Listings')).toBeInTheDocument();
    expect(screen.getByText('Browse Talent')).toBeInTheDocument();
    expect(screen.getByText('Shortlists')).toBeInTheDocument();
    expect(screen.queryByText('Browse Jobs')).not.toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('renders talent freelancer navigation for freelancer accounts via the legacy role shim', () => {
    setAuthAccountType('freelancer');

    renderAt(
      '/talent/portal/freelancer/profile',
      <TalentLayout><div>Talent freelancer body</div></TalentLayout>
    );

    expect(screen.getByText('Browse Jobs')).toBeInTheDocument();
    expect(screen.getByText('My Applications')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.queryByText('Browse Talent')).not.toBeInTheDocument();
    expect(screen.getByText('Freelancer')).toBeInTheDocument();
    expect(screen.getAllByText('Profile').length).toBeGreaterThanOrEqual(1);
  });

  it('renders consulting expert navigation for expert users', () => {
    setAuthAccountType('expert');

    renderAt(
      '/consulting/portal/bookings',
      <ConsultingLayout><div>Consulting expert body</div></ConsultingLayout>
    );

    expect(screen.getAllByText('Consulting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bookings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.getByText('Earnings')).toBeInTheDocument();
    expect(screen.queryByText('Browse Experts')).not.toBeInTheDocument();
  });

  it('renders consulting client navigation for freelancer accounts through compatibility role data', () => {
    setAuthAccountType('freelancer');

    renderAt(
      '/consulting/portal/sessions',
      <ConsultingLayout><div>Consulting client body</div></ConsultingLayout>
    );

    expect(screen.getByText('Upcoming & Active')).toBeInTheDocument();
    expect(screen.getByText('Session History')).toBeInTheDocument();
    expect(screen.getByText('Browse Experts')).toBeInTheDocument();
    expect(screen.queryByText('Availability')).not.toBeInTheDocument();
  });

  it('renders instructor workspace navigation for instructor users via InstructorWorkspaceLayout', () => {
    setAuthAccountType('instructor');

    const InstructorWorkspaceLayout = require('@/portals/instructor/InstructorWorkspaceLayout').default;

    renderAt(
      '/instructor/workspace/courses/new',
      <InstructorWorkspaceLayout><div>Instructor workspace body</div></InstructorWorkspaceLayout>
    );

    expect(screen.getByText('Create Course')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Instructor workspace body')).toBeInTheDocument();
  });

  it('renders academy student navigation for student users', () => {
    setAuthAccountType('student');

    renderAt(
      '/academy/portal/courses',
      <AcademyLayout><div>Academy student body</div></AcademyLayout>
    );

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Browse Courses')).toBeInTheDocument();
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
  });

  it('renders backoffice shell with admin navigation and deep breadcrumb', () => {
    setAuthAccountType('admin');

    renderAt(
      '/admin/quotes/new',
      <BackofficeLayout><div>Backoffice body</div></BackofficeLayout>
    );

    expect(screen.getAllByText('Backoffice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getAllByText('Quotes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Backoffice body')).toBeInTheDocument();
  });

  it('renders portal-root breadcrumb state on a top-level portal dashboard route', () => {
    renderAt(
      '/enterprise/portal',
      <EnterpriseLayout><div>Enterprise dashboard body</div></EnterpriseLayout>
    );

    expect(screen.getAllByText('Enterprise').length).toBeGreaterThan(0);
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.getByText('Enterprise dashboard body')).toBeInTheDocument();
  });
});
