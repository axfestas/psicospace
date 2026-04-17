"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
  material?: { id: string; title: string } | null;
  libraryItem?: { id: string; title: string } | null;
  options: ExerciseOption[];
}

interface Feedback {
  message: string;
  ok: boolean;
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

  const loadExercises = useCallback(async () => {
    const res = await fetch("/api/exercises?status=APPROVED&eligibleForReward=true");
    if (res.ok) {
      const data = await res.json();
      const approved = data.exercises || [];
      setExercises(approved);
      setSelectedExerciseId((prev) => prev ?? approved[0]?.id ?? null);
      setLoadError(null);
    } else {
      setLoadError("Não foi possível carregar os exercícios agora.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

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
      setSubmitting(false);
      return;
    }

    const validation = data.validation;
    if (validation.isCorrect && validation.awarded) {
      setFeedback({ message: `Resposta correta! +${validation.rewardAmount} Psiquê`, ok: true });
    } else if (validation.isCorrect) {
      setFeedback({ message: "Resposta correta, mas a recompensa já foi registrada antes.", ok: true });
    } else {
      setFeedback({ message: "Resposta incorreta. Revise e tente novamente.", ok: false });
    }

    resetForm();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercícios aprovados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[65vh] overflow-y-auto">
          {exercises.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum exercício aprovado disponível.</p>
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
                <Badge variant="default" className="text-[10px]">{exercise.type}</Badge>
                {(exercise.material || exercise.libraryItem) && (
                  <Badge variant="default" className="text-[10px]">
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
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedExercise.question}</p>

              {selectedExercise.type === "MULTIPLE_CHOICE" ? (
                <div className="space-y-2">
                  {selectedExercise.options.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
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
                  className={`rounded-lg border p-3 text-sm ${
                    feedback.ok
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <Button onClick={handleSubmit} loading={submitting}>Validar resposta</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
