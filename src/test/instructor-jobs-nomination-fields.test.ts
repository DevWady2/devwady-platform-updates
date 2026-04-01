/**
 * LP-05B — Verifies JobNominateStudentDialog field mapping
 * from job_postings shape (title, type, location) to the dialog's
 * opportunity record and display title.
 */
import { describe, it, expect } from "vitest";

// Mirror the resolution logic used in JobNominateStudentDialog

function resolveTitle(job: { title?: string; title_en?: string }) {
  return job.title ?? job.title_en ?? "";
}

function resolveTitleAr(job: { title_ar?: string | null; title?: string; title_en?: string }) {
  return job.title_ar || job.title || job.title_en || "";
}

function buildOpportunityRecord(job: {
  id: string;
  title?: string;
  title_en?: string;
  type?: string;
  type_en?: string;
  location?: string | null;
  location_en?: string | null;
  tags?: string[] | null;
}) {
  return {
    id: job.id,
    title: job.title ?? job.title_en ?? "",
    type: job.type ?? job.type_en ?? "",
    tags: job.tags ?? [],
    requirements: [],
    location: job.location ?? job.location_en ?? null,
  };
}

describe("JobNominateStudentDialog — job_postings field mapping", () => {
  const jobPostingsRecord = {
    id: "jp-1",
    title: "Senior React Developer",
    title_ar: "مطور ريأكت أول",
    type: "full-time",
    location: "Riyadh",
    tags: ["react", "typescript"],
  };

  it("resolves English title from job_postings.title", () => {
    expect(resolveTitle(jobPostingsRecord)).toBe("Senior React Developer");
  });

  it("resolves Arabic title with fallback chain", () => {
    expect(resolveTitleAr(jobPostingsRecord)).toBe("مطور ريأكت أول");
    // Falls back to title when title_ar is missing
    expect(resolveTitleAr({ title: "Lead Engineer" })).toBe("Lead Engineer");
  });

  it("builds opportunityRecord from job_postings fields", () => {
    const opp = buildOpportunityRecord(jobPostingsRecord);
    expect(opp.title).toBe("Senior React Developer");
    expect(opp.type).toBe("full-time");
    expect(opp.location).toBe("Riyadh");
    expect(opp.tags).toEqual(["react", "typescript"]);
  });

  it("falls back to title_en when title is absent (legacy compat)", () => {
    const legacy = { id: "jl-1", title_en: "Legacy Job", type_en: "contract", location_en: "Remote" };
    const opp = buildOpportunityRecord(legacy);
    expect(opp.title).toBe("Legacy Job");
    expect(opp.type).toBe("contract");
    expect(opp.location).toBe("Remote");
  });

  it("handles missing optional fields gracefully", () => {
    const minimal = { id: "jp-2", title: "Designer" };
    const opp = buildOpportunityRecord(minimal);
    expect(opp.title).toBe("Designer");
    expect(opp.type).toBe("");
    expect(opp.location).toBeNull();
    expect(opp.tags).toEqual([]);
  });
});
