import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PortalBreadcrumb from '@/core/components/PortalBreadcrumb';
import { PORTALS } from '@/core/portals/registry';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderBreadcrumb(route: string, lang: 'en' | 'ar' = 'en') {
  localStorage.setItem('devwady-lang', lang);
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[route]}>
        <PortalBreadcrumb portal={PORTALS.enterprise} />
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe('PortalBreadcrumb', () => {
  it('shows the portal label on the root workspace route', () => {
    renderBreadcrumb('/enterprise/portal');
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('builds readable breadcrumbs for deep routes', () => {
    renderBreadcrumb('/enterprise/portal/projects/123e4567-e89b-12d3-a456-426614174000/settings');

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Arabic labels when the language is Arabic', () => {
    renderBreadcrumb('/enterprise/portal/projects/settings', 'ar');

    expect(screen.getByText('إنتربرايز')).toBeInTheDocument();
    expect(screen.getByText('مشاريع')).toBeInTheDocument();
    expect(screen.getByText('الإعدادات')).toBeInTheDocument();
  });
});
