import { getAllLanguages } from "@/lib/languages.config";
import * as Flags from "country-flag-icons/react/3x2";

export function LanguageGrid() {
  const languages = getAllLanguages();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
      }}
    >
      {languages.map((lang) => {
        const Flag = Flags[lang.flagCode as keyof typeof Flags];
        return (
          <div
            key={lang.code}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.04)",
            //   border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {Flag && (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Flag style={{ width: "100%", height: "100%", display: "block" }} />
              </div>
            )}
            <span
              style={{
                fontSize: "12px",
                color: "rgb(0, 0, 0)",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {lang.displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}