"use client";

import { createContext, useContext } from "react";

import type { UserRole } from "@/types/domain";

type AuthContextValue = {
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextValue>({ role: null });

export function SupabaseAuthProvider({
  children,
  role
}: {
  children: React.ReactNode;
  role: UserRole | null;
}) {
  return <AuthContext.Provider value={{ role }}>{children}</AuthContext.Provider>;
}

export function useAuthRole() {
  return useContext(AuthContext);
}
