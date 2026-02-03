type LogoSize = "sm" | "md" | "lg";

const sizeMap: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

const wordmarkClass: Record<LogoSize, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

type LogoProps = {
  size?: LogoSize;
  className?: string;
  showWordmark?: boolean;
};

export default function Logo({ size = "md", className = "", showWordmark = true }: LogoProps) {
  const px = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/favicon.svg"
        alt="Origo"
        width={px}
        height={px}
        className="flex-shrink-0"
      />
      {showWordmark && (
        <span className={`text-foreground font-bold tracking-[0.15em] uppercase ${wordmarkClass[size]}`}>
          Origo
        </span>
      )}
    </span>
  );
}
