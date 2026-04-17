import { prisma } from "@/lib/db";
import { REWARD_EXERCISE_CORRECT, XP_EXERCISE_CORRECT, XP_PER_LEVEL } from "@/lib/psico-constants";

interface ParsedCharacter {
  id: string;
  userId: string;
  level: number;
  xp: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionAt: Date | null;
  ownedItems: string[];
  equippedItems: Record<string, string>;
}

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function ensureEconomyState(userId: string) {
  let wallet = await prisma.psicoWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.psicoWallet.create({
      data: {
        userId,
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  let character = await prisma.characterProgress.findUnique({ where: { userId } });
  if (!character) {
    character = await prisma.characterProgress.create({
      data: {
        userId,
        level: 1,
        xp: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return { wallet, character };
}

export function parseCharacter(character: {
  id: string;
  userId: string;
  level: number;
  xp: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionAt: Date | null;
  ownedItems: string;
  equippedItems: string;
}): ParsedCharacter {
  return {
    id: character.id,
    userId: character.userId,
    level: character.level,
    xp: character.xp,
    totalSessions: character.totalSessions,
    currentStreak: character.currentStreak,
    longestStreak: character.longestStreak,
    lastSessionAt: character.lastSessionAt,
    ownedItems: safeParseArray(character.ownedItems),
    equippedItems: safeParseObject(character.equippedItems),
  };
}

async function updateCharacterProgress(userId: string, xpGain: number) {
  const { character } = await ensureEconomyState(userId);
  const now = new Date();

  let newStreak = character.currentStreak;
  if (character.lastSessionAt) {
    const lastDate = new Date(character.lastSessionAt);
    const diffDays = diffUtcDays(lastDate, now);
    if (diffDays === 1) {
      newStreak = character.currentStreak + 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newXp = character.xp + xpGain;
  const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

  return prisma.characterProgress.update({
    where: { userId },
    data: {
      xp: newXp,
      level: newLevel,
      totalSessions: { increment: 1 },
      currentStreak: newStreak,
      longestStreak: Math.max(character.longestStreak, newStreak),
      lastSessionAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  });
}

function diffUtcDays(a: Date, b: Date) {
  const aUTC = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bUTC = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((bUTC - aUTC) / (1000 * 60 * 60 * 24));
}

export async function grantExerciseReward(userId: string, exerciseId: string) {
  const { wallet } = await ensureEconomyState(userId);

  const duplicated = await prisma.psicoTransaction.findFirst({
    where: {
      walletId: wallet.id,
      reason: "exercise_completed",
      referenceId: exerciseId,
    },
    select: { id: true },
  });

  if (duplicated) {
    return {
      awarded: false,
      duplicate: true,
      amount: 0,
    };
  }

  await prisma.psicoWallet.update({
    where: { userId },
    data: {
      balance: { increment: REWARD_EXERCISE_CORRECT },
      updatedAt: new Date().toISOString(),
    },
  });

  await prisma.psicoTransaction.create({
    data: {
      walletId: wallet.id,
      amount: REWARD_EXERCISE_CORRECT,
      type: "EARN",
      reason: "exercise_completed",
      referenceId: exerciseId,
    },
  });

  await updateCharacterProgress(userId, XP_EXERCISE_CORRECT);

  return {
    awarded: true,
    duplicate: false,
    amount: REWARD_EXERCISE_CORRECT,
  };
}

export async function purchaseShopItem(userId: string, itemId: string) {
  const [item, { wallet, character }] = await Promise.all([
    prisma.shopItem.findUnique({ where: { id: itemId } }),
    ensureEconomyState(userId),
  ]);

  if (!item || !item.active) {
    return { ok: false as const, status: 404, error: "Item não encontrado" };
  }

  const parsed = parseCharacter(character);
  if (parsed.ownedItems.includes(itemId)) {
    return { ok: false as const, status: 400, error: "Você já possui este item" };
  }

  if (wallet.balance < item.price) {
    return {
      ok: false as const,
      status: 400,
      error: `Saldo insuficiente. Você tem ${wallet.balance} Psiquê e o item custa ${item.price}`,
    };
  }

  parsed.ownedItems.push(itemId);

  await prisma.psicoWallet.update({
    where: { userId },
    data: {
      balance: { decrement: item.price },
      updatedAt: new Date().toISOString(),
    },
  });

  await prisma.psicoTransaction.create({
    data: {
      walletId: wallet.id,
      amount: item.price,
      type: "SPEND",
      reason: "item_purchased",
      referenceId: item.id,
    },
  });

  await prisma.characterProgress.update({
    where: { userId },
    data: {
      ownedItems: JSON.stringify(parsed.ownedItems),
      updatedAt: new Date().toISOString(),
    },
  });

  const updatedWallet = await prisma.psicoWallet.findUnique({ where: { userId } });

  return {
    ok: true as const,
    item,
    newBalance: updatedWallet?.balance ?? 0,
  };
}

export async function getUserEconomyCore(userId: string) {
  const { wallet, character } = await ensureEconomyState(userId);
  const parsedCharacter = parseCharacter(character);

  const [transactions, inventoryItems] = await Promise.all([
    prisma.psicoTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    parsedCharacter.ownedItems.length
      ? prisma.shopItem.findMany({
          where: { id: { in: parsedCharacter.ownedItems } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const xpInLevel = parsedCharacter.xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;

  return {
    wallet,
    character: {
      ...parsedCharacter,
      xpInLevel,
      xpToNext,
      xpPerLevel: XP_PER_LEVEL,
    },
    inventoryItems,
    transactions,
  };
}
