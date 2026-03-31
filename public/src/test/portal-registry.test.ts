import { describe, it, expect } from 'vitest';
import { getPortalByPath, PORTALS } from '@/core/portals/registry';

describe('portal registry', () => {
  it('resolves the public portal for root path', () => {
    expect(getPortalByPath('/')).toEqual(PORTALS.public);
  });

  it('resolves the correct authenticated portals by base path', () => {
    expect(getPortalByPath('/enterprise/portal/projects')).toEqual(PORTALS.enterprise);
    expect(getPortalByPath('/talent/portal/freelancer')).toEqual(PORTALS.talent);
    expect(getPortalByPath('/consulting/portal/bookings')).toEqual(PORTALS.consulting);
    expect(getPortalByPath('/academy/portal/courses')).toEqual(PORTALS.academy);
    expect(getPortalByPath('/admin/users')).toEqual(PORTALS.backoffice);
  });

  it('returns undefined for unknown paths', () => {
    expect(getPortalByPath('/something/else')).toBeUndefined();
  });
});
