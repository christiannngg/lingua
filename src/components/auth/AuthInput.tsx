"use client";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label: string;
  showToggle?: boolean;
}

export function AuthInput({ id, name, label, ...rest }: AuthInputProps) {
  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#CA7DF9";
    e.currentTarget.style.background = "#fff";
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#e8e7f4";
    e.currentTarget.style.background = "#ffffff";
    e.currentTarget.style.boxShadow = "none";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#020122",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#ffffff",
          border: "1.5px solid #e8e7f4",
          borderRadius: 10,
          padding: "11px 14px",
          fontSize: 14,
          color: "#020122",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
        }}
        {...rest}
      />
    </div>
  );
}