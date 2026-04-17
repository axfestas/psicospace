import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserEconomyCore } from "@/lib/psico-economy";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const core = await getUserEconomyCore(auth.userId);
    const wallet = {
      ...core.wallet,
      transactions: core.transactions.slice(0, 20),
    };

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error("[psicogame/wallet GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
