import { prisma } from "@/lib/db";
import {
  REWARD_EXERCISE_CORRECT,
  REWARD_SESSION_COMPLETED,
  REWARD_SESSION_LONG_BONUS,
  REWARD_DAILY_STREAK,
  REWARD_STREAK_MILESTONE,
  STREAK_MILESTONE_INTERVAL,
  SESSION_LONG_THRESHOLD_SECONDS,
  XP_EXERCISE_CORRECT,
  XP_SESSION_COMPLETED,
  XP_PER_LEVEL,
} from "@/lib/psico-constants";

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

export function safeParseArray(value: string): string[] {
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
  const [wallet, character] = await Promise.all([
    prisma.psicoWallet.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        balance: 0,
        updatedAt: new Date().toISOString(),
      },
    }),
    prisma.characterProgress.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        level: 1,
        xp: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        ownedItems: "[]",
        equippedItems: "{}",
        updatedAt: new Date().toISOString(),
      },
    }),
  ]);

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

async function addEarnTransaction(
  walletId: string,
  userId: string,
  amount: number,
  reason: string,
  referenceId: string,
  now: Date = new Date(),
) {
  await prisma.psicoWallet.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      updatedAt: now.toISOString(),
    },
  });
  await prisma.psicoTransaction.create({
    data: {
      walletId,
      amount,
      type: "EARN",
      reason,
      referenceId,
    },
  });
}

async function awardStreakBonus(walletId: string, userId: string, newStreak: number, now: Date) {
  // Base daily streak reward (+5 per day)
  await addEarnTransaction(
    walletId,
    userId,
    REWARD_DAILY_STREAK,
    "daily_streak_bonus",
    `streak_${newStreak}_${now.toISOString().slice(0, 10)}`,
    now,
  );

  // Milestone bonus: +20 every STREAK_MILESTONE_INTERVAL consecutive days
  if (newStreak > 0 && newStreak % STREAK_MILESTONE_INTERVAL === 0) {
    await addEarnTransaction(
      walletId,
      userId,
      REWARD_STREAK_MILESTONE,
      "streak_milestone_bonus",
      `streak_milestone_${newStreak}_${now.toISOString().slice(0, 10)}`,
      now,
    );
    await prisma.notification.create({
      data: {
        userId,
        title: `🔥 +${REWARD_STREAK_MILESTONE} Psiquê — bônus de sequência!`,
        message: `Incrível! ${newStreak} dias consecutivos de estudo.`,
        type: "success",
      },
    });
  }
}

async function updateCharacterProgress(userId: string, xpGain: number) {
  const { wallet, character } = await ensureEconomyState(userId);
  const now = new Date();

  let newStreak = character.currentStreak;
  let streakIncremented = false;
  if (character.lastSessionAt) {
    const lastDate = new Date(character.lastSessionAt);
    const diffDays = diffUtcDays(lastDate, now);
    if (diffDays === 1) {
      newStreak = character.currentStreak + 1;
      streakIncremented = true;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newXp = character.xp + xpGain;
  const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

  await prisma.characterProgress.update({
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

  if (streakIncremented) {
    await awardStreakBonus(wallet.id, userId, newStreak, now);
  }
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

  await addEarnTransaction(wallet.id, userId, REWARD_EXERCISE_CORRECT, "exercise_completed", exerciseId);

  await updateCharacterProgress(userId, XP_EXERCISE_CORRECT);

  await prisma.notification.create({
    data: {
      userId,
      title: `💰 +${REWARD_EXERCISE_CORRECT} Psiquê`,
      message: "Você acertou um exercício! Continue assim.",
      type: "success",
    },
  });

  return {
    awarded: true,
    duplicate: false,
    amount: REWARD_EXERCISE_CORRECT,
  };
}

export async function grantSessionReward(userId: string, sessionId: string, totalSeconds?: number) {
  const { wallet } = await ensureEconomyState(userId);

  const duplicated = await prisma.psicoTransaction.findFirst({
    where: {
      walletId: wallet.id,
      reason: "session_completed",
      referenceId: sessionId,
    },
    select: { id: true },
  });

  if (duplicated) {
    return { awarded: false, duplicate: true, amount: 0 };
  }

  const now = new Date();
  await addEarnTransaction(wallet.id, userId, REWARD_SESSION_COMPLETED, "session_completed", sessionId, now);

  // Bônus de sessão longa (≥ 25 min = SESSION_LONG_THRESHOLD_SECONDS)
  const isLongSession = typeof totalSeconds === "number" && totalSeconds >= SESSION_LONG_THRESHOLD_SECONDS;
  if (isLongSession) {
    await addEarnTransaction(wallet.id, userId, REWARD_SESSION_LONG_BONUS, "session_long_bonus", sessionId, now);
  }

  await updateCharacterProgress(userId, XP_SESSION_COMPLETED);

  const sessionTotalReward = REWARD_SESSION_COMPLETED + (isLongSession ? REWARD_SESSION_LONG_BONUS : 0);
  await prisma.notification.create({
    data: {
      userId,
      title: `📖 +${sessionTotalReward} Psiquê`,
      message: isLongSession
        ? "Sessão longa concluída — bônus de tempo incluído!"
        : "Sessão de estudo concluída!",
      type: "success",
    },
  });

  return { awarded: true, duplicate: false, amount: REWARD_SESSION_COMPLETED };
}

export async function purchaseShopItem(userId: string, itemId: string) {
  // Parallelise the two independent lookups: economy state init and item fetch.
  // Re-use the wallet/character returned by ensureEconomyState to avoid two
  // extra D1 round-trips (previously the return value was discarded and the
  // same rows were fetched again with findUnique, causing 8 sequential DB ops
  // that would hit D1 write-serialisation latency and leave the client loading
  // indefinitely).
  const [{ wallet, character }, item] = await Promise.all([
    ensureEconomyState(userId),
    prisma.shopItem.findUnique({ where: { id: itemId } }),
  ]);

  if (!item || !item.active) {
    return { ok: false as const, status: 404, error: "Item não encontrado" };
  }

  if (!wallet || !character) {
    return { ok: false as const, status: 500, error: "Estado econômico não inicializado" };
  }

  const parsed = parseCharacter(character);
  if (parsed.ownedItems.includes(itemId)) {
    return { ok: false as const, status: 409, error: "Você já possui este item" };
  }

  if (wallet.balance < item.price) {
    return {
      ok: false as const,
      status: 400,
      error: `Saldo insuficiente. Você tem ${wallet.balance} Psiquê e o item custa ${item.price}`,
    };
  }

  parsed.ownedItems.push(itemId);
  const nowIso = new Date().toISOString();

  // D1 does not support $transaction (batch form); run as sequential individual queries.
  await prisma.psicoWallet.update({
    where: { userId },
    data: {
      balance: { decrement: item.price },
      updatedAt: nowIso,
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
      updatedAt: nowIso,
    },
  });

  return {
    ok: true as const,
    item,
    newBalance: wallet.balance - item.price,
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
