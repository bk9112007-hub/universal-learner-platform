import type { ProjectExperienceType, ProjectWorkspaceRecord } from "@/types/domain";

const EXPERIENCE_TYPE_KEYWORDS: Array<{ type: ProjectExperienceType; pattern: RegExp }> = [
  { type: "math_lab", pattern: /(math|algebra|geometry|ratio|equation|graph|budget|finance|statistics|calculator)/i },
  { type: "museum_exhibit", pattern: /(museum|exhibit|artifact|curator|gallery|archive|display case)/i },
  { type: "guided_tour", pattern: /(tour|guide|travel|country|habitat|ecosystem|planet|spacewalk|expedition|field journal)/i },
  { type: "interactive_map", pattern: /(map|cartography|route|atlas)/i },
  { type: "science_simulation", pattern: /(simulation|experiment|lab test|prototype trial)/i },
  { type: "timeline", pattern: /(timeline|era|chronology|sequence of events)/i },
  { type: "debate_trial", pattern: /(debate|trial|hearing|case brief)/i },
  { type: "business_pitch", pattern: /(business pitch|startup|investor|product launch)/i },
  { type: "data_lab", pattern: /(data lab|analytics|dataset|data story)/i }
];

type ExperienceInput = {
  subject?: string | null;
  title?: string | null;
  summary?: string | null;
  outputTitle?: string | null;
  roleTitle?: string | null;
  scenarioTitle?: string | null;
};

type GuidedTourStop = {
  title: string;
  subtitle: string;
  description: string;
  guideScriptPrompt: string;
  audienceQuestions: string[];
  imageLabel: string;
};

type MuseumExhibitStation = {
  title: string;
  artifactLabel: string;
  description: string;
  curatorNote: string;
  visitorQuestions: string[];
};

type MissionDecision = {
  title: string;
  tension: string;
  options: string[];
  recommendationPrompt: string;
};

type MathLabVariable = {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
};

export type ProjectExperienceModel =
  | {
      type: ProjectExperienceType;
      surface: "guided_tour";
      eyebrow: string;
      title: string;
      description: string;
      stops: GuidedTourStop[];
      scriptPrompt: string;
      progressLabel: string;
    }
  | {
      type: ProjectExperienceType;
      surface: "math_lab";
      eyebrow: string;
      title: string;
      description: string;
      variables: MathLabVariable[];
      explanationPrompts: string[];
      benchmarkLabels: string[];
      conclusionPrompt: string;
    }
  | {
      type: ProjectExperienceType;
      surface: "museum_exhibit";
      eyebrow: string;
      title: string;
      description: string;
      stations: MuseumExhibitStation[];
      finalReflectionPrompt: string;
    }
  | {
      type: ProjectExperienceType;
      surface: "mission_dashboard";
      eyebrow: string;
      title: string;
      description: string;
      briefing: string;
      objectives: string[];
      resources: string[];
      decisions: MissionDecision[];
      finalRecommendationPrompt: string;
    };

function toContentBlob(input: ExperienceInput) {
  return [input.subject, input.title, input.summary, input.outputTitle, input.roleTitle, input.scenarioTitle]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");
}

function normalizeList(values: Array<string | null | undefined>, fallback: string[] = []) {
  const normalized = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return normalized.length > 0 ? normalized : fallback;
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values));
}

function truncateAtSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0];
  return sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
}

