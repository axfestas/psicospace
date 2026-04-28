import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ensureEconomyState, parseCharacter } from "@/lib/psico-economy";
import { XP_PER_LEVEL } from "@/lib/psico-constants";

export const runtime = "edge";

/**
 * GET /api/psicogame/stats
 *
 * Lightweight summary: wallet balance + character stats only.
 * No transaction history, no inventory, no shop — minimises D1 subrequests.
 * Used by the simplified PsicoGame page (exercise-only mode).
 */
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { wallet, character } = await ensureEconomyState(auth.userId);
    const parsed = parseCharacter(character);

    const xpInLevel = parsed.xp % XP_PER_LEVEL;
    const xpToNext = XP_PER_LEVEL - xpInLevel;

    return NextResponse.json({
      wallet: { balance: wallet.balance },
      character: {
        level: parsed.level,
        xp: parsed.xp,
        xpInLevel,
        xpToNext,
        xpPerLevel: XP_PER_LEVEL,
        totalSessions: parsed.totalSessions,
        currentStreak: parsed.currentStreak,
        longestStreak: parsed.longestStreak,
        lastSessionAt: parsed.lastSessionAt,
      },
    });
  } catch (error) {
    console.error("[psicogame/stats GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
