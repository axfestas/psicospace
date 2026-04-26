import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { safeParseArray } from "@/lib/psico-economy";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Fetch shop items and owned-items list in parallel. We use a lightweight
    // findUnique (read-only, no upserts) to avoid write-lock contention with
    // the concurrent /api/psicogame/core request that already runs upserts.
    const [items, character] = await Promise.all([
      prisma.shopItem.findMany({
        where: { active: true },
        orderBy: { price: "asc" },
      }),
      prisma.characterProgress.findUnique({
        where: { userId: auth.userId },
        select: { ownedItems: true },
      }),
    ]);

    const ownedItems = safeParseArray(character?.ownedItems ?? "[]");

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        owned: ownedItems.includes(item.id),
      })),
    });
  } catch (error) {
    console.error("[psicogame/shop GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
