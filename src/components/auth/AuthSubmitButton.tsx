"use client";

interface AuthSubmitButtonProps {
  pending: boolean;
  label: string;
  pendingLabel: string;
}

export function AuthSubmitButton({ pending, label, pendingLabel }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        marginTop: 4,
        width: "100%",
        background: pending ? "#d8a8fb" : "#CA7DF9",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "13px 20px",
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: pending ? "not-allowed" : "pointer",
        letterSpacing: "-0.1px",
        transition: "background 0.15s",
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}