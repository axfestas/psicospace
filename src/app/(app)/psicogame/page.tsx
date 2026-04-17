"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REWARD_EXERCISE_CORRECT, REWARD_SESSION_COMPLETED, REWARD_DAILY_STREAK_BONUS } from "@/lib/psico-constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  Coins,
  Star,
  ShoppingBag,
  TrendingUp,
  Flame,
  Award,
  Loader2,
  BookOpen,
  CheckCircle,
  Package,
  UserCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
}

interface Wallet {
  id: string;
  balance: number;
}

interface Character {
  id: string;
  level: number;
  xp: number;
  xpInLevel: number;
  xpToNext: number;
  xpPerLevel: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionAt?: string | null;
}

interface ShopItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  slot: string;
  category?: string;
  rarity?: string;
  price: number;
  imageUrl?: string | null;
  owned?: boolean;
}

interface CoreData {
  wallet: Wallet;
  character: Character & {
    ownedItems: string[];
    equippedItems: Record<string, string>;
  };
  inventoryItems: ShopItem[];
  transactions: Transaction[];
}

const REASON_LABELS: Record<string, string> = {
  exercise_completed: "Exercício concluído",
  item_purchased: "Item comprado",
  session_completed: "Sessão de estudo concluída",
  recall_answered: "Active recall respondido",
  microtask_done: "Microtarefa concluída",
  daily_streak_bonus: "Bônus de sequência diária",
  reading_reward: "Recompensa por leitura",
  weekly_mission: "Missão semanal concluída",
};

const LEVEL_TITLES: Record<number, string> = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Estudante",
  4: "Dedicado",
  5: "Concentrado",
  6: "Consistente",
  7: "Disciplinado",
  8: "Experiente",
  9: "Avançado",
  10: "Mestre",
};

