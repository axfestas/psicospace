import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    let character = await prisma.characterProgress.findUnique({
      where: { userId: auth.userId },
    });

    if (!character) {
      character = await prisma.characterProgress.create({
        data: {
          userId: auth.userId,
          level: 1,
          xp: 0,
          totalSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const XP_PER_LEVEL = 100;
    const xpInLevel = character.xp % XP_PER_LEVEL;
    const xpToNext = XP_PER_LEVEL - xpInLevel;

    return NextResponse.json({
      character: {
        ...character,
        xpInLevel,
        xpToNext,
        xpPerLevel: XP_PER_LEVEL,
        ownedItems: JSON.parse(character.ownedItems || "[]"),
        equippedItems: JSON.parse(character.equippedItems || "{}"),
      },
    });
  } catch (error) {
    console.error("[psicogame/character GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
