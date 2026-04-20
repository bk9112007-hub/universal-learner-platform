import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState, StatusBadge } from "@/components/dashboard/dashboard-primitives";
import { StudentQuizAttemptForm } from "@/components/dashboard/student-quiz-attempt-form";
import { assertRole } from "@/lib/auth/roles";
import { getProfileForCurrentUser } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/format";
import { getQuizQuestionsForStudent } from "@/lib/assessments/queries";

export default async function StudentQuizDetailPage({
  params
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { profile, user } = await getProfileForCurrentUser();
  assertRole(["student"], profile?.role ?? null);

  const { assessmentId } = await params;
  const quiz = await getQuizQuestionsForStudent(assessmentId, user!.id);

  if (!quiz.assessment) {
    notFound();
  }

  const isLocked = quiz.assessment.status !== "assigned";

  return (
    <AppShell
      role="student"
      title={quiz.assessment.title}
      description="Complete the quiz, receive AI instant grading, and then review teacher feedback here."
    >
      <DashboardSection
        title="Quiz overview"
        description="This quiz is part of the Smart Assessment Engine and uses immediate AI grading plus teacher review."
      >
        <div className="grid gap-4 xl:grid-cols-[1fr,0.85fr]">
          <article className="rounded-[1.5rem] border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{quiz.assessment.subject}</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{quiz.assessment.title}</h2>
              </div>
              <StatusBadge status={quiz.assessment.status} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{quiz.assessment.description}</p>
            <p className="mt-4 text-sm text-slate-500">
              Topic: {quiz.assessment.topic ?? "General"} | Due {formatDate(quiz.assessment.dueDate)}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-brand-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Result summary</p>
            {quiz.assessment.aiScore !== null ? (
              <>
                <p className="mt-3 text-3xl font-semibold text-brand-900">{quiz.assessment.score?.toFixed(1)}%</p>
                <p className="mt-3 text-sm leading-6 text-brand-900">{quiz.assessment.aiFeedback}</p>
                {quiz.assessment.teacherComment ? (
                  <div className="mt-4 rounded-3xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Teacher feedback</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{quiz.assessment.teacherComment}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-brand-900">Submit the quiz to receive AI grading instantly.</p>
            )}
          </article>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Quiz questions"
        description={isLocked ? "Your submission is locked because AI grading has already been completed." : "Answer each question and submit for instant AI grading."}
      >
        {quiz.questions.length === 0 ? (
          <EmptyState title="No quiz questions found" description="This quiz does not have any published questions yet." />
        ) : (
          <StudentQuizAttemptForm assessmentId={quiz.assessment.id} questions={quiz.questions} locked={isLocked} />
        )}
      </DashboardSection>

      <Link
        href="/app/student"
        className="inline-flex rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
      >
        Back to student dashboard
      </Link>
    </AppShell>
  );
}
