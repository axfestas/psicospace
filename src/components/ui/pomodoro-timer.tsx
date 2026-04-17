"use client";

import { useCallback, useEffect, useState } from "react";
import { Timer, SkipForward, Square, Coffee } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const WORK_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;
export const LONG_BREAK_EVERY = 4;

// ── Types ──────────────────────────────────────────────────────────────────────

export type PomodoroPhase = "idle" | "work" | "shortBreak" | "longBreak";

export interface PomodoroState {
  phase: PomodoroPhase;
  secondsLeft: number;
  totalSeconds: number;
  completedPomodoros: number;
  isActive: boolean;
  isBreak: boolean;
  formattedTime: string;
  start: () => void;
  stop: () => void;
  skipPhase: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(seconds: number): string {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function phaseTotalSeconds(phase: PomodoroPhase): number {
  if (phase === "work") return WORK_SECONDS;
  if (phase === "shortBreak") return SHORT_BREAK_SECONDS;
  if (phase === "longBreak") return LONG_BREAK_SECONDS;
  return WORK_SECONDS;
}

function cyclePosition(completed: number): number {
  const pos = completed % LONG_BREAK_EVERY;
  return pos === 0 && completed > 0 ? LONG_BREAK_EVERY : pos;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePomodoroTimer(): PomodoroState {
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  // Decrement every second while active
  useEffect(() => {
    if (phase === "idle") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Advance phase when the countdown reaches zero
  useEffect(() => {
    if (secondsLeft !== 0 || phase === "idle") return;

    if (phase === "work") {
      const nextCompleted = completedPomodoros + 1;
      const isLong = nextCompleted % LONG_BREAK_EVERY === 0;
      const nextPhase: PomodoroPhase = isLong ? "longBreak" : "shortBreak";
      setCompletedPomodoros(nextCompleted);
      setPhase(nextPhase);
      setSecondsLeft(phaseTotalSeconds(nextPhase));
    } else {
      setPhase("work");
      setSecondsLeft(WORK_SECONDS);
    }
  }, [secondsLeft, phase, completedPomodoros]);

  const start = useCallback(() => {
    setCompletedPomodoros(0);
    setPhase("work");
    setSecondsLeft(WORK_SECONDS);
  }, []);

  const stop = useCallback(() => {
    setPhase("idle");
    setSecondsLeft(WORK_SECONDS);
    setCompletedPomodoros(0);
  }, []);

  const skipPhase = useCallback(() => {
    if (phase === "work") {
      const nextCompleted = completedPomodoros + 1;
      const isLong = nextCompleted % LONG_BREAK_EVERY === 0;
      const nextPhase: PomodoroPhase = isLong ? "longBreak" : "shortBreak";
      setCompletedPomodoros(nextCompleted);
      setPhase(nextPhase);
      setSecondsLeft(phaseTotalSeconds(nextPhase));
    } else if (phase !== "idle") {
      setPhase("work");
      setSecondsLeft(WORK_SECONDS);
    }
  }, [phase, completedPomodoros]);

  const isBreak = phase === "shortBreak" || phase === "longBreak";

  return {
    phase,
    secondsLeft,
    totalSeconds: phaseTotalSeconds(phase),
    completedPomodoros,
    isActive: phase !== "idle",
    isBreak,
    formattedTime: formatTime(secondsLeft),
    start,
    stop,
    skipPhase,
  };
}

// ── PomodoroHeaderButton ───────────────────────────────────────────────────────

interface PomodoroHeaderButtonProps {
  phase: PomodoroPhase;
  formattedTime: string;
  completedPomodoros: number;
  isActive: boolean;
  isBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
}

export function PomodoroHeaderButton({
  phase,
  formattedTime,
  completedPomodoros,
  isActive,
  isBreak,
  onStart,
  onStop,
  onSkip,
}: PomodoroHeaderButtonProps) {
  if (!isActive) {
    return (
      <button
        onClick={onStart}
        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded px-2 py-1 transition-colors"
        title="Iniciar Pomodoro (25 min foco / 5 min pausa)"
      >
        <Timer className="h-3.5 w-3.5" />
        Pomodoro
      </button>
    );
  }

  const isWork = phase === "work";
  const colorClass = isWork
    ? "text-red-400 border-red-700/60"
    : "text-teal-400 border-teal-700/60";

  const phaseLabel = isWork
    ? "Foco"
    : phase === "shortBreak"
      ? "Pausa"
      : "Pausa Longa";

  const tomatoes = cyclePosition(completedPomodoros);

  return (
    <div className={`flex items-center gap-1.5 text-xs border rounded px-2 py-1 ${colorClass}`}>
      {isBreak ? (
        <Coffee className="h-3.5 w-3.5" />
      ) : (
        <Timer className="h-3.5 w-3.5" />
      )}
      <span className="font-mono font-bold tracking-wide">{formattedTime}</span>
      <span className="text-gray-500">·</span>
      <span className="text-gray-300">{phaseLabel}</span>
      {tomatoes > 0 && (
        <>
          <span className="text-gray-500">·</span>
          <span
            className="text-xs leading-none"
            title={`${completedPomodoros} pomodoro(s) concluído(s)`}
          >
            {"🍅".repeat(tomatoes)}
          </span>
        </>
      )}
      <button
        onClick={onSkip}
        className="ml-1 text-gray-500 hover:text-white transition-colors"
        title="Pular fase"
      >
        <SkipForward className="h-3 w-3" />
      </button>
      <button
        onClick={onStop}
        className="text-gray-500 hover:text-white transition-colors"
        title="Parar Pomodoro"
      >
        <Square className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── PomodoroBreakOverlay ───────────────────────────────────────────────────────

interface PomodoroBreakOverlayProps {
  phase: "shortBreak" | "longBreak";
  secondsLeft: number;
  totalSeconds: number;
  completedPomodoros: number;
  formattedTime: string;
  onSkip: () => void;
}

export function PomodoroBreakOverlay({
  phase,
  secondsLeft,
  totalSeconds,
  completedPomodoros,
  formattedTime,
  onSkip,
}: PomodoroBreakOverlayProps) {
  const isLong = phase === "longBreak";
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  // SVG circular progress clock
  const RADIUS = 80;
  const circumference = 2 * Math.PI * RADIUS;
  const strokeDashoffset = circumference * (1 - progress);

  const tomatoes = cyclePosition(completedPomodoros);
  const accentColor = isLong ? "#34d399" : "#2dd4bf"; // green-400 / teal-400

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`Pausa Pomodoro — ${formattedTime} restante`}
    >
      <div className="flex flex-col items-center gap-5 p-8 max-w-sm text-center">
        {/* Phase label */}
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {isLong ? "🌿 Pausa Longa" : "☕ Pausa Curta"}
        </p>

        {/* Circular clock */}
        <div className="relative flex items-center justify-center select-none">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="-rotate-90"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke="#1f2937"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Centered countdown */}
          <div className="absolute flex flex-col items-center gap-1">
            <span className="text-4xl font-mono font-bold text-white tabular-nums">
              {formattedTime}
            </span>
            <span className="text-xs text-gray-400">restante</span>
          </div>
        </div>

        {/* Pomodoro cycle indicators */}
        <div className="flex gap-2" aria-label={`${tomatoes} de ${LONG_BREAK_EVERY} pomodoros concluídos`}>
          {Array.from({ length: LONG_BREAK_EVERY }).map((_, i) => (
            <span
              key={i}
              className={`text-xl transition-opacity duration-300 ${i < tomatoes ? "opacity-100" : "opacity-20"}`}
              aria-hidden="true"
            >
              🍅
            </span>
          ))}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-300 leading-relaxed">
          {isLong
            ? "Você completou 4 pomodoros! Levante-se, tome água e descanse bem."
            : "Respire fundo, afaste o olhar da tela e descanse por alguns minutos."}
        </p>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-full px-4 py-2 transition-colors mt-1"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Pular pausa
        </button>
      </div>
    </div>
  );
}
