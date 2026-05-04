"use client";

import { SidebarProvider } from "@/components/layout/SidebarContext";
import { HeadNav } from "@/components/layout/HeadNav";
import { SideNav } from "@/components/layout/SideNav";

interface Conversation {
    id: string;
    title: string | null;
    updatedAt: Date;
}

interface AppShellProps {
    children: React.ReactNode;
    enrolledCodes: string[];
    // Chat-only props — passed through to SideNav
    conversations?: Conversation[];
    chatLanguage?: string;
}

export function AppShell({
    children,
    enrolledCodes,
    conversations,
    chatLanguage,
}: AppShellProps) {
    return (
        <SidebarProvider>
            <div className="flex flex-col h-screen">
                <HeadNav enrolledCodes={enrolledCodes} />
                <div className="flex flex-1 overflow-hidden">
                    <SideNav
                        languages={enrolledCodes}
                        {...(conversations !== undefined && { conversations })}
                        {...(chatLanguage !== undefined && { chatLanguage })}
                    />
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}