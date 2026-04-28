import type {
  PersonalizedProjectMilestoneRecord,
  PersonalizedProjectRubricRecord,
  PersonalizedProjectTimelineRecord,
  SkillBand
} from "@/types/domain";

type InterestInput = {
  careerPreference: string | null;
  entertainmentPreference: string | null;
  workStyle: string | null;
  industryInterest: string | null;
};

type SkillDiagnosticInput = {
  reading: SkillBand | null;
  writing: SkillBand | null;
  math: SkillBand | null;
  history: SkillBand | null;
  logic: SkillBand | null;
  strengths: string[];
  weaknesses: string[];
};

type ProjectLearnerInput = {
  fullName: string;
  interests: InterestInput | null;
  diagnostics: SkillDiagnosticInput | null;
};

export type PersonalizedProjectDraft = {
  subject: string;
  title: string;
  description: string;
  milestones: PersonalizedProjectMilestoneRecord[];
  skillsTargeted: string[];
  rubric: PersonalizedProjectRubricRecord[];
  timeline: PersonalizedProjectTimelineRecord[];
};

export type PersonalizedProjectGenerationInput = {
  learners: ProjectLearnerInput[];
  teacherPriorities: string;
  focusStrengths: string[];
  focusWeaknesses: string[];
  projectMode: "individual" | "group";
  groupName?: string | null;
};

const SKILL_LABELS: Record<keyof Omit<SkillDiagnosticInput, "strengths" | "weaknesses">, string> = {
  reading: "Reading",
  writing: "Writing",
  math: "Math",
  history: "History",
  logic: "Logic"
};

export function getSkillBandLabel(value: SkillBand | null) {
  switch (value) {
    case "well_below":
      return "2+ grade levels below";
    case "below":
      return "1 grade level below";
    case "at":
      return "At grade level";
    case "above":
      return "1 grade level above";
    case "advanced":
      return "2+ grade levels above";
    default:
      return "Not assessed yet";
  }
}

export function getGradeLevelSummary(diagnostic: SkillDiagnosticInput | null) {
  if (!diagnostic) {
    return "No skill diagnostic has been saved yet.";
  }

  const entries = (Object.keys(SKILL_LABELS) as Array<keyof typeof SKILL_LABELS>).map((key) => `${SKILL_LABELS[key]}: ${getSkillBandLabel(diagnostic[key])}`);
  return entries.join(" | ");
}

function summarizeInterests(learners: ProjectLearnerInput[]) {
  const career = learners.map((learner) => learner.interests?.careerPreference).find(Boolean) ?? "future-ready careers";
  const entertainment = learners.map((learner) => learner.interests?.entertainmentPreference).find(Boolean) ?? "creative storytelling";
  const workStyle = learners.map((learner) => learner.interests?.workStyle).find(Boolean) ?? "collaborative problem-solving";
  const industry = learners.map((learner) => learner.interests?.industryInterest).find(Boolean) ?? "real-world industries";

  return { career, entertainment, workStyle, industry };
}

function collectSkillSignals(learners: ProjectLearnerInput[]) {
  const strengths = new Set<string>();
  const weaknesses = new Set<string>();

  learners.forEach((learner) => {
    learner.diagnostics?.strengths.forEach((strength) => strengths.add(strength));
    learner.diagnostics?.weaknesses.forEach((weakness) => weaknesses.add(weakness));

    if (!learner.diagnostics) {
      return;
    }

    (Object.keys(SKILL_LABELS) as Array<keyof typeof SKILL_LABELS>).forEach((key) => {
      const band = learner.diagnostics?.[key];
      if (band === "advanced" || band === "above") {
        strengths.add(SKILL_LABELS[key]);
      }
      if (band === "well_below" || band === "below") {
        weaknesses.add(SKILL_LABELS[key]);
      }
    });
  });

  return {
    strengths: Array.from(strengths),
    weaknesses: Array.from(weaknesses)
  };
}

function chooseSubject(priorities: string, weaknesses: string[], industry: string) {
  const normalized = priorities.toLowerCase();
  if (normalized.includes("math")) return "Mathematics";
  if (normalized.includes("history")) return "Social Studies";
  if (normalized.includes("reading") || normalized.includes("writing")) return "Reading & Writing";
  if (normalized.includes("science") || normalized.includes("engineering") || industry.toLowerCase().includes("technology")) return "Science";
  if (weaknesses.length > 1) return "Interdisciplinary";
  if (weaknesses[0]) return weaknesses[0];
  return "Interdisciplinary";
}

