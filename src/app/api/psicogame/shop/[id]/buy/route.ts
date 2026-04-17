import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id: itemId } = await params;

    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || !item.active) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    // Get or create wallet
    let wallet = await prisma.psicoWallet.findUnique({ where: { userId: auth.userId } });
    if (!wallet) {
      wallet = await prisma.psicoWallet.create({
        data: { userId: auth.userId, balance: 0, updatedAt: new Date().toISOString() },
      });
    }

    // Get or create character
    let character = await prisma.characterProgress.findUnique({ where: { userId: auth.userId } });
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

    const ownedItems: string[] = JSON.parse(character.ownedItems || "[]");
    if (ownedItems.includes(itemId)) {
      return NextResponse.json({ error: "Você já possui este item" }, { status: 400 });
    }

    if (wallet.balance < item.price) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Você tem ${wallet.balance} Psico e o item custa ${item.price}` },
        { status: 400 }
      );
    }

    // Deduct balance
    await prisma.psicoWallet.update({
      where: { userId: auth.userId },
      data: {
        balance: { decrement: item.price },
        updatedAt: new Date().toISOString(),
      },
    });

    // Record transaction
    await prisma.psicoTransaction.create({
      data: {
        walletId: wallet.id,
        amount: item.price,
        type: "SPEND",
        reason: "item_purchased",
        referenceId: itemId,
      },
    });

    // Add item to owned
    ownedItems.push(itemId);
    await prisma.characterProgress.update({
      where: { userId: auth.userId },
      data: {
        ownedItems: JSON.stringify(ownedItems),
        updatedAt: new Date().toISOString(),
      },
    });

    const updatedWallet = await prisma.psicoWallet.findUnique({ where: { userId: auth.userId } });
    return NextResponse.json({
      message: "Item comprado com sucesso!",
      item,
      newBalance: updatedWallet?.balance ?? 0,
    });
  } catch (error) {
    console.error("[psicogame/shop/[id]/buy POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
