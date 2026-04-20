import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  fullWidth = false
}: {
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700",
          fullWidth && "w-full",
          className
        )}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </form>
  );
}
