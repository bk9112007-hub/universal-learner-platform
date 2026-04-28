import { describe, expect, it } from "vitest";

import { buildProjectWorkspaceSeedFromBrief } from "@/lib/projects/workspace";

describe("project workspace seed", () => {
  it("builds workspace structure from a personalized brief", () => {
    const seed = buildProjectWorkspaceSeedFromBrief({
      id: "brief-1",
      title: "Community Energy Design",
      description: "Design a real community energy proposal.",
      teacher_priorities: "Target persuasive writing and applied math.",
      focus_strengths: ["Creativity"],
      focus_weaknesses: ["Writing"],
      skills_targeted: ["Research", "Writing", "Math reasoning"],
      milestones: [
        { title: "Investigate the challenge", description: "Research the local energy issue." },
        { title: "Build the proposal", description: "Draft and refine the final recommendation." }
      ],
      rubric: [{ criterion: "Clarity", description: "The recommendation is easy to understand." }],
      timeline: [{ label: "Week 1", goal: "Research and outline" }],
      group_name: "Sustainability Team"
    });

    expect(seed.personalizedReason).toContain("Teacher priority");
    expect(seed.targetSkills).toContain("Research");
    expect(seed.milestones).toHaveLength(2);
    expect(seed.tasks.at(-1)?.taskType).toBe("submission");
    expect(seed.tasks.at(-1)?.title).toContain("Submit final project work");
  });
});