function buildTitle(input: PersonalizedProjectGenerationInput, interestSummary: ReturnType<typeof summarizeInterests>, weaknesses: string[]) {
  const modeLabel = input.projectMode === "group" ? input.groupName?.trim() || "Team" : input.learners[0]?.fullName?.split(" ")[0] || "Student";
  const focus = weaknesses[0] ?? input.focusWeaknesses[0] ?? "Growth";
  return `${modeLabel} ${interestSummary.industry} ${focus} Studio Project`;
}

function buildMilestones(
  priorities: string,
  interestSummary: ReturnType<typeof summarizeInterests>,
  skillsTargeted: string[]
): PersonalizedProjectMilestoneRecord[] {
  return [
    {
      title: "Research and define the challenge",
      description: `Investigate a ${interestSummary.industry.toLowerCase()} challenge connected to ${priorities || "teacher priorities"} and gather source evidence.`
    },
    {
      title: "Plan the solution pathway",
      description: `Outline the workflow, responsibilities, and checkpoints using ${skillsTargeted.slice(0, 2).join(" and ").toLowerCase() || "core academic skills"}.`
    },
    {
      title: "Build and test the artifact",
      description: `Create a polished draft, prototype, or presentation that reflects ${interestSummary.workStyle.toLowerCase()} and revises based on feedback.`
    },
    {
      title: "Present and reflect",
      description: `Share the final product, explain the reasoning, and reflect on growth areas, next steps, and real-world relevance.`
    }
  ];
}

function buildRubric(skillsTargeted: string[]): PersonalizedProjectRubricRecord[] {
  return [
    {
      criterion: "Academic accuracy",
      description: "Uses accurate content knowledge and explains ideas clearly with evidence."
    },
    {
      criterion: "Skill growth",
      description: `Demonstrates progress in ${skillsTargeted.slice(0, 3).join(", ") || "targeted academic skills"}.`
    },
    {
      criterion: "Real-world relevance",
      description: "Connects the project to authentic audiences, industries, or future career pathways."
    },
    {
      criterion: "Reflection and revision",
      description: "Responds to feedback and explains what was improved along the way."
    }
  ];
}

function buildTimeline(projectMode: "individual" | "group"): PersonalizedProjectTimelineRecord[] {
  return [
    { label: "Week 1", goal: "Kickoff research, collect references, and define the project question." },
    { label: "Week 2", goal: `Draft the ${projectMode === "group" ? "team" : "personal"} solution plan and gather teacher feedback.` },
    { label: "Week 3", goal: "Build the artifact, test ideas, and revise weak areas." },
    { label: "Week 4", goal: "Finalize the product, submit deliverables, and present the project reflection." }
  ];
}

export function buildPersonalizedProjectDraft(input: PersonalizedProjectGenerationInput): PersonalizedProjectDraft {
  const interestSummary = summarizeInterests(input.learners);
  const skillSignals = collectSkillSignals(input.learners);
  const combinedStrengths = Array.from(new Set([...skillSignals.strengths, ...input.focusStrengths]));
  const combinedWeaknesses = Array.from(new Set([...input.focusWeaknesses, ...skillSignals.weaknesses]));
  const skillsTargeted = Array.from(new Set([...combinedWeaknesses, ...combinedStrengths])).slice(0, 5);
  const subject = chooseSubject(input.teacherPriorities, combinedWeaknesses, interestSummary.industry);
  const title = buildTitle(input, interestSummary, combinedWeaknesses);

  return {
    subject,
    title,
    description: `This ${input.projectMode === "group" ? "group" : "personalized"} project blends ${interestSummary.career.toLowerCase()}, ${interestSummary.entertainment.toLowerCase()}, and ${interestSummary.industry.toLowerCase()} to address teacher priorities around ${input.teacherPriorities || "academic growth"}. Learners will work through a ${interestSummary.workStyle.toLowerCase()} process that strengthens ${skillsTargeted.join(", ").toLowerCase() || "core academic skills"} while producing a polished final artifact.`,
    milestones: buildMilestones(input.teacherPriorities, interestSummary, skillsTargeted),
    skillsTargeted,
    rubric: buildRubric(skillsTargeted),
    timeline: buildTimeline(input.projectMode)
  };
}
