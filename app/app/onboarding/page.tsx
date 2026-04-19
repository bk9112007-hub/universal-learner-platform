import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState } from "@/components/dashboard/dashboard-primitives";
import {
  getParentAccessibleProgramSummaries,
  getParentLinkedChildren,
  getProfileForCurrentUser,
  getStudentEnrolledPrograms
} from "@/lib/dashboard/queries";
import { getRoleRoute } from "@/lib/auth/roles";

export default async function AppOnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ claimed?: string; count?: string; program?: string }>;
}) {
  const { profile, user } = await getProfileForCurrentUser();
  if (!user || !profile) {
    redirect("/login");
  }

  const params = await searchParams;
  const claimedCount = Number(params.count ?? 0);
  const claimedProgramCount = Number.isFinite(claimedCount) && claimedCount > 0 ? claimedCount : 1;

  const [studentPrograms, parentPrograms, linkedChildren] = await Promise.all([
    profile.role === "student" ? getStudentEnrolledPrograms(user.id) : Promise.resolve([]),
    profile.role === "parent" ? getParentAccessibleProgramSummaries(user.id) : Promise.resolve([]),
    profile.role === "parent" ? getParentLinkedChildren(user.id) : Promise.resolve([])
  ]);

  const programs = profile.role === "student" ? studentPrograms : parentPrograms;
  const primaryProgram = programs[0] ?? null;

  if (profile.role === "teacher" || profile.role === "admin") {
    redirect(getRoleRoute(profile.role));
  }

  return (
    <AppShell
      role={profile.role}
      title="Welcome to your learning space"
      description="Onboarding now responds to real role and enrollment state so newly unlocked users land in the right next step instead of a generic dashboard."
    >
      <DashboardSection
        title={params.claimed === "1" ? "Access unlocked" : "Your next best step"}
        description="Whether access came from a fresh purchase claim or an existing enrollment, this page orients the learner or parent into the right program context."
      >
        <div className="rounded-[1.75rem] bg-brand-700 p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Onboarding</p>
              <h2 className="mt-3 text-3xl font-semibold">
                {params.claimed === "1"
                  ? `${claimedProgramCount} program access unlock${claimedProgramCount === 1 ? "" : "s"} claimed successfully`
                  : "Your account is ready"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
                {primaryProgram
                  ? `Start with ${primaryProgram.title} and move directly into structured lessons, resources, and progress tracking.`
                  : "Your dashboard is ready. As programs unlock, this onboarding flow will guide you into the right learning context."}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-50">
                <Sparkles className="h-4 w-4" />
                Intelligent routing enabled
              </div>
              <p className="mt-2 text-sm text-blue-50">
                Sign-in now considers claimed purchases, role, linked-child visibility, and enrollment state.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {primaryProgram ? (
              <Link
                href={`/app/programs/${primaryProgram.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-slate-100"
              >
                Open {primaryProgram.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={getRoleRoute(profile.role)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-slate-100"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Available programs"
        description="Programs shown here are already filtered by the same enrollment-aware access model that protects program content."
      >
        {programs.length === 0 ? (
          <EmptyState
            title="No accessible programs yet"
            description="If a purchase was just made with another email, an admin can reassign pending access or the user can sign in with the checkout email."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {programs.map((program) => (
              <article key={program.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{program.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {program.progressPercent}% complete
                  </span>
                </div>
                <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-ink">{program.accessLabel}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {program.completedLessonCount} of {program.lessonCount} lessons completed.
                    {program.nextLessonTitle ? ` Next recommended lesson: ${program.nextLessonTitle}.` : ""}
                  </p>
                </div>
                <Link
                  href={`/app/programs/${program.slug}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Enter program
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </DashboardSection>

      {profile.role === "parent" ? (
        <DashboardSection
          title="Parent visibility"
          description="Parents see which programs are directly owned versus visible through a linked child, so access is understandable instead of opaque."
        >
          {linkedChildren.length === 0 ? (
            <EmptyState
              title="No child accounts linked yet"
              description="Link a child account from the parent dashboard to turn purchases and program visibility into a clear family view."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {linkedChildren.map((child) => (
                <article key={child.studentId} className="rounded-[1.5rem] border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-ink">{child.studentName}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {child.projectCount} project{child.projectCount === 1 ? "" : "s"}, {child.submissionCount} submission
                    {child.submissionCount === 1 ? "" : "s"}, and {child.feedbackCount} feedback
                    {" "}
                    {child.feedbackCount === 1 ? "entry" : "entries"} are already visible to this parent account.
                  </p>
                  <Link
                    href="/app/parent"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-900"
                  >
                    Open parent dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </DashboardSection>
      ) : null}
    </AppShell>
  );
}
