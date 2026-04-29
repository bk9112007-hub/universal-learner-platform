"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Compass,
  Landmark,
  Map,
  MessageSquareText,
  Microscope,
  Rocket,
  ShieldCheck,
  Sparkles,
  Theater,
  Trophy
} from "lucide-react";

import { buildProjectExperienceModel } from "@/lib/projects/experience";
import type { ProjectWorkspaceRecord } from "@/types/domain";

function formatPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getExperienceIcon(surface: ReturnType<typeof buildProjectExperienceModel>["surface"]) {
  switch (surface) {
    case "guided_tour":
      return Compass;
    case "math_lab":
      return Microscope;
    case "museum_exhibit":
      return Landmark;
    default:
      return Rocket;
  }
}

function getExperienceAccent(surface: ReturnType<typeof buildProjectExperienceModel>["surface"]) {
  switch (surface) {
    case "guided_tour":
      return "from-sky-600 via-brand-700 to-indigo-800";
    case "math_lab":
      return "from-emerald-500 via-teal-600 to-cyan-800";
    case "museum_exhibit":
      return "from-amber-500 via-orange-600 to-rose-700";
    default:
      return "from-slate-900 via-brand-800 to-fuchsia-700";
  }
}

export function ProjectExperiencePanel({ workspace }: { workspace: ProjectWorkspaceRecord }) {
  const model = useMemo(() => buildProjectExperienceModel(workspace), [workspace]);
  const isEditable = workspace.canStudentEdit && workspace.accessRole === "student";
  const Icon = getExperienceIcon(model.surface);

  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [guideScript, setGuideScript] = useState(workspace.studentMission ?? "");
  const [curatorReflection, setCuratorReflection] = useState(workspace.reflectionNote ?? "");
  const [missionRecommendation, setMissionRecommendation] = useState(workspace.reflectionNote ?? "");

  const defaultVariableState = useMemo(() => {
    if (model.surface !== "math_lab") return {};
    return Object.fromEntries(model.variables.map((variable) => [variable.key, variable.defaultValue]));
  }, [model]);
  const [variableState, setVariableState] = useState<Record<string, number>>(defaultVariableState);
  const [mathConclusion, setMathConclusion] = useState(workspace.reflectionNote ?? "");

  const gradientClass = getExperienceAccent(model.surface);

  function resetMathValues() {
    if (model.surface !== "math_lab") return;
    setVariableState(Object.fromEntries(model.variables.map((variable) => [variable.key, variable.defaultValue])));
  }

  function nudgeMathValues() {
    if (model.surface !== "math_lab") return;
    const updatedEntries = model.variables.map((variable, index) => {
      const currentValue = variableState[variable.key] ?? variable.defaultValue;
      const nudgedValue = Math.min(variable.max, currentValue + variable.step * (index + 1));
      return [variable.key, Number(nudgedValue.toFixed(2))];
    });
    setVariableState(Object.fromEntries(updatedEntries));
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
      <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              <Icon className="h-4 w-4" />
              {model.eyebrow}
            </div>
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">{model.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">{model.description}</p>
          </div>
          <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Workspace progress</p>
              <p className="mt-2 text-3xl font-semibold">{workspace.progressPercent}%</p>
              <p className="mt-2 text-sm text-white/80">{workspace.completedTaskCount} tasks completed or submitted</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/12 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Experience mode</p>
              <p className="mt-2 text-lg font-semibold capitalize">{workspace.experienceType.replace(/_/g, " ")}</p>
              <p className="mt-2 text-sm text-white/80">
                {isEditable ? "Explore this layer, then use the task flow below to submit real work." : "Read-only view mirrors the learner experience without changing their work."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {model.surface === "guided_tour" ? (
          <div className="grid gap-6 xl:grid-cols-[0.34fr,0.66fr]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Map className="h-4 w-4 text-brand-700" />
                    {model.progressLabel}
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {currentStopIndex + 1}/{model.stops.length}
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-brand-700 transition-all"
                    style={{ width: `${formatPercent(currentStopIndex + 1, model.stops.length)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {model.stops.map((stop, index) => (
                  <button
                    key={`${stop.title}-${index}`}
                    type="button"
                    onClick={() => setCurrentStopIndex(index)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      index === currentStopIndex ? "border-brand-300 bg-brand-50 shadow-soft" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{stop.subtitle}</p>
                    <p className="mt-2 text-base font-semibold text-ink">{stop.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stop.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Current stop</p>
                    <h3 className="mt-2 text-2xl font-semibold">{model.stops[currentStopIndex]?.title}</h3>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    Visual stage placeholder for future 3D / immersive scene
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-[0.95fr,1.05fr]">
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Guide card</p>
                    <p className="mt-3 text-sm leading-7 text-slate-100">{model.stops[currentStopIndex]?.description}</p>
                    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Image / scene label</p>
                      <p className="mt-2 text-sm text-slate-100">{model.stops[currentStopIndex]?.imageLabel}</p>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Audience prompts</p>
                    <div className="mt-3 space-y-3">
                      {(model.stops[currentStopIndex]?.audienceQuestions.length
                        ? model.stops[currentStopIndex]?.audienceQuestions
                        : ["What should the audience notice here?", "How does this stop move the story forward?"]
                      ).map((question) => (
                        <div key={question} className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4 text-sm leading-6 text-slate-100">
                          {question}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Theater className="h-4 w-4 text-brand-700" />
                    Student guide script
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentStopIndex === 0}
                      onClick={() => setCurrentStopIndex((value) => Math.max(0, value - 1))}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentStopIndex === model.stops.length - 1}
                      onClick={() => setCurrentStopIndex((value) => Math.min(model.stops.length - 1, value + 1))}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{model.scriptPrompt}</p>
                <textarea
                  value={guideScript}
                  onChange={(event) => setGuideScript(event.target.value)}
                  readOnly={!isEditable}
                  placeholder={model.stops[currentStopIndex]?.guideScriptPrompt}
                  className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm leading-7 outline-none focus:border-brand-500 read-only:bg-slate-50"
                />
              </div>
            </div>
          </div>
        ) : null}

        {model.surface === "math_lab" ? (
          <div className="grid gap-6 xl:grid-cols-[0.42fr,0.58fr]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 text-brand-700" />
                  Variable controls
                </div>
                <div className="mt-4 space-y-4">
                  {model.variables.map((variable) => (
                    <label key={variable.key} className="block">
                      <span className="text-sm font-semibold text-slate-700">{variable.label}</span>
                      <input
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={variableState[variable.key] ?? variable.defaultValue}
                        disabled={!isEditable}
                        onChange={(event) =>
                          setVariableState((current) => ({
                            ...current,
                            [variable.key]: Number(event.target.value)
                          }))
                        }
                        className="mt-3 w-full accent-brand-700"
                      />
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{variable.min}</span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">
                          {variableState[variable.key] ?? variable.defaultValue}
                        </span>
                        <span>{variable.max}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={nudgeMathValues}
                    disabled={!isEditable}
                    className="rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Test another value
                  </button>
                  <button
                    type="button"
                    onClick={resetMathValues}
                    className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Reset values
                  </button>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-brand-700" />
                  Explanation prompts
                </div>
                <div className="mt-4 space-y-3">
                  {model.explanationPrompts.map((prompt) => (
                    <div key={prompt} className="rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BarChart3 className="h-4 w-4 text-brand-700" />
                  Quick table and graph area
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.46fr,0.54fr]">
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="pb-3">Scenario</th>
                          <th className="pb-3">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.benchmarkLabels.slice(0, 3).map((label, index) => {
                          const values = Object.values(variableState);
                          const total = Number((values.reduce((sum, value) => sum + value, 0) * (index + 1) / Math.max(values.length, 1)).toFixed(1));
                          return (
                            <tr key={label} className="border-t border-slate-200">
                              <td className="py-3 pr-3 font-semibold">{label}</td>
                              <td className="py-3">{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-950 p-4">
                    <div className="flex h-full items-end gap-3">
                      {model.benchmarkLabels.slice(0, 3).map((label, index) => {
                        const values = Object.values(variableState);
                        const raw = values.reduce((sum, value) => sum + value, 0) * (index + 1);
                        const height = Math.max(18, Math.min(100, raw / 3));
                        return (
                          <div key={label} className="flex flex-1 flex-col items-center gap-3">
                            <div
                              className="w-full rounded-t-2xl bg-gradient-to-t from-brand-500 to-cyan-300 transition-all"
                              style={{ height: `${height}%` }}
                            />
                            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Trophy className="h-4 w-4 text-brand-700" />
                  Student conclusion
                </div>
                <p className="mt-3 text-sm text-slate-600">{model.conclusionPrompt}</p>
                <textarea
                  value={mathConclusion}
                  onChange={(event) => setMathConclusion(event.target.value)}
                  readOnly={!isEditable}
                  placeholder="Explain the pattern you noticed and how it changes your final project decision."
                  className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm leading-7 outline-none focus:border-brand-500 read-only:bg-slate-50"
                />
              </div>
            </div>
          </div>
        ) : null}

        {model.surface === "museum_exhibit" ? (
          <div className="grid gap-6 xl:grid-cols-[0.36fr,0.64fr]">
            <div className="space-y-3">
              {model.stations.map((station, index) => (
                <button
                  key={`${station.title}-${index}`}
                  type="button"
                  onClick={() => setCurrentStopIndex(index)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    index === currentStopIndex ? "border-brand-300 bg-brand-50 shadow-soft" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Exhibit station {index + 1}</p>
                  <p className="mt-2 text-base font-semibold text-ink">{station.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{station.artifactLabel}</p>
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current station</p>
                    <h3 className="mt-2 text-2xl font-semibold text-ink">{model.stations[currentStopIndex]?.title}</h3>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Future immersive gallery placeholder
                  </div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Artifact card</p>
                    <p className="mt-3 text-lg font-semibold text-ink">{model.stations[currentStopIndex]?.artifactLabel}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{model.stations[currentStopIndex]?.description}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Curator notes</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{model.stations[currentStopIndex]?.curatorNote}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 text-brand-700" />
                  Visitor questions
                </div>
                <div className="mt-4 space-y-3">
                  {(model.stations[currentStopIndex]?.visitorQuestions.length
                    ? model.stations[currentStopIndex]?.visitorQuestions
                    : ["What detail at this station should a visitor remember?", "How does this station change the visitor's understanding?"]
                  ).map((question) => (
                    <div key={question} className="rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {question}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquareText className="h-4 w-4 text-brand-700" />
                  Final exhibit reflection
                </div>
                <p className="mt-3 text-sm text-slate-600">{model.finalReflectionPrompt}</p>
                <textarea
                  value={curatorReflection}
                  onChange={(event) => setCuratorReflection(event.target.value)}
                  readOnly={!isEditable}
                  placeholder="Describe what visitors should understand after moving through your exhibit."
                  className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm leading-7 outline-none focus:border-brand-500 read-only:bg-slate-50"
                />
              </div>
            </div>
          </div>
        ) : null}

        {model.surface === "mission_dashboard" ? (
          <div className="grid gap-6 xl:grid-cols-[0.38fr,0.62fr]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Rocket className="h-4 w-4 text-cyan-300" />
                  Mission briefing
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200">{model.briefing}</p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-brand-700" />
                  Objectives
                </div>
                <div className="mt-4 space-y-3">
                  {model.objectives.map((objective, index) => (
                    <div key={objective} className="flex items-start gap-3 rounded-[1.25rem] bg-slate-50 p-4">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-semibold text-brand-800">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-700">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[0.52fr,0.48fr]">
                <div className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4 text-brand-700" />
                    Resource stack
                  </div>
                  <div className="mt-4 space-y-3">
                    {model.resources.map((resource) => (
                      <div key={resource} className="rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {resource}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BarChart3 className="h-4 w-4 text-brand-700" />
                    Decision readiness
                  </div>
                  <div className="mt-4 space-y-4">
                    {model.decisions.map((decision) => (
                      <div key={decision.title} className="rounded-[1.25rem] bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-ink">{decision.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{decision.tension}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Compass className="h-4 w-4 text-brand-700" />
                  Decisions and tradeoffs
                </div>
                <div className="mt-4 space-y-4">
                  {model.decisions.map((decision) => (
                    <div key={`${decision.title}-${decision.tension}`} className="rounded-[1.25rem] bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-base font-semibold text-ink">{decision.title}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">Tradeoff</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{decision.tension}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {decision.options.map((option) => (
                          <span key={option} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                            {option}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-700">{decision.recommendationPrompt}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Trophy className="h-4 w-4 text-brand-700" />
                  Final recommendation
                </div>
                <p className="mt-3 text-sm text-slate-600">{model.finalRecommendationPrompt}</p>
                <textarea
                  value={missionRecommendation}
                  onChange={(event) => setMissionRecommendation(event.target.value)}
                  readOnly={!isEditable}
                  placeholder="State the recommendation you would present, defend it, and note the strongest evidence behind it."
                  className="mt-4 min-h-40 w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 text-sm leading-7 outline-none focus:border-brand-500 read-only:bg-slate-50"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