const RARITY_CLASSES: Record<string, string> = {
  LENDÁRIO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ÉPICO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  RARO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  INCOMUM: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function getRarityClassName(rarity: string): string {
  return RARITY_CLASSES[rarity] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? `Nível ${level}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PsicoGamePage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<ShopItem[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"character" | "shop" | "inventory" | "history">("character");
  const [buying, setBuying] = useState<string | null>(null);
  const [buyMessage, setBuyMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const loadData = useCallback(async () => {
    const [coreRes, shopRes] = await Promise.all([
      fetch("/api/psicogame/core"),
      fetch("/api/psicogame/shop"),
    ]);
    if (coreRes.ok) {
      const core: CoreData = (await coreRes.json()).core;
      setWallet(core.wallet);
      setCharacter(core.character);
      setTransactions(core.transactions || []);
      setInventory(core.inventoryItems || []);
    }
    if (shopRes.ok) setShopItems((await shopRes.json()).items || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBuy = async (itemId: string, price: number) => {
    if (!wallet || wallet.balance < price) {
      setBuyMessage({ text: "Saldo insuficiente", ok: false });
      setTimeout(() => setBuyMessage(null), 3000);
      return;
    }
    setBuying(itemId);
    setBuyMessage(null);
    try {
      const res = await fetch(`/api/psicogame/shop/${itemId}/buy`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBuyMessage({ text: `✅ ${data.message}`, ok: true });
        await loadData();
      } else {
        setBuyMessage({ text: data.error || "Erro ao comprar", ok: false });
      }
    } finally {
      setBuying(null);
      setTimeout(() => setBuyMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Star className="h-7 w-7 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PsicoGame</h1>
          <p className="text-sm text-gray-500">Seu progresso e recompensas</p>
        </div>
      </div>

      {buyMessage && (
        <div
          className={`rounded-lg border p-3 text-sm ${buyMessage.ok ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300" : "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300"}`}
        >
          {buyMessage.text}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["character", "shop", "inventory", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab === "character" && <Award className="h-4 w-4" />}
            {tab === "shop" && <ShoppingBag className="h-4 w-4" />}
            {tab === "inventory" && <Package className="h-4 w-4" />}
            {tab === "history" && <TrendingUp className="h-4 w-4" />}
            {tab === "character" ? "Personagem" : tab === "shop" ? "Loja" : tab === "inventory" ? "Inventário" : "Histórico"}
          </button>
        ))}
      </div>

      {/* ── TAB: character ──────────────────────────────────────────────────── */}
      {activeTab === "character" && character && (
        <div className="space-y-4">
          {/* Level card with avatar */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                {/* Player avatar */}
                <div className="relative h-20 w-20 flex-shrink-0">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover ring-4 ring-purple-400 dark:ring-purple-600"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-purple-200 dark:ring-purple-800">
                      {user?.name ? user.name[0].toUpperCase() : <UserCircle className="h-10 w-10" />}
                    </div>
                  )}
                  {/* Level badge overlay */}
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow">
                    {character.level}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {getLevelTitle(character.level)}
                  </p>
                  <p className="text-sm text-gray-500">Nível {character.level}</p>
                  <div className="mt-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{character.xpInLevel} XP</span>
                      <span>{character.xpPerLevel} XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${(character.xpInLevel / character.xpPerLevel) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Faltam {character.xpToNext} XP para o próximo nível
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {character.totalSessions}
                    </p>
                    <p className="text-xs text-gray-500">Sessões concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <Flame className={`h-6 w-6 ${character.currentStreak > 0 ? "text-orange-500" : "text-gray-400"}`} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {character.currentStreak}
                    </p>
                    <p className="text-xs text-gray-500">Dias seguidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {character.longestStreak}
                    </p>
                    <p className="text-xs text-gray-500">Maior sequência</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

              {/* How to earn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como ganhar Psiquê 💰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  icon: "✅",
                  text: "Responder exercício aprovado corretamente",
                  value: `+${REWARD_EXERCISE_CORRECT} Psiquê`,
                },
                {
                  icon: "📖",
                  text: "Concluir uma sessão de estudo",
                  value: `+${REWARD_SESSION_COMPLETED} Psiquê`,
                },
                {
                  icon: "🔥",
                  text: "Manter sequência diária (streak)",
                  value: `+${REWARD_DAILY_STREAK_BONUS} Psiquê`,
                },
                {
                  icon: "📚",
                  text: "Leitura e páginas concluídas",
                  value: "Em breve",
                },
                {
                  icon: "🎯",
                  text: "Missões semanais",
                  value: "Em breve",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span>{item.icon}</span>
                    {item.text}
                  </span>
                  <span className={`font-medium ${item.value.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: shop ──────────────────────────────────────────────────────── */}
      {activeTab === "shop" && (
        <div className="space-y-4">
          {shopItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum item disponível na loja ainda.</p>
                <p className="text-xs mt-1">Continue estudando para quando os itens chegarem!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shopItems.map((item) => (
                <Card key={item.id} className={item.owned ? "border-green-200 dark:border-green-800" : ""}>
                  <CardContent className="pt-4 pb-4 space-y-3">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.name}</p>
                        {item.owned && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="default" className="text-xs">{item.type}</Badge>
                        {item.rarity && item.rarity !== "COMUM" && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRarityClassName(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                        <Coins className="h-4 w-4" />
                        {item.price} Psiquê
                      </div>
                      {item.owned ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Adquirido ✓
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          loading={buying === item.id}
                          disabled={!wallet || wallet.balance < item.price}
                          onClick={() => handleBuy(item.id, item.price)}
                          className="text-xs"
                        >
                          Comprar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Itens da loja são exclusivamente cosméticos e não afetam seu desempenho de estudo.
          </p>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-4">
          {/* Avatar preview */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover ring-4 ring-purple-400 dark:ring-purple-600"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-purple-200 dark:ring-purple-800">
                      {user?.name ? user.name[0].toUpperCase() : <UserCircle className="h-8 w-8" />}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow">
                    {character?.level ?? 1}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.name ?? "Jogador"}</p>
                  <p className="text-xs text-gray-500">{inventory.length} item{inventory.length !== 1 ? "s" : ""} no inventário</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {inventory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Seu inventário está vazio.</p>
                <p className="text-xs mt-1">Compre itens na loja para personalizar seu avatar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {inventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    <Badge variant="default" className="text-xs">{item.type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: history ───────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma transação ainda.</p>
                <p className="text-xs mt-1">Resolva exercícios aprovados para ganhar Psiquê.</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {REASON_LABELS[tx.reason] ?? tx.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`font-bold text-sm ${tx.type === "EARN" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                >
                  {tx.type === "EARN" ? "+" : "-"}{tx.amount} Psiquê
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
