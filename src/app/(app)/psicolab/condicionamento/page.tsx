"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw, Info } from "lucide-react";

type RatState = "idle" | "walking" | "pressing" | "eating" | "fleeing" | "freezing";
type ScheduleType = "positive" | "negative" | "punishment" | "extinction";

interface SimState {
  frequency: number; // 0–100 (probability % per tick that rat approaches lever)
  ratState: RatState;
  ratX: number; // 0–1 (position within box)
  leverPressed: boolean;
  lightOn: boolean;
  foodInTray: boolean;
  shockActive: boolean;
  message: string;
  messageType: "info" | "success" | "warning" | "error";
  totalPresses: number;
  ticks: number;
  history: number[]; // frequency over last 30 ticks
}

interface Schedule {
  id: ScheduleType;
  label: string;
  emoji: string;
  color: string;
  activeColor: string;
  description: string;
  detail: string;
  effect: string;
}

const SCHEDULES: Schedule[] = [
  {
    id: "positive",
    label: "Reforço Positivo",
    emoji: "🍖",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    activeColor: "bg-emerald-500 text-white border-emerald-600",
    description: "Adicionar estímulo agradável após comportamento → aumenta frequência",
    detail:
      "Ao pressionar a alavanca, o rato recebe comida (estímulo apetitivo). O comportamento tende a aumentar e se manter.",
    effect: "+8% por reforço",
  },
  {
    id: "negative",
    label: "Reforço Negativo",
    emoji: "🔕",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    activeColor: "bg-blue-500 text-white border-blue-600",
    description: "Remover estímulo aversivo após comportamento → aumenta frequência",
    detail:
      "A luz (estímulo aversivo) fica acesa. Ao pressionar a alavanca, a luz se apaga. O comportamento aumenta para escapar do desconforto.",
    effect: "+6% por reforço",
  },
  {
    id: "punishment",
    label: "Punição",
    emoji: "⚡",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    activeColor: "bg-amber-500 text-white border-amber-600",
    description: "Adicionar estímulo aversivo após comportamento → diminui frequência",
    detail:
      "Ao pressionar a alavanca, o rato recebe um choque leve. O comportamento tende a diminuir, mas pode gerar ansiedade e comportamentos de fuga.",
    effect: "−10% por punição",
  },
  {
    id: "extinction",
    label: "Extinção",
    emoji: "🚫",
    color: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    activeColor: "bg-gray-500 text-white border-gray-600",
    description: "Sem consequências → frequência diminui gradualmente",
    detail:
      "A alavanca não produz mais nenhum resultado. Sem reforço, o comportamento vai diminuindo progressivamente até a extinção.",
    effect: "−3% por tick",
  },
];

const INITIAL_STATE: SimState = {
  frequency: 30,
  ratState: "idle",
  ratX: 0.2,
  leverPressed: false,
  lightOn: false,
  foodInTray: false,
  shockActive: false,
  message: 'Selecione um tipo de contingência e clique em "Iniciar" para começar a simulação.',
  messageType: "info",
  totalPresses: 0,
  ticks: 0,
  history: Array(30).fill(30),
};

