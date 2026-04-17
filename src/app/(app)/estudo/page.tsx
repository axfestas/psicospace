"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Plus,
  Play,
  CheckCircle,
  Clock,
  Target,
  Trash2,
  ChevronRight,
  RotateCcw,
  Brain,
  Coffee,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  usePomodoroTimer,
  PomodoroHeaderButton,
  PomodoroBreakOverlay,
  LONG_BREAK_EVERY,
} from "@/components/ui/pomodoro-timer";

// ── Types ────────────────────────────────────────────────────────────────────

interface Material {
  id: string;
  title: string;
  type: string;
}

interface MicroTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  materialId?: string | null;
  material?: Material | null;
  createdAt: string;
}

interface StudySession {
  id: string;
  phase: string;
  status: string;
  microTaskId: string;
  totalSeconds: number;
  pomodorosCompleted: number;
  recallAnswers: { id: string; question: string; answer: string }[];
  microTask: { id: string; title: string; description?: string };
}

interface RecallQuestion {
  question: string;
  answer: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RECALL_QUESTIONS_DEFAULT = [
  "O que você aprendeu nesta sessão?",
  "Qual foi o conceito mais importante estudado?",
  "Como você aplicaria o que aprendeu?",
];

const PHASE_LABELS: Record<string, string> = {
  selecting: "Selecionando microtarefa",
  pomodoro: "Sessão Pomodoro",
  content: "Consumindo conteúdo",
  recall: "Active Recall",
  break: "Pausa",
  done: "Concluído",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EstudoPage() {
  const [microTasks, setMicroTasks] = useState<MicroTask[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [phase, setPhase] = useState<"selecting" | "pomodoro" | "content" | "recall" | "break" | "done">("selecting");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Microtask form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Session timer (elapsed seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recall answers
  const [recallAnswers, setRecallAnswers] = useState<RecallQuestion[]>(
    RECALL_QUESTIONS_DEFAULT.map((q) => ({ question: q, answer: "" }))
  );

  // Pomodoro
  const pomodoro = usePomodoroTimer();

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadMicroTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/study/microtasks");
      if (res.ok) {
        const data = await res.json();
        setMicroTasks(data.microTasks || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Check for active session on mount
  const loadActiveSession = useCallback(async () => {
    try {
      const res = await fetch("/api/study/sessions");
      if (res.ok) {
        const data = await res.json();
        const active = (data.sessions || []).find(
          (s: StudySession) => s.status === "active"
        );
        if (active) {
          setActiveSession(active);
          setPhase(active.phase as typeof phase);
          setElapsedSeconds(active.totalSeconds);
          if (active.phase !== "selecting" && active.phase !== "done") {
            startTimer();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([loadMicroTasks(), loadActiveSession()]).finally(() =>
      setLoading(false)
    );
  }, [loadMicroTasks, loadActiveSession]);

  // ── Timer ───────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── When pomodoro work finishes, auto-advance to content phase ──────────────

  useEffect(() => {
    if (
      phase === "pomodoro" &&
      pomodoro.phase === "shortBreak" &&
      activeSession
    ) {
      handleAdvanceToContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.phase]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateMicroTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (newTitle.trim().length < 3) {
      setFormError("Microtarefa deve ter pelo menos 3 caracteres");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/study/microtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setShowForm(false);
        await loadMicroTasks();
      } else {
        const data = await res.json();
        setFormError(data.error || "Erro ao criar microtarefa");
      }
    } catch {
      setFormError("Erro ao criar microtarefa");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMicroTask = async (id: string) => {
    if (!confirm("Excluir esta microtarefa?")) return;
    await fetch(`/api/study/microtasks/${id}`, { method: "DELETE" });
    await loadMicroTasks();
  };

  const handleStartSession = async (task: MicroTask) => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/study/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ microTaskId: task.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setPhase("pomodoro");
        setElapsedSeconds(0);
        setRecallAnswers(RECALL_QUESTIONS_DEFAULT.map((q) => ({ question: q, answer: "" })));
        startTimer();
        // Pomodoro stays idle until user manually starts it
      } else {
        setError(data.error || "Erro ao iniciar sessão");
      }
    } catch {
      setError("Erro ao iniciar sessão");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceToContent = async () => {
    if (!activeSession) return;
    setPhase("content");
    setSaving(true);
    try {
      await fetch(`/api/study/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "content",
          totalSeconds: elapsedSeconds,
          pomodorosCompleted: pomodoro.completedPomodoros,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceToRecall = async () => {
    if (!activeSession) return;
    setPhase("recall");
    setSaving(true);
    try {
      await fetch(`/api/study/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "recall",
          totalSeconds: elapsedSeconds,
          pomodorosCompleted: pomodoro.completedPomodoros,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    const unanswered = recallAnswers.filter((r) => !r.answer.trim());
    if (unanswered.length > 0) {
      setError("Responda todas as perguntas de active recall antes de concluir.");
      return;
    }
    setError(null);
    setSaving(true);
    pomodoro.stop();
    stopTimer();

    try {
      const res = await fetch(`/api/study/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "done",
          totalSeconds: elapsedSeconds,
          pomodorosCompleted: pomodoro.completedPomodoros,
          recallAnswers: recallAnswers.filter((r) => r.answer.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setPhase("done");
        await loadMicroTasks();
      } else {
        setError(data.error || "Erro ao concluir sessão");
      }
    } catch {
      setError("Erro ao concluir sessão");
    } finally {
      setSaving(false);
    }
  };

  const handleAbandonSession = async () => {
    if (!activeSession) return;
    if (!confirm("Abandonar esta sessão? O progresso não será salvo.")) return;
    pomodoro.stop();
    stopTimer();
    try {
      await fetch(`/api/study/sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abandon: true }),
      });
    } catch (e) {
      console.error(e);
    }
    setActiveSession(null);
    setPhase("selecting");
    setElapsedSeconds(0);
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setPhase("selecting");
    setElapsedSeconds(0);
    setError(null);
    setRecallAnswers(RECALL_QUESTIONS_DEFAULT.map((q) => ({ question: q, answer: "" })));
    loadMicroTasks();
  };

  // ── Format helpers ──────────────────────────────────────────────────────────

  function formatSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  }

  const pendingTasks = microTasks.filter((t) => !t.completed);
  const completedTasks = microTasks.filter((t) => t.completed);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Estudo Guiado</h1>
          <p className="text-sm text-gray-500">
            {PHASE_LABELS[phase] ?? ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── PHASE: selecting ──────────────────────────────────────────────────── */}
      {phase === "selecting" && (
        <div className="space-y-4">
          {/* Add microtask form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Minhas Microtarefas</CardTitle>
                <Button
                  size="sm"
                  variant={showForm ? "secondary" : "default"}
                  onClick={() => setShowForm((v) => !v)}
                >
                  {showForm ? "Cancelar" : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Nova
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showForm && (
                <form onSubmit={handleCreateMicroTask} className="space-y-3 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Título da microtarefa *
                    </label>
                    <Input
                      placeholder="Ex: Ler capítulo 3 — Psicologia Social"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-gray-400">
                      Seja específico. Exemplo: &quot;Ler seção 2.3 do livro X&quot;, não &quot;Estudar psicologia&quot;.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Descrição (opcional)
                    </label>
                    <Input
                      placeholder="Descreva o objetivo desta tarefa..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  {formError && (
                    <p className="text-xs text-red-600">{formError}</p>
                  )}
                  <Button type="submit" size="sm" loading={saving}>
                    Criar microtarefa
                  </Button>
                </form>
              )}

              {/* Pending tasks list */}
              {pendingTasks.length === 0 && !showForm ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma microtarefa pendente.</p>
                  <p className="text-xs mt-1">Crie uma microtarefa para começar a estudar.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {pendingTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                        )}
                        {task.material && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <BookOpen className="h-3 w-3" />
                            {task.material.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleStartSession(task)}
                          loading={saving}
                          title="Iniciar sessão de estudo"
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Estudar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-gray-400 hover:text-red-500 h-8 w-8"
                          onClick={() => handleDeleteMicroTask(task.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  Concluídas ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {completedTasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-sm text-gray-400 line-through">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {task.title}
                    </li>
                  ))}
                  {completedTasks.length > 5 && (
                    <li className="text-xs text-gray-400">
                      + {completedTasks.length - 5} concluídas
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── PHASE: pomodoro ──────────────────────────────────────────────────── */}
      {phase === "pomodoro" && activeSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  Timer Pomodoro
                </CardTitle>
                <span className="text-xs text-gray-400">
                  Tempo total: {formatSeconds(elapsedSeconds)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Microtarefa ativa</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                  {activeSession.microTask.title}
                </p>
                {activeSession.microTask.description && (
                  <p className="text-xs text-gray-500 mt-1">{activeSession.microTask.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <PomodoroHeaderButton
                  phase={pomodoro.phase}
                  formattedTime={pomodoro.formattedTime}
                  completedPomodoros={pomodoro.completedPomodoros}
                  isActive={pomodoro.isActive}
                  isBreak={pomodoro.isBreak}
                  onStart={pomodoro.start}
                  onStop={pomodoro.stop}
                  onSkip={pomodoro.skipPhase}
                />
                <div className="flex gap-1">
                  {Array.from({ length: LONG_BREAK_EVERY }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-base ${i < pomodoro.completedPomodoros % LONG_BREAK_EVERY ? "opacity-100" : "opacity-20"}`}
                    >
                      🍅
                    </span>
                  ))}
                </div>
              </div>

              {/* Break overlay inside card */}
              {pomodoro.isBreak && (
                <div className="rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 p-4 flex flex-col items-center gap-2">
                  <Coffee className="h-6 w-6 text-teal-500" />
                  <p className="font-medium text-teal-700 dark:text-teal-300 text-sm">
                    {pomodoro.phase === "longBreak" ? "Pausa Longa" : "Pausa Curta"}
                  </p>
                  <p className="text-2xl font-mono font-bold text-teal-600">{pomodoro.formattedTime}</p>
                  <Button size="sm" variant="outline" onClick={pomodoro.skipPhase}>
                    Pular pausa e ir para conteúdo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Inicie o Pomodoro e foque na sua microtarefa. Após concluir, avance para o conteúdo.
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleAdvanceToContent}
                  disabled={saving}
                >
                  Ir para conteúdo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={handleAbandonSession}
                >
                  Abandonar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PHASE: content ──────────────────────────────────────────────────── */}
      {phase === "content" && activeSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  Consumo de Conteúdo
                </CardTitle>
                <span className="text-xs text-gray-400">
                  {formatSeconds(elapsedSeconds)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Microtarefa</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                  {activeSession.microTask.title}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  📖 Agora é hora de consumir o conteúdo:
                </p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Leia / assista / ouça o material da sua microtarefa</li>
                  <li>Faça anotações sobre os pontos principais</li>
                  <li>Não pule para o próximo conteúdo ainda</li>
                </ul>
              </div>

              {activeSession.microTask.description && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Objetivo</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activeSession.microTask.description}
                  </p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAdvanceToRecall}
                  disabled={saving}
                >
                  Concluí o conteúdo — Recall
                  <Brain className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={handleAbandonSession}
                >
                  Abandonar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PHASE: recall ──────────────────────────────────────────────────── */}
      {phase === "recall" && activeSession && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-500" />
                Active Recall
              </CardTitle>
              <p className="text-xs text-gray-500">
                Responda as perguntas abaixo antes de concluir. Isso consolida o aprendizado.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recallAnswers.map((qa, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {i + 1}. {qa.question}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Sua resposta..."
                    value={qa.answer}
                    onChange={(e) =>
                      setRecallAnswers((prev) =>
                        prev.map((r, idx) =>
                          idx === i ? { ...r, answer: e.target.value } : r
                        )
                      )
                    }
                  />
                </div>
              ))}

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleCompleteSession}
                  loading={saving}
                  disabled={recallAnswers.some((r) => !r.answer.trim())}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluir sessão
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={handleAbandonSession}
                >
                  Abandonar
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                * Todas as respostas são obrigatórias para concluir a sessão.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PHASE: done ──────────────────────────────────────────────────── */}
      {phase === "done" && activeSession && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <Award className="h-16 w-16 text-yellow-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Sessão concluída! 🎉
                </h2>
                <p className="text-sm text-gray-500">
                  Você ganhou Psico por esta sessão.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatSeconds(elapsedSeconds)}
                  </p>
                  <p className="text-xs text-gray-500">Tempo de estudo</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {pomodoro.completedPomodoros}
                  </p>
                  <p className="text-xs text-gray-500">Pomodoros</p>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                  ✅ Microtarefa concluída
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {activeSession.microTask.title}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleNewSession}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Nova sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pomodoro break overlay (full-page style) — only in pomodoro or content phase */}
      {(phase === "pomodoro") &&
        (pomodoro.phase === "shortBreak" || pomodoro.phase === "longBreak") && (
          <div className="fixed inset-0 z-50">
            <PomodoroBreakOverlay
              phase={pomodoro.phase}
              secondsLeft={pomodoro.secondsLeft}
              totalSeconds={pomodoro.totalSeconds}
              completedPomodoros={pomodoro.completedPomodoros}
              formattedTime={pomodoro.formattedTime}
              onSkip={() => {
                pomodoro.skipPhase();
                handleAdvanceToContent();
              }}
            />
          </div>
        )}
    </div>
  );
}
