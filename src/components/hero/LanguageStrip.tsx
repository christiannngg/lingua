const LANGUAGES = [
  { flag: "🇪🇸", label: "Spanish" },
  { flag: "🇮🇹", label: "Italian" },
  { flag: "🇫🇷", label: "French" },
];

export default function LanguageStrip() {
  return (
    <div
      style={{
        maxWidth: "1060px",
        margin: "0 auto",
        padding: "0 48px 72px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "#aaa9be",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginRight: "4px",
        }}
      >
        Now available in
      </span>

      {LANGUAGES.map((lang) => (
        <div
          key={lang.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "white",
            border: "1px solid rgba(2,1,34,0.09)",
            borderRadius: "99px",
            padding: "5px 14px",
            fontSize: "13px",
            color: "#020122",
            fontWeight: 400,
          }}
        >
          <span>{lang.flag}</span>
          {lang.label}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "white",
          border: "1px dashed rgba(2,1,34,0.12)",
          borderRadius: "99px",
          padding: "5px 14px",
          fontSize: "13px",
          color: "#aaa9be",
          fontWeight: 400,
        }}
      >
        + More coming
      </div>
    </div>
  );
}