import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getUserEconomyCore } from "@/lib/psico-economy";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const items = await prisma.shopItem.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });

    const core = await getUserEconomyCore(auth.userId);
    const ownedItems = core.character.ownedItems;

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
