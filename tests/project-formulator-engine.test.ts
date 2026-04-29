import { describe, expect, it } from "vitest";

import { composeGeneratedProjectDraft } from "@/lib/project-formulator/engine";

describe("project formulator engine", () => {
  it("builds a usable draft plan from catalog selections", () => {
    const draft = composeGeneratedProjectDraft({
      subject: "Science",
      skillGoal: "Explanatory writing",
      gradeBand: "Middle school",
      difficulty: "Intermediate",
      duration: "2 weeks",
      studentInterests: ["marine biology", "city design"],
      hook: {
        id: "hook-1",
        type: "hooks",
        title: "Future City Under Pressure",
        summary: "Students respond to a city under stress.",
        details: "Longer hook details.",
        status: "approved",
        createdAt: "",
        updatedAt: "",
        createdBy: null,
        updatedBy: null
      },
      role: {
        id: "role-1",
        type: "roles",
        title: "Crisis Response Planner",
        summary: "Students balance safety and logistics.",
        details: "Longer role details.",
        status: "approved",
        createdAt: "",
        updatedAt: "",
        createdBy: null,
        updatedBy: null
      },
      scenario: {
        id: "scenario-1",
        type: "scenarios",
        title: "A coastal city must protect homes before storm season.",
        summary: "Planning context.",
        details: "Longer scenario details.",
        status: "approved",
        createdAt: "",
        updatedAt: "",
        createdBy: null,
        updatedBy: null
      },
      activity: {
        id: "activity-1",
        type: "activities",
        title: "Prototype and Feedback Cycle",
        summary: "Iterate with feedback.",
        details: "Longer activity details.",
        status: "approved",
        createdAt: "",
        updatedAt: "",
        createdBy: null,
        updatedBy: null
      },
      output: {
        id: "output-1",
        type: "outputs",
        title: "Strategic Proposal Deck",
        summary: "Decision-ready slide deck.",
        details: "Longer output details.",
        status: "approved",
        createdAt: "",
        updatedAt: "",
        createdBy: null,
        updatedBy: null
      }
    });

    expect(draft.title).toContain("Future City Under Pressure");
    expect(draft.title).toContain("Crisis Response Planner");
    expect(draft.experienceType).toBe("mission_dashboard");
    expect(draft.learningGoals).toHaveLength(4);
    expect(draft.steps.length).toBeGreaterThanOrEqual(5);
    expect(draft.rubric[0]).toContain("Problem framing");
    expect(draft.hookSnapshot.title).toBe("Future City Under Pressure");
  });
});
