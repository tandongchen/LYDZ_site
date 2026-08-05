import Link from "next/link";
import { MagicMathLogo } from "../components/magic-math-logo";

export function GameLayoutShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Link className="game-home-link" href="/">
        <MagicMathLogo />
        <span>返回魔法数学</span>
      </Link>
      {children}
    </>
  );
}
