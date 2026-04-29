import type {
  GeneratedProjectRecord,
  GeneratedProjectSnapshotRecord,
  ProjectCatalogItemRecord
} from "@/types/domain";

type FormulatorInput = {
  subject: string;
  skillGoal: string;
  gradeBand: string;
  difficulty: string;
  duration: string;
  studentInterests: string[];
  hook: ProjectCatalogItemRecord;
  role: ProjectCatalogItemRecord;
  scenario: ProjectCatalogItemRecord;
  activity: ProjectCatalogItemRecord;
  output: ProjectCatalogItemRecord;
};

function snapshotFromItem(item: ProjectCatalogItemRecord): GeneratedProjectSnapshotRecord {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    details: item.details,
    status: item.status
  };
}

function createTitle(input: FormulatorInput) {
  return `${input.hook.title}: ${input.role.title}`;
}

function createSummary(input: FormulatorInput) {
  return `This ${input.subject.toLowerCase()} project is designed for ${input.gradeBand.toLowerCase()} learners who need ${input.skillGoal.toLowerCase()} practice through a ${input.duration.toLowerCase()} ${input.difficulty.toLowerCase()} challenge. Students work inside the scenario "${input.scenario.title}" and build toward a ${input.output.title.toLowerCase()}.`;
}

function createMission(input: FormulatorInput) {
  const interests = input.studentInterests.length ? `while connecting to interests in ${input.studentInterests.join(", ")}` : "while making the work personally relevant";
  return `Step into the role of ${input.role.title.toLowerCase()} and respond to the situation "${input.scenario.title}" by creating a ${input.output.title.toLowerCase()} that helps a real audience make a better decision, understand a complex issue, or take meaningful action ${interests}.`;
}

function createLearningGoals(input: FormulatorInput) {
  return [
    `Apply ${input.subject.toLowerCase()} thinking to a realistic challenge with clear stakes and audience needs.`,
    `Strengthen ${input.skillGoal.toLowerCase()} through structured analysis, explanation, and revision.`,
    `Use the activity "${input.activity.title}" to gather evidence, test ideas, and improve the quality of the final work.`,
    `Produce a ${input.output.title.toLowerCase()} that shows accuracy, clarity, and purpose at a ${input.difficulty.toLowerCase()} level.`
  ];
}

function createSteps(input: FormulatorInput) {
  return [
    `Launch with the hook "${input.hook.title}" and define the exact problem, audience, or opportunity inside the scenario.`,
    `Research the situation using notes, evidence, and comparison work that supports the skill goal of ${input.skillGoal.toLowerCase()}.`,
    `Complete the activity "${input.activity.title}" so the project includes feedback, pattern-finding, or revision rather than a first-draft solution.`,
    `Draft the ${input.output.title.toLowerCase()} from the perspective of ${input.role.title.toLowerCase()}, making sure every section serves the intended audience.`,
    `Revise the final product against the rubric, then prepare to explain why the chosen solution is realistic, well-supported, and worth sharing.`
  ];
}

function createMaterials(input: FormulatorInput) {
  return [
    `A planning notebook or shared document for capturing research and project decisions`,
    `At least three credible sources connected to ${input.subject.toLowerCase()} and the selected scenario`,
    `A checklist for the activity "${input.activity.title}" so evidence and revision steps are visible`,
    `A creation tool appropriate for the final ${input.output.title.toLowerCase()} such as slides, a document editor, or a prototype workspace`
  ];
}

function createRubric(input: FormulatorInput) {
  return [
    `Problem framing: The project clearly explains the scenario, audience, and why the challenge matters.`,
    `Skill growth: The work shows deliberate practice and progress in ${input.skillGoal.toLowerCase()}.`,
    `Evidence and reasoning: Claims, design choices, or recommendations are supported with accurate information and thoughtful explanation.`,
    `Final output quality: The ${input.output.title.toLowerCase()} is polished, usable, and appropriate for the chosen role and audience.`
  ];
}

function createReflectionQuestions(input: FormulatorInput) {
  return [
    `How did taking on the role of ${input.role.title.toLowerCase()} change the way you approached the problem?`,
    `Which part of ${input.skillGoal.toLowerCase()} improved the most during this project, and what evidence proves it?`,
    `What revision from the activity "${input.activity.title}" most strengthened the final work?`,
    `If you had one more week, what would you improve in the ${input.output.title.toLowerCase()} and why?`
  ];
}

export function composeGeneratedProjectDraft(input: FormulatorInput): Omit<
  GeneratedProjectRecord,
  "id" | "approvalStatus" | "createdAt" | "updatedAt"
> {
  return {
    subject: input.subject,
    skillGoal: input.skillGoal,
    gradeBand: input.gradeBand,
    difficulty: input.difficulty,
    duration: input.duration,
    studentInterests: input.studentInterests,
    title: createTitle(input),
    summary: createSummary(input),
    studentMission: createMission(input),
    learningGoals: createLearningGoals(input),
    steps: createSteps(input),
    materials: createMaterials(input),
    rubric: createRubric(input),
    reflectionQuestions: createReflectionQuestions(input),
    hookSnapshot: snapshotFromItem(input.hook),
    roleSnapshot: snapshotFromItem(input.role),
    scenarioSnapshot: snapshotFromItem(input.scenario),
    activitySnapshot: snapshotFromItem(input.activity),
    outputSnapshot: snapshotFromItem(input.output)
  };
}