function getExperienceCopy(type: ProjectExperienceType) {
  switch (type) {
    case "guided_tour":
      return {
        eyebrow: "Guided project tour",
        title: "Tour the challenge before you build it",
        description: "Move through the project like a live guided experience with stops, audience questions, and a script you can rehearse.",
        progressLabel: "Tour stop progress"
      };
    case "interactive_map":
      return {
        eyebrow: "Interactive map pathway",
        title: "Follow the route through the project",
        description: "Treat each stop like a mapped destination so the learner can navigate evidence, patterns, and place-based decisions.",
        progressLabel: "Route progress"
      };
    case "science_simulation":
      return {
        eyebrow: "Interactive lab",
        title: "Test variables inside the project lab",
        description: "Try values, inspect patterns, and capture a conclusion before moving into the written or built deliverable."
      };
    case "data_lab":
      return {
        eyebrow: "Data lab",
        title: "Interrogate the data before you report",
        description: "Use structured variable play and quick evidence prompts to surface insights the final project can defend."
      };
    case "museum_exhibit":
      return {
        eyebrow: "Museum exhibit build",
        title: "Curate stations that tell the story",
        description: "Shape the project like an exhibit with artifacts, curator notes, visitor questions, and a final gallery reflection."
      };
    case "timeline":
      return {
        eyebrow: "Interactive timeline",
        title: "Sequence the story across exhibit stops",
        description: "Organize the project into a sequence of moments so the learner can connect change, cause, and audience understanding."
      };
    case "business_pitch":
      return {
        eyebrow: "Pitch room dashboard",
        title: "Run the project like a decision room",
        description: "Keep the mission, tradeoffs, and final recommendation visible the way a founder or strategy team would."
      };
    case "debate_trial":
      return {
        eyebrow: "Case dashboard",
        title: "Organize arguments before the final case",
        description: "Track objectives, tradeoffs, and recommendations in a courtroom-style or debate-room planning space."
      };
    case "math_lab":
      return {
        eyebrow: "Interactive math lab",
        title: "Adjust variables and test the math",
        description: "Use an experiment-style panel to test numbers, notice patterns, and explain the reasoning behind the final answer."
      };
    default:
      return {
        eyebrow: "Mission dashboard",
        title: "Run the project like a mission control room",
        description: "Keep the briefing, objectives, resources, and final recommendation visible while the learner makes decisions."
      };
  }
}

export function inferProjectExperienceType(input: ExperienceInput): ProjectExperienceType {
  const blob = toContentBlob(input);

  for (const candidate of EXPERIENCE_TYPE_KEYWORDS) {
    if (candidate.pattern.test(blob)) {
      return candidate.type;
    }
  }

  return "mission_dashboard";
}

export function resolveProjectExperienceType(
  explicitType: string | null | undefined,
  fallbackInput: ExperienceInput
): ProjectExperienceType {
  if (
    explicitType === "guided_tour" ||
    explicitType === "interactive_map" ||
    explicitType === "math_lab" ||
    explicitType === "science_simulation" ||
    explicitType === "timeline" ||
    explicitType === "museum_exhibit" ||
    explicitType === "mission_dashboard" ||
    explicitType === "debate_trial" ||
    explicitType === "business_pitch" ||
    explicitType === "data_lab"
  ) {
    return explicitType;
  }

  return inferProjectExperienceType(fallbackInput);
}

function buildGuidedTourStops(workspace: ProjectWorkspaceRecord): GuidedTourStop[] {
  const milestoneStops = workspace.milestones.map((milestone, index) => ({
    title: milestone.title,
    subtitle: milestone.dueDate ? `Stop ${index + 1} | Due ${milestone.dueDate}` : `Stop ${index + 1}`,
    description: milestone.description || workspace.tasks.find((task) => task.milestoneId === milestone.id)?.description || workspace.description,
    guideScriptPrompt: `Explain why "${milestone.title}" matters in the larger story of ${workspace.title}. Name the evidence, image, or example you would point out here.`,
    audienceQuestions: workspace.reflectionQuestions.slice(index, index + 2),
    imageLabel: workspace.materials[index] ?? workspace.targetSkills[index] ?? workspace.subject
  }));

  if (milestoneStops.length > 0) {
    return milestoneStops;
  }

  const taskStops = workspace.tasks.slice(0, 4).map((task, index) => ({
    title: task.title,
    subtitle: `Stop ${index + 1}`,
    description: task.description,
    guideScriptPrompt: `Guide your audience through "${task.title}" and explain what they should notice before moving on.`,
    audienceQuestions: workspace.reflectionQuestions.slice(index, index + 2),
    imageLabel: workspace.materials[index] ?? workspace.subject
  }));

  if (taskStops.length > 0) {
    return taskStops;
  }

  return [
    {
      title: "Project launch stop",
      subtitle: "Stop 1",
      description: workspace.description,
      guideScriptPrompt: `Introduce the challenge, audience, and mission behind ${workspace.title}.`,
      audienceQuestions: workspace.reflectionQuestions.slice(0, 2),
      imageLabel: workspace.subject
    }
  ];
}

