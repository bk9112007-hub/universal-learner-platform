"use client";

import { useActionState, useMemo, useState } from "react";

import { createManualQuizAction, type AssessmentActionState } from "@/lib/assessments/actions";
import type { QuizQuestionType } from "@/types/domain";

const initialState: AssessmentActionState = {};

type QuestionDraft = {
  id: string;
  prompt: string;
  questionType: QuizQuestionType;
  topic: string;
  points: number;
  optionsText: string;
  correctAnswer: string;
  explanation: string;
  keywordText: string;
};

function createBlankQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    questionType: "multiple_choice",
    topic: "",
    points: 4,
    optionsText: "Option A\nOption B\nOption C\nOption D",
    correctAnswer: "",
    explanation: "",
    keywordText: ""
  };
}

export function QuizManualCreateForm({
  students,
  cohorts
}: {
  students: Array<{ id: string; fullName: string }>;
  cohorts: Array<{ id: string; title: string }>;
}) {
  const [state, action] = useActionState(createManualQuizAction, initialState);
  const [targetType, setTargetType] = useState<"student" | "cohort">("student");
  const [questions, setQuestions] = useState<QuestionDraft[]>([createBlankQuestion(), createBlankQuestion()]);

  const questionPayload = useMemo(
    () =>
      JSON.stringify(
        questions.map((question) => ({
          prompt: question.prompt,
          questionType: question.questionType,
          topic: question.topic,
          points: question.points,
          options:
            question.questionType === "short_answer"
              ? []
              : question.questionType === "true_false"
                ? ["True", "False"]
                : question.optionsText
                    .split("\n")
                    .map((option) => option.trim())
                    .filter(Boolean),
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          correctAnswerKeywords: question.keywordText
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        }))
      ),
    [questions]
  );

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Assign by</label>
          <select
            name="targetType"
            value={targetType}
            onChange={(event) => setTargetType(event.target.value as "student" | "cohort")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          >
            <option value="student">Student</option>
            <option value="cohort">Cohort</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">{targetType === "student" ? "Student" : "Cohort"}</label>
          <select name="targetId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
            <option value="">{targetType === "student" ? "Select a student" : "Select a cohort"}</option>
            {(targetType === "student" ? students : cohorts).map((target) => (
              <option key={target.id} value={target.id}>
                {"fullName" in target ? target.fullName : target.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Quiz title</label>
          <input name="title" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Photosynthesis mastery check" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Subject</label>
          <input name="subject" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Science" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Primary topic</label>
          <input name="topic" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Photosynthesis" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Due date</label>
          <input name="dueDate" type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Teacher brief</label>
          <textarea name="description" required className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" placeholder="Explain what the quiz should measure and what strong responses should show." />
        </div>
      </div>

      <input type="hidden" name="questionsPayload" value={questionPayload} />

      <div className="space-y-4">
        {questions.map((question, index) => (
          <article key={question.id} className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-ink">Question {index + 1}</h4>
              {questions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setQuestions((current) => current.filter((entry) => entry.id !== question.id))}
                  className="text-sm font-semibold text-rose-700 transition hover:text-rose-800"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Prompt</label>
                <textarea
                  value={question.prompt}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, prompt: event.target.value } : entry)))}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Question type</label>
                <select
                  value={question.questionType}
                  onChange={(event) =>
                    setQuestions((current) =>
                      current.map((entry) =>
                        entry.id === question.id
                          ? {
                              ...entry,
                              questionType: event.target.value as QuizQuestionType,
                              optionsText: event.target.value === "true_false" ? "True\nFalse" : entry.optionsText
                            }
                          : entry
                      )
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Topic tag</label>
                <input
                  value={question.topic}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, topic: event.target.value } : entry)))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="Cell structure"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Points</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={question.points}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, points: Number(event.target.value) } : entry)))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                />
              </div>
              {question.questionType === "multiple_choice" ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Options</label>
                  <textarea
                    value={question.optionsText}
                    onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, optionsText: event.target.value } : entry)))}
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                    placeholder={"Option A\nOption B\nOption C\nOption D"}
                  />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Correct answer</label>
                <input
                  value={question.correctAnswer}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, correctAnswer: event.target.value } : entry)))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder={question.questionType === "short_answer" ? "Expected model answer" : "Exact correct option"}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Answer keywords</label>
                <input
                  value={question.keywordText}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, keywordText: event.target.value } : entry)))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="chlorophyll, sunlight, glucose"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">AI grading explanation</label>
                <textarea
                  value={question.explanation}
                  onChange={(event) => setQuestions((current) => current.map((entry) => (entry.id === question.id ? { ...entry, explanation: event.target.value } : entry)))}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="Explain why this is correct so the AI review can give instant feedback."
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setQuestions((current) => [...current, createBlankQuestion()])}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-800"
        >
          Add question
        </button>
        <button type="submit" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
          Create manual quiz
        </button>
      </div>

      {state.error ? <p className="text-sm font-medium text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-success">{state.success}</p> : null}
    </form>
  );
}
