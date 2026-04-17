import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    let wallet = await prisma.psicoWallet.findUnique({
      where: { userId: auth.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.psicoWallet.create({
        data: {
          userId: auth.userId,
          balance: 0,
          updatedAt: new Date().toISOString(),
        },
        include: { transactions: true },
      });
    }

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error("[psicogame/wallet GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