function buildMathLabVariables(workspace: ProjectWorkspaceRecord): MathLabVariable[] {
  const content = `${workspace.title} ${workspace.description}`.toLowerCase();

  if (/(budget|cost|price|finance|profit)/.test(content)) {
    return [
      { key: "budget", label: "Budget amount", defaultValue: 120, min: 20, max: 500, step: 10 },
      { key: "units", label: "Units planned", defaultValue: 8, min: 1, max: 25, step: 1 },
      { key: "efficiency", label: "Efficiency factor", defaultValue: 1.2, min: 0.5, max: 2, step: 0.1 }
    ];
  }

  if (/(area|space|garden|design|geometry|layout)/.test(content)) {
    return [
      { key: "length", label: "Length", defaultValue: 12, min: 2, max: 40, step: 1 },
      { key: "width", label: "Width", defaultValue: 8, min: 2, max: 30, step: 1 },
      { key: "scale", label: "Scale factor", defaultValue: 1.5, min: 1, max: 4, step: 0.25 }
    ];
  }

  return [
    { key: "valueA", label: "Input value A", defaultValue: 10, min: 1, max: 50, step: 1 },
    { key: "valueB", label: "Input value B", defaultValue: 6, min: 1, max: 30, step: 1 },
    { key: "multiplier", label: "Reasoning multiplier", defaultValue: 1.5, min: 0.5, max: 3, step: 0.1 }
  ];
}

function buildMuseumStations(workspace: ProjectWorkspaceRecord): MuseumExhibitStation[] {
  const stations = workspace.milestones.slice(0, 4).map((milestone, index) => ({
    title: milestone.title,
    artifactLabel: workspace.materials[index] ?? `Artifact ${index + 1}`,
    description: milestone.description || workspace.tasks.find((task) => task.milestoneId === milestone.id)?.description || workspace.description,
    curatorNote: `Curate this station to show how "${milestone.title}" deepens the audience's understanding of ${workspace.title}.`,
    visitorQuestions: workspace.reflectionQuestions.slice(index, index + 2)
  }));

  if (stations.length > 0) {
    return stations;
  }

  const taskStations = workspace.tasks.slice(0, 4).map((task, index) => ({
    title: task.title,
    artifactLabel: workspace.materials[index] ?? `Artifact ${index + 1}`,
    description: task.description,
    curatorNote: `Use this station to frame the evidence, artifact, or interpretation behind "${task.title}".`,
    visitorQuestions: workspace.reflectionQuestions.slice(index, index + 2)
  }));

  if (taskStations.length > 0) {
    return taskStations;
  }

  return [
    {
      title: "Opening exhibit",
      artifactLabel: workspace.materials[0] ?? "Opening artifact",
      description: workspace.description,
      curatorNote: `Use the opening station to introduce the audience to the core question in ${workspace.title}.`,
      visitorQuestions: workspace.reflectionQuestions.slice(0, 2)
    }
  ];
}

