import { describe, it, expect } from 'vitest';
import {
  academyRoutes,
  backofficeRoutes,
  consultingRoutes,
  enterpriseRoutes,
  instructorWorkspaceRoutes,
  talentCompanyRoutes,
  talentFreelancerRoutes,
} from '@/routes/portalRoutes';
import { getPortalByPath, PORTALS } from '@/core/portals/registry';
import { INSTRUCTOR_WORKSPACE, ACADEMY_STUDENT } from '@/core/routing/academyInstructorRoutes';
import { resolveDeepLink, getFallback } from '@/lib/workspaceRoutes';

const routeGroups = {
  enterprise: enterpriseRoutes,
  talentCompany: talentCompanyRoutes,
  talentFreelancer: talentFreelancerRoutes,
  consulting: consultingRoutes,
  academy: academyRoutes,
  instructorWorkspace: instructorWorkspaceRoutes,
  backoffice: backofficeRoutes,
};

const allRoutes = Object.values(routeGroups).flat();
const allPaths = allRoutes.map((r) => r.path);

function stripDynamic(path: string) {
  return path.replace(/:[^/]+/g, 'sample-id');
}

describe('route smoke — authenticated portal route config', () => {
  it('has no duplicate authenticated portal paths', () => {
    const unique = new Set(allPaths);
    expect(unique.size).toBe(allPaths.length);
  });

  it('exposes the expected root route for each authenticated portal', () => {
    expect(allPaths).toContain('/enterprise/portal');
    expect(allPaths).toContain('/talent/portal');
    expect(allPaths).toContain('/consulting/portal');
    expect(allPaths).toContain('/academy/portal');
    expect(allPaths).toContain('/instructor/workspace');
    expect(allPaths).toContain('/admin');
  });

  it('maps every authenticated portal route path to a real authenticated portal config', () => {
    for (const path of allPaths) {
      const resolved = getPortalByPath(stripDynamic(path));
      expect(resolved, `Expected ${path} to resolve to a portal`).toBeDefined();
      expect(resolved?.requiresAuth, `Expected ${path} to resolve to an authenticated portal`).toBe(true);
      expect(resolved?.id).not.toBe('public');
    }
  });

  it('keeps enterprise detail flows intact', () => {
    expect(allPaths).toContain('/enterprise/portal/projects/:id');
    expect(allPaths).toContain('/enterprise/portal/quotes/:id');
    expect(allPaths).toContain('/enterprise/portal/requests/new');
  });

  it('keeps talent split into company and freelancer route branches', () => {
    expect(allPaths).toContain('/talent/portal/company');
    expect(allPaths).toContain('/talent/portal/company/jobs');
    expect(allPaths).toContain('/talent/portal/company/jobs/:id');
    expect(allPaths).toContain('/talent/portal/freelancer/jobs/:id');
  });

  it('keeps consulting and backoffice key workflows routable', () => {
    expect(allPaths).toContain('/consulting/portal/bookings');
    expect(allPaths).toContain('/consulting/portal/availability');
    expect(allPaths).toContain('/admin/quotes/new');
    expect(allPaths).toContain('/admin/projects/:id');
  });

  it('keeps each route family under the correct base path', () => {
    expect(routeGroups.enterprise.every((r) => r.path.startsWith(PORTALS.enterprise.basePath))).toBe(true);
    expect(routeGroups.consulting.every((r) => r.path.startsWith(PORTALS.consulting.basePath))).toBe(true);
    expect(routeGroups.academy.every((r) => r.path.startsWith(PORTALS.academy.basePath))).toBe(true);
    expect(routeGroups.instructorWorkspace.every((r) => r.path.startsWith(PORTALS.instructor.basePath))).toBe(true);
    expect(routeGroups.backoffice.every((r) => r.path.startsWith(PORTALS.backoffice.basePath))).toBe(true);
    expect(routeGroups.talentCompany.every((r) => r.path.startsWith(`${PORTALS.talent.basePath}/company`))).toBe(true);
    expect(routeGroups.talentFreelancer.every((r) => r.path === PORTALS.talent.basePath || r.path.startsWith(`${PORTALS.talent.basePath}/freelancer`))).toBe(true);
  });

  it('keeps route components defined for every authenticated route', () => {
    for (const route of allRoutes) {
      expect(route.component, `Expected component to exist for ${route.path}`).toBeTruthy();
      expect(typeof route.component).toBe('object');
    }
  });
});

describe('route ownership — academy is student-only, instructor workspace is separate', () => {
  it('academy portal does not contain instructor management paths', () => {
    const academyPaths = academyRoutes.map((r) => r.path);
    expect(academyPaths).not.toContain('/academy/portal/create');
    expect(academyPaths).not.toContain('/academy/portal/students');
    expect(academyPaths).not.toContain('/academy/portal/lessons');
    expect(academyPaths).not.toContain('/academy/portal/earnings');
  });

  it('academy portal only contains student-owned paths', () => {
    const studentPaths = Object.values(ACADEMY_STUDENT);
    const academyPaths = academyRoutes.map((r) => r.path);
    for (const p of academyPaths) {
      expect(studentPaths).toContain(p);
    }
  });

  it('instructor workspace contains all canonical instructor management paths', () => {
    const iwPaths = instructorWorkspaceRoutes.map((r) => r.path);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.root);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.courses);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.courseNew);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.students);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.lessons);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.earnings);
    expect(iwPaths).toContain(INSTRUCTOR_WORKSPACE.settings);
  });

  it('instructor workspace resolves to instructor portal, not academy', () => {
    const resolved = getPortalByPath('/instructor/workspace/courses');
    expect(resolved?.id).toBe('instructor');
    expect(resolved?.id).not.toBe('academy');
  });

  it('academy portal resolves to academy portal', () => {
    const resolved = getPortalByPath('/academy/portal/courses');
    expect(resolved?.id).toBe('academy');
  });

  it('academy portal allowedAccountTypes excludes instructor', () => {
    expect(PORTALS.academy.allowedAccountTypes).toContain('student');
    expect(PORTALS.academy.allowedAccountTypes).toContain('admin');
    expect(PORTALS.academy.allowedAccountTypes).not.toContain('instructor');
  });

  it('instructor portal allowedAccountTypes includes instructor', () => {
    expect(PORTALS.instructor.allowedAccountTypes).toContain('instructor');
    expect(PORTALS.instructor.allowedAccountTypes).toContain('admin');
    expect(PORTALS.instructor.allowedAccountTypes).not.toContain('student');
  });
});

describe('workspace route helpers — canonical destinations', () => {
  it('instructor fallback workspace points to /instructor/workspace', () => {
    const fb = getFallback('instructor', 'workspace');
    expect(fb.path).toBe('/instructor/workspace');
  });

  it('instructor courses deep link uses /instructor/workspace/courses', () => {
    const fb = getFallback('instructor', 'courses');
    expect(fb.path).toBe('/instructor/workspace/courses');
  });

  it('student fallback workspace points to /academy/portal', () => {
    const fb = getFallback('student', 'workspace');
    expect(fb.path).toBe('/academy/portal');
  });

  it('student courses deep link uses /academy/portal/courses', () => {
    const fb = getFallback('student', 'courses');
    expect(fb.path).toBe('/academy/portal/courses');
  });

  it('instructor deep link does not return any academy portal path', () => {
    const sections = ['courses', 'students', 'workspace'];
    for (const s of sections) {
      const link = resolveDeepLink('instructor', s);
      expect(link.path).not.toContain('/academy/portal');
    }
  });
});
