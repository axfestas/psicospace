import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserEconomyCore, ensureEconomyState } from "@/lib/psico-economy";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // ?minimal=true — fast path used by the header balance badge.
    // Skips transaction history and inventory to avoid fetching 100+ rows.
    const minimal = new URL(request.url).searchParams.get("minimal") === "true";
    if (minimal) {
      const { wallet } = await ensureEconomyState(auth.userId);
      return NextResponse.json({ wallet: { balance: wallet.balance } });
    }

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
