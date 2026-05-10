"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/pdf-extraction";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
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

interface LearningStats {
  dueForReview: number;
}

type DifficultyKey = "FACIL" | "MEDIO" | "DIFICIL";

const DIFFICULTY_STYLES: Record<DifficultyKey, string> = {
  FACIL: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  MEDIO: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  DIFICIL: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
};
const ERROR_MSG_NO_OPTION_SELECTED = "Selecione uma alternativa para enviar.";
const ERROR_MSG_NO_TEXT_ANSWER = "Digite uma resposta para enviar.";

function isDifficultyKey(value: string | null | undefined): value is DifficultyKey {
  return value === "FACIL" || value === "MEDIO" || value === "DIFICIL";
}

function getSourceLabel(exercise: Exercise | null): string {
  if (!exercise) return "PsicoLab";
  return exercise.material?.title || exercise.libraryItem?.title || "PsicoLab";
}

export default function PsicoLabExercisesPage() {
  const shouldReduceMotion = useReducedMotion();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [sessionResultById, setSessionResultById] = useState<Record<string, { answered: boolean; correct: boolean }>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("psicolab_marked_review");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
    } catch {
      return [];
    }
  });

  const resetForm = () => {
    setTextAnswer("");
    setSelectedOptionId("");
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/exercises/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({ dueForReview: data?.stats?.dueForReview ?? 0 });
      }
    } catch {
      // Non-critical section
    }
  }, []);

  const loadExercises = useCallback(async (forReview: boolean) => {
    setLoading(true);
    try {
      const endpoint = forReview ? "/api/exercises/review" : "/api/exercises?status=APPROVED";
      const res = await fetch(endpoint);
      if (!res.ok) {
        setLoadError("Não foi possível carregar os exercícios agora.");
        return;
      }

      const data = await res.json();
      const list: Exercise[] = data.exercises || [];
      setExercises(list);
      setSelectedExerciseId((prev) => {
        if (prev && list.some((exercise) => exercise.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
      setLoadError(null);
    } catch {
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

  const selectedIndex = useMemo(
    () => exercises.findIndex((exercise) => exercise.id === selectedExerciseId),
    [exercises, selectedExerciseId]
  );

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [exercises, selectedExerciseId]
  );

  const answeredCount = useMemo(
    () => Object.values(sessionResultById).filter((result) => result.answered).length,
    [sessionResultById]
  );

  const sessionProgress = exercises.length ? Math.round((answeredCount / exercises.length) * 100) : 0;
  const dueReviewCount = stats?.dueForReview ?? 0;

  const goToExercise = (exerciseId: string, nextDirection?: 1 | -1) => {
    if (nextDirection) setDirection(nextDirection);
    setSelectedExerciseId(exerciseId);
    setFeedback(null);
    resetForm();
  };

  const goToNeighbor = (offset: -1 | 1) => {
    if (selectedIndex < 0) return;
    const nextIndex = selectedIndex + offset;
    if (nextIndex < 0 || nextIndex >= exercises.length) return;
    goToExercise(exercises[nextIndex].id, offset);
  };

  const handleSubmit = async () => {
    if (!selectedExercise) return;

    if (selectedExercise.type === "MULTIPLE_CHOICE" && !selectedOptionId) {
      setFeedback({ message: ERROR_MSG_NO_OPTION_SELECTED, ok: false });
      return;
    }

    if (selectedExercise.type !== "MULTIPLE_CHOICE" && !textAnswer.trim()) {
      setFeedback({ message: ERROR_MSG_NO_TEXT_ANSWER, ok: false });
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
        setFeedback({ message: data.error || "Erro ao validar exercício.", ok: false });
        return;
      }

      const isCorrect = !!data?.validation?.isCorrect;
      setFeedback({
        message: isCorrect ? "Resposta correta!" : "Resposta incorreta. Revise e tente novamente.",
        ok: isCorrect,
        explanation: selectedExercise.explanation,
      });

      setSessionResultById((current) => ({
        ...current,
        [selectedExercise.id]: { answered: true, correct: isCorrect },
      }));

      resetForm();
      loadStats();
      loadExercises(reviewMode);
    } catch {
      setFeedback({ message: "Erro de conexão ao validar exercício.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMarkedForReview = () => {
    if (!selectedExercise) return;
    setMarkedForReview((current) =>
      current.includes(selectedExercise.id)
        ? current.filter((id) => id !== selectedExercise.id)
        : [...current, selectedExercise.id]
    );
  };

  const getQuestionStatus = (exercise: Exercise) => {
    if (markedForReview.includes(exercise.id)) return "review" as const;

    const session = sessionResultById[exercise.id];
    if (session?.answered) return session.correct ? ("correct" as const) : ("wrong" as const);

    if ((exercise.reviewState?.repetitions ?? 0) > 0) return "answered" as const;
    return "idle" as const;
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full max-w-5xl space-y-5 px-1 pb-6 pt-1 sm:px-2">
      <header className="space-y-3 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/85">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Voltar para PsicoLab">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{getSourceLabel(selectedExercise)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{answeredCount}/{exercises.length} questões respondidas</p>
            </div>
          </div>

          <Button
            size="sm"
            variant={reviewMode ? "default" : "outline"}
            onClick={() => {
              setReviewMode((current) => !current);
              setFeedback(null);
              resetForm();
            }}
            className={cn("h-9 rounded-xl px-3", reviewMode && "bg-amber-500 hover:bg-amber-600")}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Revisão
            {dueReviewCount > 0 && (
              <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {dueReviewCount > 99 ? "99+" : dueReviewCount}
              </span>
            )}
          </Button>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            initial={false}
            animate={{ width: `${sessionProgress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2 py-1">
            {exercises.map((exercise, index) => {
              const isActive = selectedExerciseId === exercise.id;
              const status = getQuestionStatus(exercise);

              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => goToExercise(exercise.id, index > selectedIndex ? 1 : -1)}
                  className={cn(
                    "relative flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition-all",
                    isActive
                      ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  )}
                >
                  {index + 1}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 h-1.5 w-1.5 rounded-full",
                      status === "correct" && "bg-emerald-500",
                      status === "wrong" && "bg-rose-500",
                      status === "review" && "bg-amber-500",
                      status === "answered" && "bg-blue-400",
                      status === "idle" && "bg-gray-300 dark:bg-gray-600"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {loadError}
        </div>
      )}

      {!selectedExercise && !loadError && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400">
          Nenhum exercício disponível para este modo no momento.
        </div>
      )}

      {selectedExercise && (
        <div className="mx-auto w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={selectedExercise.id}
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 48 : -48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -48 : 48 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) < 80) return;
                if (info.offset.x < 0) goToNeighbor(1);
                if (info.offset.x > 0) goToNeighbor(-1);
              }}
              className="space-y-4 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Questão {selectedIndex + 1} de {exercises.length}</p>
                  <h1 className="line-clamp-2 text-lg font-semibold leading-tight text-gray-900 sm:text-2xl dark:text-gray-100">{selectedExercise.title}</h1>
                </div>
                {selectedExercise.difficulty && isDifficultyKey(selectedExercise.difficulty) && (
                  <Badge className={cn("shrink-0 border", DIFFICULTY_STYLES[selectedExercise.difficulty])}>
                    {DIFFICULTY_LABELS[selectedExercise.difficulty]}
                  </Badge>
                )}
              </div>

              <article className="rounded-2xl bg-gray-50 px-4 py-5 text-[15px] leading-7 text-gray-800 dark:bg-gray-950/50 dark:text-gray-100 sm:text-base">
                {selectedExercise.question}
              </article>

              {selectedExercise.type === "MULTIPLE_CHOICE" ? (
                <div className="space-y-3">
                  {selectedExercise.options.map((option, optionIndex) => {
                    const selected = selectedOptionId === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        animate={selected ? { scale: 1.02 } : { scale: 1 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setSelectedOptionId(option.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
                          selected
                            ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100/70 ring-1 ring-blue-200 dark:border-blue-700 dark:bg-blue-900/30 dark:shadow-none dark:ring-blue-900"
                            : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
                        )}
                      >
                        <span className={cn(
                          "mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          selected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300"
                        )}>
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="text-sm leading-6 text-gray-800 sm:text-base dark:text-gray-100">{option.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  value={textAnswer}
                  onChange={(event) => setTextAnswer(event.target.value)}
                  placeholder="Digite sua resposta"
                  className="h-12 rounded-2xl border-gray-200 px-4 text-base dark:border-gray-700 dark:bg-gray-900"
                />
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={cn(
                      "rounded-2xl border p-4 text-sm",
                      feedback.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300"
                    )}
                  >
                    <p className="inline-flex items-center gap-2 font-medium">
                      {feedback.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {feedback.message}
                    </p>
                    {feedback.explanation && (
                      <p className="mt-2 border-t border-current/20 pt-2 leading-6">💡 {feedback.explanation}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={handleSubmit} loading={submitting} className="h-11 rounded-xl px-5 text-sm shadow-sm transition hover:shadow">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Validar resposta
                </Button>

                <Button variant="outline" onClick={toggleMarkedForReview} className="h-11 rounded-xl border-gray-300 px-4 dark:border-gray-700">
                  <Bookmark className="mr-2 h-4 w-4" />
                  {markedForReview.includes(selectedExercise.id) ? "Remover revisão" : "Marcar revisão"}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToNeighbor(-1)}
                    disabled={selectedIndex <= 0}
                    className="h-10 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToNeighbor(1)}
                    disabled={selectedIndex < 0 || selectedIndex >= exercises.length - 1}
                    className="h-10 rounded-xl"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