function RatSVG({ x, state }: { x: number; state: RatState }) {
  const facing = state === "fleeing" ? -1 : 1; // -1 flips horizontally
  return (
    <g transform={`translate(${x}, 0) scale(${facing}, 1)`}>
      {/* Body */}
      <ellipse cx="0" cy="0" rx="20" ry="12" fill="#9CA3AF" />
      {/* Head */}
      <circle cx="17" cy="-5" r="10" fill="#9CA3AF" />
      {/* Ear */}
      <circle cx="21" cy="-13" r="5" fill="#F9A8D4" />
      <circle cx="21" cy="-13" r="3" fill="#FBCFE8" />
      {/* Eye */}
      <circle cx="23" cy="-7" r="2.5" fill="#1F2937" />
      <circle cx="24" cy="-8" r="0.8" fill="white" />
      {/* Nose */}
      <circle cx="27" cy="-4" r="1.5" fill="#F9A8D4" />
      {/* Tail */}
      <path d="M -20 3 Q -35 -5 -42 8" stroke="#D1D5DB" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <line x1="-8" y1="12" x2="-10" y2="22" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      <line x1="5" y1="12" x2="3" y2="22" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      {/* Front paws (raised when pressing) */}
      {state === "pressing" ? (
        <>
          <line x1="15" y1="2" x2="24" y2="-8" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="1" x2="20" y2="-5" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="10" y1="8" x2="8" y2="18" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="8" x2="18" y2="18" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {/* Shock effect */}
      {state === "freezing" && (
        <g>
          <text x="-5" y="-22" fontSize="14" textAnchor="middle">
            😵
          </text>
        </g>
      )}
    </g>
  );
}

export default function CondicionamentoPage() {
  const [schedule, setSchedule] = useState<ScheduleType>("positive");
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<SimState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const tick = useCallback(() => {
    setState((prev) => {
      const s = { ...prev };
      s.ticks++;

      const willPress = Math.random() * 100 < s.frequency;

      if (s.ratState === "idle" || s.ratState === "eating") {
        if (willPress) {
          // Rat walks toward lever
          s.ratState = "walking";
          s.ratX = Math.min(s.ratX + 0.15, 0.72);
          s.message = "O rato se aproxima da alavanca...";
          s.messageType = "info";
        } else {
          // Wander
          const wander = (Math.random() - 0.5) * 0.1;
          s.ratX = Math.max(0.08, Math.min(0.5, s.ratX + wander));
          s.ratState = "idle";
          s.foodInTray = false;
          s.shockActive = false;
        }
      } else if (s.ratState === "walking") {
        if (s.ratX < 0.72) {
          s.ratX = Math.min(s.ratX + 0.12, 0.72);
        } else {
          // Reached lever → press it
          s.ratState = "pressing";
          s.leverPressed = true;
          s.totalPresses++;

          // Apply schedule consequence
          if (schedule === "positive") {
            s.foodInTray = true;
            s.lightOn = false;
            s.frequency = Math.min(100, s.frequency + 8);
            s.message = "🍖 Alavanca pressionada → comida liberada! Frequência aumenta.";
            s.messageType = "success";
          } else if (schedule === "negative") {
            s.lightOn = false;
            s.frequency = Math.min(100, s.frequency + 6);
            s.message = "🔕 Alavanca pressionada → luz se apaga (alívio)! Frequência aumenta.";
            s.messageType = "success";
          } else if (schedule === "punishment") {
            s.shockActive = true;
            s.ratState = "freezing";
            s.frequency = Math.max(0, s.frequency - 10);
            s.message = "⚡ Alavanca pressionada → choque! Frequência diminui.";
            s.messageType = "error";
          } else {
            // extinction
            s.frequency = Math.max(0, s.frequency - 3);
            s.message = "🚫 Alavanca pressionada → nenhuma consequência. Frequência cai lentamente.";
            s.messageType = "warning";
          }
        }
      } else if (s.ratState === "pressing") {
        s.leverPressed = false;
        if (schedule === "positive" || schedule === "negative") {
          s.ratState = "eating";
          s.ratX = Math.max(0.1, s.ratX - 0.2);
        } else {
          s.ratState = "fleeing";
          s.ratX = Math.max(0.08, s.ratX - 0.3);
        }
      } else if (s.ratState === "fleeing") {
        s.ratX = Math.max(0.08, s.ratX - 0.1);
        s.shockActive = false;
        if (s.ratX <= 0.12) s.ratState = "idle";
      } else if (s.ratState === "freezing") {
        // Stay frozen for 1 tick
        s.ratState = "fleeing";
      } else if (s.ratState === "eating") {
        // Stay eating for 1 tick then idle
        s.ratState = "idle";
        s.foodInTray = false;
      }

      // Negative reinforcement: light is always on (aversive)
      if (schedule === "negative" && s.ratState === "idle") {
        s.lightOn = true;
      }

      // Natural decay for extinction
      if (schedule === "extinction" && s.ticks % 3 === 0) {
        s.frequency = Math.max(0, s.frequency - 1);
      }

      // Update history
      s.history = [...s.history.slice(1), Math.round(s.frequency)];

      return s;
    });
  }, [schedule]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 700);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  const handleStart = () => {
    setRunning((v) => !v);
  };

  const handleReset = () => {
    setRunning(false);
    setState({
      ...INITIAL_STATE,
      message:
        'Simulação reiniciada. Selecione uma contingência e clique em "Iniciar".',
    });
  };

  const handleScheduleChange = (s: ScheduleType) => {
    setSchedule(s);
    setRunning(false);
    setState((prev) => ({
      ...prev,
      lightOn: s === "negative",
      shockActive: false,
      leverPressed: false,
      message: `Contingência alterada para: ${SCHEDULES.find((x) => x.id === s)?.label}. Clique em Iniciar.`,
      messageType: "info",
    }));
  };

  const activeSchedule = SCHEDULES.find((s) => s.id === schedule)!;

  // Chart data
  const maxFreq = 100;
  const chartW = 300;
  const chartH = 80;
  const points = state.history
    .map((v, i) => {
      const x = (i / (state.history.length - 1)) * chartW;
      const y = chartH - (v / maxFreq) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  // Box dimensions in SVG space (0 0 500 280)
  const BOX = { x: 20, y: 20, w: 440, h: 220 };
  const ratPixelX = BOX.x + state.ratX * BOX.w;
  const ratPixelY = BOX.y + BOX.h - 22; // on floor

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/psicolab"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          PsicoLab
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          🐀 Lab de Condicionamento
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Caixa de Skinner
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Baseado no trabalho de B. F. Skinner. Aplique contingências e observe como o
          comportamento do rato muda ao longo do tempo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Skinner Box scene + chart */}
        <div className="space-y-4 lg:col-span-2">
          {/* Skinner Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <svg viewBox="0 0 480 260" className="w-full" style={{ maxHeight: 280 }}>
              {/* Box walls */}
              <rect
                x={BOX.x}
                y={BOX.y}
                width={BOX.w}
                height={BOX.h}
                fill="#FFFBEB"
                stroke="#92400E"
                strokeWidth="3"
                rx="4"
              />
              {/* Floor */}
              <rect
                x={BOX.x}
                y={BOX.y + BOX.h - 8}
                width={BOX.w}
                height="8"
                fill="#D97706"
                opacity="0.4"
                rx="2"
              />
              {/* Grid lines on walls (texture) */}
              {[60, 120, 180, 240, 300, 360, 400].map((xi) => (
                <line
                  key={xi}
                  x1={BOX.x + xi}
                  y1={BOX.y}
                  x2={BOX.x + xi}
                  y2={BOX.y + BOX.h}
                  stroke="#FDE68A"
                  strokeWidth="0.8"
                />
              ))}
              {[50, 100, 150].map((yi) => (
                <line
                  key={yi}
                  x1={BOX.x}
                  y1={BOX.y + yi}
                  x2={BOX.x + BOX.w}
                  y2={BOX.y + yi}
                  stroke="#FDE68A"
                  strokeWidth="0.8"
                />
              ))}

              {/* Light bulb (top center) */}
              <g>
                {/* Socket */}
                <rect x="220" y="14" width="20" height="10" fill="#6B7280" rx="2" />
                {/* Bulb */}
                <circle
                  cx="230"
                  cy="36"
                  r="14"
                  fill={state.lightOn ? "#FCD34D" : "#D1D5DB"}
                  stroke={state.lightOn ? "#D97706" : "#9CA3AF"}
                  strokeWidth="1.5"
                />
                {/* Glow when on */}
                {state.lightOn && (
                  <circle cx="230" cy="36" r="22" fill="#FCD34D" opacity="0.25">
                    <animate attributeName="r" values="18;26;18" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0.1;0.25" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Filament */}
                <path d="M 225 32 L 227 38 L 233 30 L 235 38" fill="none" stroke={state.lightOn ? "#92400E" : "#9CA3AF"} strokeWidth="1.5" />
                {/* Wire */}
                <line x1="230" y1="22" x2="230" y2="22" stroke="#6B7280" strokeWidth="1.5" />
              </g>

              {/* Lever (right side wall) */}
              <g>
                {/* Wall mount */}
                <rect x="405" y="100" width="25" height="60" fill="#92400E" rx="3" opacity="0.6" />
                {/* Lever arm */}
                <rect
                  x="400"
                  y={state.leverPressed ? "122" : "108"}
                  width="35"
                  height="10"
                  fill={state.leverPressed ? "#78350F" : "#B45309"}
                  rx="3"
                  style={{ transition: "y 0.15s ease" }}
                />
                {/* Lever label */}
                <text x="419" y="185" textAnchor="middle" fontSize="8" fill="#92400E" fontWeight="600">
                  Alavanca
                </text>
              </g>

              {/* Food dispenser (right side, floor level) */}
              <g>
                {/* Dispenser tube */}
                <rect x="390" y="155" width="18" height="45" fill="#6B7280" rx="4" />
                {/* Food tray */}
                <rect x="382" y="195" width="56" height="12" fill="#92400E" rx="3" />
                {/* Food pellet */}
                {state.foodInTray && (
                  <circle cx="410" cy="196" r="7" fill="#D97706">
                    <animate attributeName="cy" values="155;196" dur="0.3s" fill="freeze" />
                  </circle>
                )}
                {/* Food label */}
                <text x="410" y="220" textAnchor="middle" fontSize="7" fill="#6B7280" fontWeight="500">
                  Comida
                </text>
              </g>

              {/* Shock indicator */}
              {state.shockActive && (
                <g>
                  {[1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1={BOX.x + 80 + i * 30}
                      y1={BOX.y + BOX.h - 8}
                      x2={BOX.x + 65 + i * 30}
                      y2={BOX.y + BOX.h - 22}
                      stroke="#FCD34D"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.9"
                    >
                      <animate attributeName="opacity" values="1;0;1" dur="0.3s" repeatCount="3" />
                    </line>
                  ))}
                </g>
              )}

              {/* Rat */}
              <g transform={`translate(${ratPixelX}, ${ratPixelY})`}>
                <RatSVG x={0} state={state.ratState} />
              </g>

              {/* Stats overlay */}
              <g>
                <text x="28" y="42" fontSize="9" fill="#6B7280" fontWeight="600">
                  Pressões: {state.totalPresses}
                </text>
                <text x="28" y="55" fontSize="9" fill="#6B7280">
                  Ticks: {state.ticks}
                </text>
              </g>
            </svg>
          </div>

          {/* Frequency meter */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Frequência do Comportamento
              </span>
              <span
                className={`text-lg font-bold ${
                  state.frequency >= 70
                    ? "text-emerald-600"
                    : state.frequency >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {Math.round(state.frequency)}%
              </span>
            </div>

            {/* Frequency bar */}
            <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  state.frequency >= 70
                    ? "bg-emerald-500"
                    : state.frequency >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${state.frequency}%` }}
              />
            </div>

            {/* Line chart */}
            <svg viewBox={`0 0 ${chartW} ${chartH + 10}`} className="w-full" style={{ maxHeight: 90 }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((v) => {
                const y = chartH - (v / maxFreq) * chartH;
                return (
                  <g key={v}>
                    <line x1="0" y1={y} x2={chartW} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                    <text x="2" y={y - 2} fontSize="7" fill="#9CA3AF">
                      {v}%
                    </text>
                  </g>
                );
              })}
              {/* Line */}
              <polyline
                points={points}
                fill="none"
                stroke={
                  state.frequency >= 70
                    ? "#10B981"
                    : state.frequency >= 40
                      ? "#F59E0B"
                      : "#EF4444"
                }
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Area fill */}
              <polygon
                points={`0,${chartH} ${points} ${chartW},${chartH}`}
                fill={
                  state.frequency >= 70
                    ? "#10B981"
                    : state.frequency >= 40
                      ? "#F59E0B"
                      : "#EF4444"
                }
                opacity="0.1"
              />
            </svg>
            <p className="mt-1 text-center text-xs text-gray-400">
              Histórico dos últimos 30 ticks
            </p>
          </div>
        </div>

        {/* Right: Controls + explanation */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Contingência
            </h2>

            <div className="space-y-2">
              {SCHEDULES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleScheduleChange(s.id)}
                  disabled={running}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
                    schedule === s.id ? s.activeColor : s.color
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.emoji}</span>
                    <div>
                      <div className="font-semibold leading-tight">{s.label}</div>
                      <div className="text-xs opacity-75">{s.effect}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleStart}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                  running
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {running ? (
                  <>
                    <Pause className="h-4 w-4" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Iniciar
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Message */}
          <div
            className={`rounded-xl p-3 text-sm ${
              state.messageType === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                : state.messageType === "error"
                  ? "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                  : state.messageType === "warning"
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                    : "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
            }`}
          >
            {state.message}
          </div>

          {/* Explanation */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {activeSchedule.label}
              </h3>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              {activeSchedule.description}
            </p>
            <div className="rounded-lg bg-gray-50 p-2.5 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {activeSchedule.detail}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {state.totalPresses}
              </div>
              <div className="text-xs text-gray-400">Pressões totais</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-gray-900">
              <div
                className={`text-2xl font-bold ${
                  state.frequency >= 70
                    ? "text-emerald-600"
                    : state.frequency >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {Math.round(state.frequency)}%
              </div>
              <div className="text-xs text-gray-400">Probabilidade</div>
            </div>
          </div>

          {/* Skinner info */}
          <div className="rounded-xl bg-violet-50 p-3 text-xs text-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
            <strong>B. F. Skinner (1904–1990)</strong> — psicólogo behaviorista americano que
            desenvolveu o condicionamento operante. A Caixa de Skinner foi o aparato que permitiu
            estudar como as consequências moldam o comportamento.
          </div>
        </div>
      </div>
    </div>
  );
}
