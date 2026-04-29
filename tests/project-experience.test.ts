import { describe, expect, it } from "vitest";

import { buildProjectExperienceModel, inferProjectExperienceType } from "@/lib/projects/experience";
import type { ProjectWorkspaceRecord } from "@/types/domain";

function createWorkspace(overrides: Partial<ProjectWorkspaceRecord> = {}): ProjectWorkspaceRecord {
  return {
    id: "project-1",
    studentId: "student-1",
    studentName: "Learner One",
    generatedProjectId: "generated-1",
    experienceType: "mission_dashboard",
    title: "Crisis Command Center: Save the Coastal City",
    subject: "Science",
    description: "Learners investigate coastal flooding risks and prepare a realistic city response plan.",
    studentMission: "Step into mission control and build a response plan the city council can act on immediately.",
    status: "draft",
    createdAt: "2026-04-28T00:00:00.000Z",
    personalizedBriefId: null,
    personalizedBriefTitle: "Coastal resilience brief",
    personalizedReason: "Targets decision-making and evidence-backed explanation.",
    teacherPriorities: "Focus on systems thinking and communication.",
    targetSkills: ["Decision-making", "Evidence use"],
    rubric: [{ criterion: "Evidence", description: "Use strong evidence for the final recommendation." }],
    timeline: [{ label: "Week 1", goal: "Study the risks and build options." }],
    materials: ["Satellite flood map", "Emergency budget sheet"],
    reflectionQuestions: ["Which recommendation should the city adopt first?"],
    milestones: [
      {
        id: "milestone-1",
        title: "Assess the threat",
        description: "Understand the risks facing the city.",
        sortOrder: 0,
        dueDate: null,
        completedTaskCount: 0,
        taskCount: 2
      }
    ],
    tasks: [
      {
        id: "task-1",
        milestoneId: "milestone-1",
        title: "Review emergency data",
        description: "Study the available city data and identify the biggest risk zones.",
        taskType: "checklist",
        sortOrder: 0,
        isRequired: true,
        dueDate: null,
        status: "in_progress",
        responseText: null,
        completedAt: null,
        latestSubmissionId: null,
        latestSubmissionText: null,
        latestFeedbackComment: null,
        latestFeedbackScore: null,
        latestFeedbackTeacher: null,
        files: []
      }
    ],
    resources: [
      {
        id: "resource-1",
        title: "City briefing deck",
        description: "Context for the crisis response",
        resourceType: "note",
        externalUrl: null,
        sortOrder: 0
      }
    ],
    submissions: [],
    reflectionNote: null,
    reflectionUpdatedAt: null,
    progressPercent: 25,
    completedTaskCount: 1,
    taskCount: 4,
    accessRole: "student",
    accessLabel: "Your project workspace",
    canStudentEdit: true,
    canTeacherManage: false,
    isReadOnly: false,
    ...overrides
  };
}

describe("project experience engine", () => {
  it("infers a guided tour experience from travel-style content", () => {
    expect(
      inferProjectExperienceType({
        subject: "History",
        title: "Virtual Country Tour Guide",
        summary: "Learners act as guides and walk visitors through a region.",
        outputTitle: "Tour guide presentation"
      })
    ).toBe("guided_tour");
  });

  it("infers a math lab experience from math-heavy content", () => {
    expect(
      inferProjectExperienceType({
        subject: "Mathematics",
        title: "Budget Planner",
        summary: "Students test different cost variables and graph results.",
        outputTitle: "Math model"
      })
    ).toBe("math_lab");
  });

  it("builds a museum exhibit surface with stations", () => {
    const model = buildProjectExperienceModel(
      createWorkspace({
        experienceType: "museum_exhibit",
        title: "Museum Curator: Ancient Egypt Exhibit",
        subject: "History"
      })
    );

    expect(model.surface).toBe("museum_exhibit");
    if (model.surface !== "museum_exhibit") {
      throw new Error("Expected museum exhibit model");
    }
    expect(model.stations.length).toBeGreaterThan(0);
    expect(model.stations[0]?.curatorNote).toContain("Curate");
  });

  it("builds a mission dashboard surface with decisions", () => {
    const model = buildProjectExperienceModel(createWorkspace());

    expect(model.surface).toBe("mission_dashboard");
    if (model.surface !== "mission_dashboard") {
      throw new Error("Expected mission dashboard model");
    }
    expect(model.objectives.length).toBeGreaterThan(0);
    expect(model.decisions.length).toBeGreaterThan(0);
  });
});
