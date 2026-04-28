import { describe, expect, it } from "vitest";

import {
  buildPersonalizedProjectDraft,
  getGradeLevelSummary,
  getSkillBandLabel
} from "@/lib/projects/personalization-engine";

describe("personalized project engine", () => {
  it("returns grade-level style labels for diagnostics", () => {
    expect(getSkillBandLabel("well_below")).toBe("2+ grade levels below");
    expect(
      getGradeLevelSummary({
        reading: "below",
        writing: "at",
        math: "above",
        history: "well_below",
        logic: "advanced",
        strengths: ["Logic"],
        weaknesses: ["History"]
      })
    ).toContain("Reading: 1 grade level below");
  });

  it("builds a personalized project draft from interests, skill signals, and teacher priorities", () => {
    const draft = buildPersonalizedProjectDraft({
      learners: [
        {
          fullName: "Jordan Miles",
          interests: {
            careerPreference: "Engineering",
            entertainmentPreference: "Gaming",
            workStyle: "Hands-on building",
            industryInterest: "Technology"
          },
          diagnostics: {
            reading: "at",
            writing: "below",
            math: "above",
            history: "at",
            logic: "advanced",
            strengths: ["Logic"],
            weaknesses: ["Writing"]
          }
        }
      ],
      teacherPriorities: "Strengthen explanatory writing and evidence-based communication in science.",
      focusStrengths: ["Logic"],
      focusWeaknesses: ["Writing"],
      projectMode: "individual"
    });

    expect(draft.title).toContain("Technology");
    expect(draft.skillsTargeted).toContain("Writing");
    expect(draft.milestones).toHaveLength(4);
    expect(draft.rubric).toHaveLength(4);
    expect(draft.timeline).toHaveLength(4);
  });
});
