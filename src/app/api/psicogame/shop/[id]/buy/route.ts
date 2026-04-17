import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { purchaseShopItem } from "@/lib/psico-economy";

export const runtime = "edge";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id: itemId } = await params;

    const result = await purchaseShopItem(auth.userId, itemId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: "Item comprado com sucesso!",
      item: result.item,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("[psicogame/shop/[id]/buy POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
