"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";

interface Props {
  enrolledCodes: string[];
}

export function LanguageSwitcher({ enrolledCodes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLanguage = useActiveLanguage(enrolledCodes);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const switchLanguage = useCallback(
    (code: string) => {
      setOpen(false);

      // If currently in a chat route, navigate to the new language's chat
      if (pathname.startsWith("/chat/")) {
        router.push(`/chat/${code}` as never);
        return;
      }

      // Otherwise update ?lang= in place, preserving other search params
      const params = new URLSearchParams(searchParams.toString());
      params.set("lang", code);
      router.replace(`${pathname}?${params.toString()}` as never);
    },
    [pathname, router, searchParams]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        style={{
          backgroundColor: open ? "#FFFFFF14" : "transparent",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
      >
        <LanguageFlag language={activeLanguage} className="w-5 h-auto rounded-sm" />
        <span>{getLanguageDisplayName(activeLanguage)}</span>
        <ChevronDown
          size={14}
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border py-1 shadow-lg"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
          role="listbox"
          aria-label="Languages"
        >
          {/* Enrolled languages */}
          {enrolledCodes.map((code) => {
            const isActive = code === activeLanguage;
            return (
              <button
                key={code}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLanguage(code)}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? "#CA7DF914" : "transparent",
                  color: isActive ? "#CA7DF9" : "var(--foreground)",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF0A";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <LanguageFlag language={code} className="w-5 h-auto rounded-sm shrink-0" />
                <span>{getLanguageDisplayName(code)}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#CA7DF9]" />
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div
            className="my-1 h-px"
            style={{ backgroundColor: "var(--border)" }}
          />

          {/* Add language */}
          <button
            onClick={() => {
              setOpen(false);
              router.push("/onboarding");
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF0A";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
            }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ border: "1.5px dashed var(--muted-foreground)" }}
            >
              <Plus size={11} />
            </span>
            <span>Add language</span>
          </button>
        </div>
      )}
    </div>
  );
}