function buildMissionDecisions(workspace: ProjectWorkspaceRecord): MissionDecision[] {
  const prompts = uniqueList([
    ...workspace.targetSkills.map((skill) => `How will you show strong ${skill.toLowerCase()} without slowing the project down?`),
    ...workspace.rubric.map((entry) => truncateAtSentence(entry.description))
  ]).filter(Boolean);

  const decisions = prompts.slice(0, 3).map((prompt, index) => ({
    title: workspace.rubric[index]?.criterion ?? `Decision ${index + 1}`,
    tension: prompt,
    options: [
      workspace.tasks[index]?.title ?? "Take the fastest next step",
      workspace.tasks[index + 1]?.title ?? "Pause to gather stronger evidence",
      workspace.materials[index] ?? "Use an available resource to improve the plan"
    ],
      recommendationPrompt: `Record the recommendation you would make after weighing this tradeoff inside ${workspace.title}.`
  }));

  if (decisions.length > 0) {
    return decisions;
  }

  return [
    {
      title: "Primary decision",
      tension: `What is the most effective path for moving ${workspace.title} from idea to recommendation?`,
      options: ["Clarify the mission", "Gather stronger evidence", "Prototype the final deliverable"],
      recommendationPrompt: `Capture the strongest next recommendation for the audience inside ${workspace.title}.`
    }
  ];
}

export function buildProjectExperienceModel(workspace: ProjectWorkspaceRecord): ProjectExperienceModel {
  const type = workspace.experienceType;
  const commonDescription = workspace.studentMission ?? workspace.description;

  if (type === "guided_tour" || type === "interactive_map" || type === "timeline") {
    const copy = getExperienceCopy(type);
    const progressLabel = "progressLabel" in copy && typeof copy.progressLabel === "string" ? copy.progressLabel : "Tour progress";
    return {
      type,
      surface: "guided_tour",
      eyebrow: copy.eyebrow,
      title: copy.title,
      description: copy.description,
      stops: buildGuidedTourStops(workspace),
      scriptPrompt: `Deliver the story of ${workspace.title} like a confident guide. Blend the mission, evidence, and audience needs into a clear narrative at every stop.`,
      progressLabel
    };
  }

  if (type === "math_lab" || type === "science_simulation" || type === "data_lab") {
    const copy = getExperienceCopy(type);
    return {
      type,
      surface: "math_lab",
      eyebrow: copy.eyebrow,
      title: copy.title,
      description: copy.description,
      variables: buildMathLabVariables(workspace),
      explanationPrompts: normalizeList(
        [...workspace.targetSkills.map((skill) => `What does the math tell you about ${skill.toLowerCase()}?`), ...workspace.reflectionQuestions],
        ["Explain what changed when you adjusted the variables and why that matters for the project recommendation."]
      ).slice(0, 4),
      benchmarkLabels: normalizeList(workspace.timeline.map((entry) => entry.label), ["Baseline", "Revised", "Best-fit model"]),
      conclusionPrompt: workspace.reflectionQuestions[0] ?? "What conclusion can you defend after testing multiple values?"
    };
  }

  if (type === "museum_exhibit") {
    const copy = getExperienceCopy(type);
    return {
      type,
      surface: "museum_exhibit",
      eyebrow: copy.eyebrow,
      title: copy.title,
      description: copy.description,
      stations: buildMuseumStations(workspace),
      finalReflectionPrompt:
        workspace.reflectionQuestions[0] ?? `What should visitors understand, feel, or do differently after experiencing your ${workspace.title} exhibit?`
    };
  }

  const copy = getExperienceCopy(type);
  return {
    type,
    surface: "mission_dashboard",
    eyebrow: copy.eyebrow,
    title: copy.title,
    description: copy.description,
    briefing: commonDescription,
    objectives: normalizeList(
      [
        ...workspace.milestones.map((milestone) => milestone.title),
        ...workspace.tasks.slice(0, 4).map((task) => task.title)
      ],
      ["Define the challenge", "Gather evidence", "Prepare the final recommendation"]
    ).slice(0, 4),
    resources: normalizeList(
      [...workspace.materials, ...workspace.resources.map((resource) => resource.title)],
      ["Planning notes", "Project evidence", "Final recommendation tool"]
    ).slice(0, 5),
    decisions: buildMissionDecisions(workspace),
    finalRecommendationPrompt:
      workspace.reflectionQuestions[0] ?? `What final recommendation should the audience act on after reviewing ${workspace.title}?`
  };
}
