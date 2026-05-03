import Image from "next/image";
import LinguaLogoSrc from "../../../public/logo-no-bg.png";

interface LinguaLogoProps {
  /** Size of the logo image (width and height, always square). Defaults to 28. */
  size?: number;
  /** Font size for the "Lingua" text. Defaults to "1.5rem". */
  fontSize?: string | number;
}

export default function LinguaLogo({ size = 48, fontSize = "24px" }: LinguaLogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center"}}>
      <Image
        src={LinguaLogoSrc}
        alt="Lingua logo"
        width={size}
        height={size}
      />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color: "#CA7DF9",
          letterSpacing: "-0.3px",
          lineHeight: 1,
        }}
      >
        Lingua
      </span>
    </div>
  );
}