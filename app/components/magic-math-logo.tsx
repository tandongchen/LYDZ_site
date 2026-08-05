type MagicMathLogoProps = {
  variant?: "nav" | "hero";
};

export function MagicMathLogo({ variant = "nav" }: MagicMathLogoProps) {
  return (
    <span className={`magic-math-logo magic-math-logo-${variant}`} aria-hidden="true">
      <span className="logo-energy-field" />
      <span className="logo-orbit logo-orbit-red" />
      <span className="logo-orbit logo-orbit-blue" />
      <span className="logo-axis" />
      <span className="logo-glyph">
        M<sup>2</sup>
      </span>
      <span className="logo-node logo-node-red" />
      <span className="logo-node logo-node-blue" />
      <span className="logo-spell-star">✦</span>
    </span>
  );
}
