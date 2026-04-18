"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RotateCcw, TrendingUp } from "lucide-react";

interface ExerciseOption {
  id: string;
  text: string;
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  question: string;
  explanation?: string | null;
  difficulty?: string | null;
  material?: { id: string; title: string } | null;
  libraryItem?: { id: string; title: string } | null;
  options: ExerciseOption[];
  reviewState?: {
    interval: number;
    repetitions: number;
    nextReviewAt: string;
    overdue: boolean;
  } | null;
}

interface Feedback {
  message: string;
  ok: boolean;
  explanation?: string | null;
}

interface DifficultyBucket {
  total: number;
  correct: number;
  accuracy: number;
}

interface LearningStats {
  total: number;
  correct: number;
  accuracy: number;
  overdueCount: number;
  unseenCount: number;
  dueForReview: number;
  byDifficulty: Record<string, DifficultyBucket>;
}

import { DIFFICULTY_LABELS } from "@/lib/pdf-extraction";

export default function PsicoLabExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/exercises/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats ?? null);
      }
    } catch {
      // Non-critical: stats panel is optional
    }
  }, []);

  const loadExercises = useCallback(async (forReview: boolean) => {
    setLoading(true);
    try {
      const endpoint = forReview
        ? "/api/exercises/review"
        : "/api/exercises?status=APPROVED&eligibleForReward=true";
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const list: Exercise[] = data.exercises || [];
        setExercises(list);
        setSelectedExerciseId((prev) => {
          // Keep current selection if still in list, else pick first
          if (prev && list.some((e) => e.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
        setLoadError(null);
      } else {
        setLoadError("Não foi possível carregar os exercícios agora.");
      }
    } catch (error) {
      console.error("[psicolab/exercicios] request_error", { error });
      setLoadError("Não foi possível carregar os exercícios agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises(reviewMode);
    loadStats();
  }, [loadExercises, loadStats, reviewMode]);

  const selectedExercise = useMemo(
    () => exercises.find((ex) => ex.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId]
  );

  const resetForm = () => {
    setTextAnswer("");
    setSelectedOptionId("");
  };

  const handleSubmit = async () => {
    if (!selectedExercise) return;

    if (selectedExercise.type === "MULTIPLE_CHOICE" && !selectedOptionId) {
      setFeedback({ message: "Selecione uma opção para enviar.", ok: false });
      return;
    }

    if (selectedExercise.type !== "MULTIPLE_CHOICE" && !textAnswer.trim()) {
      setFeedback({ message: "Informe uma resposta para enviar.", ok: false });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/exercises/${selectedExercise.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: selectedExercise.type === "MULTIPLE_CHOICE" ? undefined : textAnswer,
          optionId: selectedExercise.type === "MULTIPLE_CHOICE" ? selectedOptionId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ message: data.error || "Erro ao validar exercício", ok: false });
        return;
      }

      const validation = data.validation;
      if (validation.isCorrect && validation.awarded) {
        setFeedback({ message: `Resposta correta! +${validation.rewardAmount} Psiquê`, ok: true, explanation: selectedExercise.explanation });
      } else if (validation.isCorrect) {
        setFeedback({ message: "Resposta correta, mas a recompensa já foi registrada antes.", ok: true, explanation: selectedExercise.explanation });
      } else {
        setFeedback({ message: "Resposta incorreta. Revise e tente novamente.", ok: false, explanation: selectedExercise.explanation });
      }

      resetForm();
      // Refresh stats after submission
      loadStats();
    } catch (error) {
      console.error("[psicolab/exercicios] request_error", {
        action: "submitExercise",
        endpoint: `/api/exercises/${selectedExercise.id}/submit`,
        exerciseId: selectedExercise.id,
        type: selectedExercise.type,
        error,
      });
      setFeedback({ message: "Erro de conexão ao validar exercício.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* ── Header: modo + stats ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setReviewMode(false); resetForm(); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!reviewMode ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Todos os exercícios
          </button>
          <button
            onClick={() => { setReviewMode(true); resetForm(); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${reviewMode ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Revisão
            {stats && stats.dueForReview > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
                {stats.dueForReview > 99 ? "99+" : stats.dueForReview}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => setShowStats((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {showStats ? "Ocultar estatísticas" : "Ver estatísticas"}
        </button>
      </div>

      {/* ── Stats panel ───────────────────────────────────────────────────── */}
      {showStats && stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Memória de aprendizagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tentativas</p>
              </div>
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.accuracy}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Acurácia</p>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.overdueCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Vencidas</p>
              </div>
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.unseenCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Novas</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["FACIL", "MEDIO", "DIFICIL"] as const).map((d) => {
                const b = stats.byDifficulty[d];
                if (!b) return null;
                return (
                  <div key={d} className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-center">
                    <p className="text-xs font-medium text-gray-500">{DIFFICULTY_LABELS[d]}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{b.accuracy}%</p>
                    <p className="text-xs text-gray-400">{b.correct}/{b.total}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Review mode info banner ───────────────────────────────────────── */}
      {reviewMode && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
          🔁 <strong>Modo Revisão (SM-2):</strong> Exercícios ordenados por prioridade — vencidos primeiro, depois novos. Responder corretamente espaça a próxima revisão automaticamente.
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {reviewMode ? "Fila de revisão" : "Exercícios aprovados"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[65vh] overflow-y-auto">
            {exercises.length === 0 && (
              <p className="text-sm text-gray-500">
                {reviewMode
                  ? "Nenhum exercício pendente de revisão. Volte mais tarde! 🎉"
                  : "Nenhum exercício aprovado disponível."}
              </p>
            )}
            {loadError && <p className="text-sm text-red-500">{loadError}</p>}
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => {
                  setSelectedExerciseId(exercise.id);
                  resetForm();
                  setFeedback(null);
                }}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  selectedExerciseId === exercise.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <p className="font-medium text-sm">{exercise.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {exercise.difficulty && DIFFICULTY_LABELS[exercise.difficulty] && (
                    <Badge variant="default" className="text-xs">{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
                  )}
                  {exercise.reviewState?.overdue && (
                    <Badge variant="warning" className="text-xs">⏰ Vencido</Badge>
                  )}
                  {!exercise.reviewState && reviewMode && (
                    <Badge variant="default" className="text-xs">✨ Novo</Badge>
                  )}
                  {(exercise.material || exercise.libraryItem) && (
                    <Badge variant="default" className="text-xs">
                      {exercise.material?.title ?? exercise.libraryItem?.title}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedExercise?.title ?? "Selecione um exercício"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedExercise && (
              <p className="text-sm text-gray-500">Escolha um exercício para responder e validar recompensas.</p>
            )}

            {selectedExercise && (
              <>
                {selectedExercise.reviewState && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    🔁 Intervalo atual: {selectedExercise.reviewState.interval} dia(s) · Acertos seguidos: {selectedExercise.reviewState.repetitions}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedExercise.question}</p>

                {selectedExercise.type === "MULTIPLE_CHOICE" ? (
                  <div className="space-y-2">
                    {selectedExercise.options.map((option) => (
                      <label key={option.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <input
                          type="radio"
                          name="exercise-option"
                          value={option.id}
                          checked={selectedOptionId === option.id}
                          onChange={() => setSelectedOptionId(option.id)}
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Digite sua resposta"
                  />
                )}

                {feedback && (
                  <div
                    className={`rounded-lg border p-3 text-sm space-y-1 ${
                      feedback.ok
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                    }`}
                  >
                    <p className="font-medium">{feedback.message}</p>
                    {feedback.explanation && (
                      <p className="text-xs opacity-90 mt-1 border-t border-current/20 pt-1">
                        💡 {feedback.explanation}
                      </p>
                    )}
                  </div>
                )}

                <Button onClick={handleSubmit} loading={submitting}>Validar resposta</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

