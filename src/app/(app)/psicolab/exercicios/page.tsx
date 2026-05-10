"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Menu,
  Bookmark,
} from "lucide-react";

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

type DifficultyKey = "FACIL" | "MEDIO" | "DIFICIL";

const DIFFICULTY_KEYS: DifficultyKey[] = ["FACIL", "MEDIO", "DIFICIL"];
const PROGRESS_PER_REPETITION = 25;

const DIFFICULTY_STYLES: Record<DifficultyKey, string> = {
  FACIL: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  MEDIO: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  DIFICIL: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
};

function isDifficultyKey(value: string | null | undefined): value is DifficultyKey {
  return !!value && DIFFICULTY_KEYS.includes(value as DifficultyKey);
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyKey | "ALL">("ALL");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("psicolab_marked_review");
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

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
        : "/api/exercises?status=APPROVED";
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const list: Exercise[] = data.exercises || [];
        setExercises(list);
        setSelectedExerciseId((prev) => {
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

  useEffect(() => {
    window.localStorage.setItem("psicolab_marked_review", JSON.stringify(markedForReview));
  }, [markedForReview]);

  const resetForm = () => {
    setTextAnswer("");
    setSelectedOptionId("");
  };

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const difficultyOk =
        difficultyFilter === "ALL" ? true : exercise.difficulty === difficultyFilter;

      if (!difficultyOk) return false;

      if (!normalizedSearch) return true;

      const searchableText = [
        exercise.title,
        exercise.question,
        exercise.material?.title,
        exercise.libraryItem?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [difficultyFilter, exercises, searchTerm]);

  const groupedExercises = useMemo(() => {
    const grouped: Record<DifficultyKey, Exercise[]> = {
      FACIL: [],
      MEDIO: [],
      DIFICIL: [],
    };

    filteredExercises.forEach((exercise) => {
      const normalizedDifficulty = isDifficultyKey(exercise.difficulty)
        ? exercise.difficulty
        : "MEDIO";
      grouped[normalizedDifficulty].push(exercise);
    });

    return grouped;
  }, [filteredExercises]);

  const invalidDifficulties = useMemo(
    () =>
      exercises
        .filter((exercise) => exercise.difficulty && !isDifficultyKey(exercise.difficulty))
        .map((exercise) => ({ id: exercise.id, difficulty: exercise.difficulty })),
    [exercises]
  );

  useEffect(() => {
    if (!invalidDifficulties.length) return;
    console.warn("[psicolab/exercicios] invalid_difficulty_fallback", invalidDifficulties);
  }, [invalidDifficulties]);

  useEffect(() => {
    if (!filteredExercises.length) {
      setSelectedExerciseId(null);
      return;
    }

    setSelectedExerciseId((prev) => {
      if (prev && filteredExercises.some((exercise) => exercise.id === prev)) {
        return prev;
      }
      return filteredExercises[0].id;
    });
  }, [filteredExercises]);

  const selectedExercise = useMemo(
    () => filteredExercises.find((ex) => ex.id === selectedExerciseId) ?? null,
    [filteredExercises, selectedExerciseId]
  );

  const selectedIndex = useMemo(
    () => filteredExercises.findIndex((exercise) => exercise.id === selectedExerciseId),
    [filteredExercises, selectedExerciseId]
  );

  const completionCount = useMemo(
    () => exercises.filter((exercise) => (exercise.reviewState?.repetitions ?? 0) > 0).length,
    [exercises]
  );

  const globalProgress = useMemo(() => {
    if (!exercises.length) return 0;
    return Math.min(100, Math.round((completionCount / exercises.length) * 100));
  }, [completionCount, exercises.length]);

  const maxRepetitions = useMemo(() => {
    if (!exercises.length) return 0;
    return Math.max(0, ...exercises.map((exercise) => exercise.reviewState?.repetitions ?? 0));
  }, [exercises]);

  const questionNumberById = useMemo(
    () =>
      Object.fromEntries(
        filteredExercises.map((exercise, index) => [exercise.id, index + 1])
      ) as Record<string, number>,
    [filteredExercises]
  );

  const goToExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    resetForm();
    setFeedback(null);
    setMobileSidebarOpen(false);
  };

  const goToNeighborExercise = (direction: -1 | 1) => {
    if (!filteredExercises.length || selectedIndex < 0) return;
    const nextIndex = selectedIndex + direction;
    if (nextIndex < 0 || nextIndex >= filteredExercises.length) return;
    goToExercise(filteredExercises[nextIndex].id);
  };

  const toggleMarkedForReview = () => {
    if (!selectedExercise) return;

    setMarkedForReview((current) =>
      current.includes(selectedExercise.id)
        ? current.filter((id) => id !== selectedExercise.id)
        : [...current, selectedExercise.id]
    );
  };

  const getExerciseProgress = (exercise: Exercise) => {
    const reps = exercise.reviewState?.repetitions ?? 0;
    return Math.min(100, reps * PROGRESS_PER_REPETITION);
  };

  const getExerciseStatus = (exercise: Exercise) => {
    if (exercise.reviewState?.overdue) {
      return {
        label: "Vencido",
        icon: Clock3,
        iconClass: "text-amber-500",
      };
    }

    const repetitions = exercise.reviewState?.repetitions ?? 0;
    if (repetitions > 0) {
      return {
        label: "Em progresso",
        icon: CheckCircle2,
        iconClass: "text-emerald-500",
      };
    }

    return {
      label: "Novo",
      icon: Circle,
      iconClass: "text-blue-400",
    };
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
          optionId:
            selectedExercise.type === "MULTIPLE_CHOICE" ? selectedOptionId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ message: data.error || "Erro ao validar exercício", ok: false });
        return;
      }

      const validation = data.validation;
      if (validation.isCorrect) {
        setFeedback({
          message: "Resposta correta!",
          ok: true,
          explanation: selectedExercise.explanation,
        });
      } else {
        setFeedback({
          message: "Resposta incorreta. Revise e tente novamente.",
          ok: false,
          explanation: selectedExercise.explanation,
        });
      }

      resetForm();
      loadStats();
      loadExercises(reviewMode);
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
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
      <div className="space-y-4 border-b border-gray-200/80 p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lista de exercícios</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filteredExercises.length} resultados</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Fechar lista"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar exercício"
            className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-9 text-sm dark:border-gray-700 dark:bg-gray-800"
            aria-label="Buscar exercício"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDifficultyFilter("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              difficultyFilter === "ALL"
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            Todos
          </button>
          {DIFFICULTY_KEYS.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => setDifficultyFilter(difficulty)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                difficultyFilter === difficulty
                  ? DIFFICULTY_STYLES[difficulty]
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              {DIFFICULTY_LABELS[difficulty]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/80">
        {loadError && <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-300">{loadError}</p>}

        {filteredExercises.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {reviewMode
              ? "Nenhum exercício pendente de revisão no filtro atual."
              : "Nenhum exercício encontrado para os filtros selecionados."}
          </p>
        )}

        <div className="space-y-4">
          {DIFFICULTY_KEYS.map((difficulty) => {
            const bucket = groupedExercises[difficulty];
            if (!bucket.length) return null;

            return (
              <section key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {DIFFICULTY_LABELS[difficulty]}
                  </h3>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{bucket.length}</span>
                </div>

                <div className="space-y-2">
                  {bucket.map((exercise) => {
                    const status = getExerciseStatus(exercise);
                    const StatusIcon = status.icon;
                    const isSelected = selectedExerciseId === exercise.id;
                    const itemProgress = getExerciseProgress(exercise);
                    const isMarked = markedForReview.includes(exercise.id);

                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => goToExercise(exercise.id)}
                        className={cn(
                          "group w-full rounded-xl border bg-white p-3 text-left transition-all duration-200",
                          "hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/20",
                          isSelected
                            ? "border-blue-300 bg-blue-50/70 shadow-sm ring-1 ring-blue-100 dark:border-blue-700 dark:bg-blue-900/25 dark:ring-blue-900"
                            : "border-gray-200/80 dark:border-gray-800",
                          "relative overflow-hidden"
                        )}
                        aria-current={isSelected}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-2 left-0 w-1 rounded-r-full bg-transparent transition",
                            isSelected && "bg-blue-500"
                          )}
                        />

                        <div className="ml-2 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                              {exercise.title}
                            </p>
                            <Badge className={cn("border text-[10px]", DIFFICULTY_STYLES[difficulty])}>
                              Q{questionNumberById[exercise.id] ?? "—"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <StatusIcon className={cn("h-3.5 w-3.5", status.iconClass)} />
                              {status.label}
                            </span>
                            {isMarked && (
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300">
                                <Bookmark className="h-3.5 w-3.5" /> Revisar
                              </span>
                            )}
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${itemProgress}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="-mx-4 -mt-4 min-h-full bg-gray-100/60 px-4 pb-6 pt-4 lg:-mx-6 lg:-mt-6 lg:px-6 lg:pb-8 lg:pt-6 dark:bg-gray-950/60">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 lg:gap-6">
        <section className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">PsicoLab</p>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fluxo de exercícios</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Foco na questão atual com navegação rápida e progresso visual.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setReviewMode(false);
                  resetForm();
                  setFeedback(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  !reviewMode
                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Todos os exercícios
              </button>

              <button
                onClick={() => {
                  setReviewMode(true);
                  resetForm();
                  setFeedback(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  reviewMode
                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Revisão
                {stats && stats.dueForReview > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {stats.dueForReview > 99 ? "99+" : stats.dueForReview}
                  </span>
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-gray-300 px-3 lg:hidden dark:border-gray-700"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="mr-1 h-3.5 w-3.5" /> Exercícios
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Progresso geral</p>
              <p className="mt-1 text-lg font-semibold text-blue-700 dark:text-blue-300">{globalProgress}%</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${globalProgress}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">Concluídos</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{completionCount}/{exercises.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Exercícios com progresso</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-900/20">
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Taxa de acerto</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-300">{stats?.accuracy ?? 0}%</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">Baseado nas tentativas registradas</p>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900 dark:bg-violet-900/20">
              <p className="text-xs text-violet-700/80 dark:text-violet-300/80">Streak / ritmo</p>
              <p className="mt-1 text-lg font-semibold text-violet-700 dark:text-violet-300">{maxRepetitions} rep.</p>
              <p className="text-xs text-violet-700/70 dark:text-violet-300/70">{stats?.dueForReview ?? 0} em revisão no momento</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
          <aside className="hidden lg:block lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">{sidebarContent}</aside>

          <div className="space-y-4">
            <Card className="border-gray-200/80 bg-white/95 shadow-sm dark:border-gray-800 dark:bg-gray-900/95">
              <CardHeader className="space-y-5 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PsicoLab <span className="mx-1">/</span> Exercícios
                      {selectedExercise && selectedIndex >= 0 && (
                        <>
                          <span className="mx-1">/</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200">Questão {selectedIndex + 1}</span>
                        </>
                      )}
                    </p>
                    <CardTitle className="text-2xl leading-tight tracking-tight">
                      {selectedExercise?.title ?? "Selecione um exercício"}
                    </CardTitle>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => goToNeighborExercise(-1)}
                      disabled={selectedIndex <= 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => goToNeighborExercise(1)}
                      disabled={selectedIndex < 0 || selectedIndex >= filteredExercises.length - 1}
                    >
                      Próxima <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedExercise && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedExercise.difficulty &&
                      isDifficultyKey(selectedExercise.difficulty) && (
                        <Badge className={cn("border", DIFFICULTY_STYLES[selectedExercise.difficulty])}>
                          {DIFFICULTY_LABELS[selectedExercise.difficulty]}
                        </Badge>
                      )}
                    {(selectedExercise.material || selectedExercise.libraryItem) && (
                      <Badge variant="default" className="border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {selectedExercise.material?.title ?? selectedExercise.libraryItem?.title}
                      </Badge>
                    )}
                    {selectedExercise.reviewState && (
                      <Badge variant="warning" className="inline-flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Intervalo: {selectedExercise.reviewState.interval} dia(s)
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {!selectedExercise && (
                  <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Escolha um exercício na barra lateral para começar.
                  </p>
                )}

                {selectedExercise && (
                  <div className="mx-auto w-full max-w-3xl space-y-6">
                    <article className="space-y-3 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/40">
                      <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Enunciado</p>
                      <p className="text-base leading-7 text-gray-800 dark:text-gray-100">
                        {selectedExercise.question}
                      </p>
                    </article>

                    {selectedExercise.type === "MULTIPLE_CHOICE" ? (
                      <div className="space-y-3">
                        {selectedExercise.options.map((option, optionIndex) => {
                          const isChecked = selectedOptionId === option.id;

                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-all duration-200",
                                isChecked
                                  ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-100 dark:border-blue-700 dark:bg-blue-900/25 dark:ring-blue-900"
                                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                                  isChecked
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-gray-300 text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500 dark:border-gray-700 dark:text-gray-400"
                                )}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </span>

                              <input
                                type="radio"
                                name="exercise-option"
                                value={option.id}
                                checked={isChecked}
                                onChange={() => setSelectedOptionId(option.id)}
                                className="sr-only"
                              />

                              <span className="leading-6 text-gray-700 dark:text-gray-200">{option.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <Input
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Digite sua resposta"
                        className="h-12 rounded-xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                      />
                    )}

                    {feedback && (
                      <div
                        className={cn(
                          "rounded-xl border p-4 text-sm",
                          feedback.ok
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                        )}
                      >
                        <p className="font-medium">{feedback.message}</p>
                        {feedback.explanation && (
                          <p className="mt-2 border-t border-current/20 pt-2 text-xs leading-5">
                            💡 {feedback.explanation}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSubmit}
                        loading={submitting}
                        className="h-10 rounded-xl px-5 shadow-sm transition hover:shadow"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Validar resposta
                      </Button>

                      <Button
                        variant="outline"
                        onClick={toggleMarkedForReview}
                        className="h-10 rounded-xl border-gray-300 dark:border-gray-700"
                      >
                        <Bookmark className="mr-2 h-4 w-4" />
                        {selectedExercise && markedForReview.includes(selectedExercise.id)
                          ? "Remover revisão"
                          : "Marcar para revisão"}
                      </Button>

                      <div className="flex items-center gap-2 sm:hidden">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToNeighborExercise(-1)}
                          disabled={selectedIndex <= 0}
                          className="rounded-lg"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToNeighborExercise(1)}
                          disabled={selectedIndex < 0 || selectedIndex >= filteredExercises.length - 1}
                          className="rounded-lg"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Exercícios em revisão</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.dueForReview ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Novos</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.unseenCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">Vencidos</p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-amber-600 dark:text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                  {stats?.overdueCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm p-3 transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </div>
  );
}
