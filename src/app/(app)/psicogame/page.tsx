"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REWARD_EXERCISE_CORRECT, REWARD_SESSION_COMPLETED, REWARD_DAILY_STREAK, REWARD_STREAK_MILESTONE, REWARD_SESSION_LONG_BONUS, STREAK_MILESTONE_INTERVAL, SESSION_LONG_THRESHOLD_SECONDS } from "@/lib/psico-constants";
import { useAuth } from "@/contexts/AuthContext";
import {
  Coins,
  Star,
  Flame,
  Award,
  Loader2,
  BookOpen,
  UserCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Wallet {
  balance: number;
}

interface Character {
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

const LEVEL_TITLES: Record<number, string> = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Estudante",
  4: "Dedicade",
  5: "Concentrade",
  6: "Consistente",
  7: "Disciplinade",
  8: "Experiente",
  9: "Avançade",
  10: "Mestre",
};

function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? `Nível ${level}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PsicoGamePage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/psicogame/stats", {
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet ?? null);
        setCharacter(data.character ?? null);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("[psicogame] stats error", res.status);
        }
        setLoadError(`Não foi possível carregar os dados (${res.status}).`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[psicogame] network error", err);
      }
      setLoadError("Não foi possível carregar os dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto mt-16 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
        </Button>
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

      {/* ── Character card ──────────────────────────────────────────────── */}
      {character && (
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
                      style={{ width: `${Math.min((character.xpInLevel / character.xpPerLevel) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Faltam {character.xpToNext} XP para o próximo nível
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet balance */}
            {wallet !== null && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {wallet.balance} Psiquê
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      {character && (
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
      )}

      {/* ── Exercise CTA ─────────────────────────────────────────────────── */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                Responder Exercícios
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-0.5">
                Responda exercícios aprovados e ganhe Psiquê para subir de nível!
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                +{REWARD_EXERCISE_CORRECT} Psiquê por acerto correto
              </p>
            </div>
            <Link
              href="/psicolab/exercicios"
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 h-10 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              Ir para exercícios
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── How to earn ──────────────────────────────────────────────────── */}
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
              icon: "⏱️",
              text: `Sessão longa (≥ ${Math.round(SESSION_LONG_THRESHOLD_SECONDS / 60)} min)`,
              value: `+${REWARD_SESSION_LONG_BONUS} Psiquê`,
            },
            {
              icon: "🔥",
              text: "Sequência diária (streak)",
              value: `+${REWARD_DAILY_STREAK} Psiquê/dia`,
            },
            {
              icon: "💎",
              text: `Bônus a cada ${STREAK_MILESTONE_INTERVAL} dias consecutivos`,
              value: `+${REWARD_STREAK_MILESTONE} Psiquê`,
            },
            {
              icon: "📚",
              text: "Leitura (a cada 5 páginas / ao finalizar)",
              value: "+5 / +15 Psiquê",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span>{item.icon}</span>
                {item.text}
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
