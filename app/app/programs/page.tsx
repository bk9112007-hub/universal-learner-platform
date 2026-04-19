import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSection, EmptyState } from "@/components/dashboard/dashboard-primitives";
import { ProgramAccessList } from "@/components/dashboard/program-access-list";
import { getProfileForCurrentUser, getProgramAccessRecords } from "@/lib/dashboard/queries";

export default async function AppProgramsPage() {
  const { user, profile } = await getProfileForCurrentUser();
  const programs = user && profile ? await getProgramAccessRecords(user.id, profile.role) : [];

  return (
    <AppShell
      role={profile?.role ?? "student"}
      title="Programs"
      description="See which programs are active, which are unlocked for your account, and which require purchase or a linked enrollment."
    >
      <DashboardSection
        title="Program access"
        description="Program visibility comes from the programs table, while actual access is enforced through active enrollments and linked-child permissions."
      >
        {programs.length === 0 ? (
          <EmptyState
            title="No programs available"
            description="Programs will appear here once they are configured in the platform."
          />
        ) : (
          <ProgramAccessList programs={programs} />
        )}
      </DashboardSection>
    </AppShell>
  );
}
