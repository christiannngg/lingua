"use client";

import { createContext, useContext, ReactNode } from "react";

interface UserContextValue {
  firstName: string;
  avatarLetter: string;
}

const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
  firstName: string;
}

export function UserProvider({ children, firstName }: UserProviderProps) {
  const avatarLetter = firstName?.charAt(0).toUpperCase() || "?";

  return (
    <UserContext.Provider value={{ firstName, avatarLetter }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}