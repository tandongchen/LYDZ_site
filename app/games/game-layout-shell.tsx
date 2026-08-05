import Link from "next/link";
import { MagicMathLogo } from "../components/magic-math-logo";

type GameLayoutShellProps = Readonly<{
  children: React.ReactNode;
  gameId: string;
}>;

export function GameLayoutShell({ children, gameId }: GameLayoutShellProps) {
  return (
    <div className={`game-route-scope game-route-${gameId}`}>
      <Link className="game-home-link" href="/">
        <MagicMathLogo />
        <span>返回魔法数学</span>
      </Link>
      {children}
    </div>
  );
}
