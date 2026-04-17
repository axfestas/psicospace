"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  transactions: Transaction[];
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
  price: number;
  imageUrl?: string | null;
  owned: boolean;
}

const REASON_LABELS: Record<string, string> = {
  session_completed: "Sessão concluída",
  recall_answered: "Active Recall respondido",
  microtask_done: "Microtarefa concluída",
  item_purchased: "Item comprado",
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

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? `Nível ${level}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PsicoGamePage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"character" | "shop" | "history">("character");
  const [buying, setBuying] = useState<string | null>(null);
  const [buyMessage, setBuyMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const loadData = useCallback(async () => {
    const [walletRes, charRes, shopRes] = await Promise.all([
      fetch("/api/psicogame/wallet"),
      fetch("/api/psicogame/character"),
      fetch("/api/psicogame/shop"),
    ]);
    if (walletRes.ok) setWallet((await walletRes.json()).wallet);
    if (charRes.ok) setCharacter((await charRes.json()).character);
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
        {wallet && (
          <div className="ml-auto flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-full px-3 py-1">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
              {wallet.balance} Psico
            </span>
          </div>
        )}
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
        {(["character", "shop", "history"] as const).map((tab) => (
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
            {tab === "history" && <TrendingUp className="h-4 w-4" />}
            {tab === "character" ? "Personagem" : tab === "shop" ? "Loja" : "Histórico"}
          </button>
        ))}
      </div>

      {/* ── TAB: character ──────────────────────────────────────────────────── */}
      {activeTab === "character" && character && (
        <div className="space-y-4">
          {/* Level card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {character.level}
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
          <div className="grid grid-cols-2 gap-3">
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
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <Coins className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {wallet?.balance ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Psico disponível</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How to earn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como ganhar Psico 💰</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: "✅", text: "Concluir uma sessão de estudo", value: "+10 Psico" },
                { icon: "🧠", text: "Responder o active recall", value: "+5 Psico" },
                { icon: "🎯", text: "Finalizar uma microtarefa", value: "+5 Psico" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span>{item.icon}</span>
                    {item.text}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{item.value}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                * Recompensas são validadas somente ao concluir sessões completas.
              </p>
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
                      <Badge variant="default" className="text-xs mt-1">{item.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
                        <Coins className="h-4 w-4" />
                        {item.price} Psico
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

      {/* ── TAB: history ───────────────────────────────────────────────────── */}
      {activeTab === "history" && wallet && (
        <div className="space-y-3">
          {wallet.transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma transação ainda.</p>
                <p className="text-xs mt-1">Complete sessões de estudo para ganhar Psico!</p>
              </CardContent>
            </Card>
          ) : (
            wallet.transactions.map((tx) => (
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
                  {tx.type === "EARN" ? "+" : "-"}{tx.amount} Psico
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
