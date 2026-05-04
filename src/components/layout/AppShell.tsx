"use client";

import { SidebarProvider } from "@/components/layout/SidebarContext";
import { HeadNav } from "@/components/layout/HeadNav";
import { SideNav } from "@/components/layout/SideNav";

interface AppShellProps {
  children: React.ReactNode;
  enrolledCodes: string[];
}

export function AppShell({ children, enrolledCodes }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <HeadNav enrolledCodes={enrolledCodes} />
        <div className="flex flex-1 overflow-hidden">
          <SideNav languages={enrolledCodes} />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}