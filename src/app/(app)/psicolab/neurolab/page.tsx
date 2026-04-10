"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Info } from "lucide-react";

interface BrainRegion {
  id: string;
  name: string;
  lobe: string;
  color: string;
  activeColor: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  isSubcortical?: boolean;
  activations: string[];
  description: string;
  functions: string[];
  examples: string[];
}

interface StimulusPreset {
  id: string;
  label: string;
  emoji: string;
  regions: string[];
  description: string;
}

const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "prefrontal",
    name: "Córtex Pré-frontal",
    lobe: "Lobo Frontal",
    color: "#93C5FD",
    activeColor: "#2563EB",
    cx: 148,
    cy: 112,
    rx: 72,
    ry: 62,
    activations: ["stress", "learning", "social", "decision"],
    description:
      "Centro executivo do cérebro. Coordena pensamentos, ações e comportamentos complexos em relação aos objetivos sociais.",
    functions: [
      "Planejamento e organização",
      "Controle de impulsos",
      "Tomada de decisão racional",
      "Memória de trabalho",
      "Regulação emocional",
    ],
    examples: [
      "Resistir ao impulso de comer algo não saudável",
      "Planejar os passos de um projeto complexo",
      "Controlar a raiva em conflito interpessoal",
    ],
  },
  {
    id: "motor",
    name: "Córtex Motor",
    lobe: "Lobo Frontal",
    color: "#A5B4FC",
    activeColor: "#4338CA",
    cx: 242,
    cy: 70,
    rx: 55,
    ry: 48,
    activations: ["movement", "learning"],
    description:
      "Controla todos os movimentos voluntários do corpo. Cada área corresponde a uma parte do corpo (homúnculo motor).",
    functions: [
      "Movimentos voluntários",
      "Coordenação motora fina",
      "Execução de habilidades motoras aprendidas",
    ],
    examples: [
      "Mover o braço para pegar um objeto",
      "Escrever à mão com precisão",
      "Tocar um instrumento musical",
    ],
  },
  {
    id: "parietal",
    name: "Lobo Parietal",
    lobe: "Lobo Parietal",
    color: "#6EE7B7",
    activeColor: "#059669",
    cx: 318,
    cy: 80,
    rx: 82,
    ry: 60,
    activations: ["sensory", "stress"],
    description:
      "Integra informações sensoriais do corpo (tato, temperatura, dor) e processa percepção espacial.",
    functions: [
      "Processamento sensorial (tato, dor, temperatura)",
      "Percepção espacial e orientação",
      "Integração multissensorial",
      "Consciência do esquema corporal",
    ],
    examples: [
      "Sentir a textura de um objeto",
      "Saber a posição do seu corpo no espaço",
      "Navegação e orientação geográfica",
    ],
  },
  {
    id: "temporal",
    name: "Lobo Temporal",
    lobe: "Lobo Temporal",
    color: "#FCD34D",
    activeColor: "#D97706",
    cx: 265,
    cy: 205,
    rx: 105,
    ry: 52,
    activations: ["social", "learning", "fear"],
    description:
      "Processa sons e linguagem, essencial para memória de longo prazo e reconhecimento de rostos e objetos.",
    functions: [
      "Processamento auditivo",
      "Compreensão da linguagem (área de Wernicke)",
      "Memória de longo prazo",
      "Reconhecimento de rostos e objetos",
    ],
    examples: [
      "Entender o que alguém está dizendo",
      "Reconhecer uma música conhecida",
      "Lembrar o rosto de uma pessoa",
    ],
  },
  {
    id: "occipital",
    name: "Lobo Occipital",
    lobe: "Lobo Occipital",
    color: "#FCA5A5",
    activeColor: "#DC2626",
    cx: 418,
    cy: 148,
    rx: 58,
    ry: 72,
    activations: ["sensory"],
    description:
      "Principal área de processamento visual. Interpreta informações dos olhos para criar nossa percepção visual do mundo.",
    functions: [
      "Processamento visual primário",
      "Reconhecimento de cores e formas",
      "Detecção de movimento visual",
      "Percepção de profundidade",
    ],
    examples: [
      "Ver e interpretar cores",
      "Reconhecer objetos visualmente",
      "Perceber o movimento de objetos",
    ],
  },
  {
    id: "amygdala",
    name: "Amígdala",
    lobe: "Estrutura Subcortical",
    color: "#F9A8D4",
    activeColor: "#DB2777",
    cx: 255,
    cy: 180,
    rx: 22,
    ry: 18,
    isSubcortical: true,
    activations: ["fear", "stress", "social"],
    description:
      "Centro emocional do cérebro, especialmente ligado ao medo e ansiedade. Ativa a resposta de luta-ou-fuga.",
    functions: [
      "Processamento do medo e ansiedade",
      "Resposta emocional automática",
      "Memória emocional",
      "Detecção de ameaças",
    ],
    examples: [
      "Sentir medo ao ver uma cobra",
      "Ansiedade antes de uma apresentação",
      "Reação de alerta a um barulho súbito",
    ],
  },
  {
    id: "hippocampus",
    name: "Hipocampo",
    lobe: "Estrutura Subcortical",
    color: "#C4B5FD",
    activeColor: "#7C3AED",
    cx: 292,
    cy: 195,
    rx: 28,
    ry: 16,
    isSubcortical: true,
    activations: ["learning", "stress"],
    description:
      "Fundamental para a formação de novas memórias. Consolida memórias de curto prazo em memórias de longo prazo e é crucial para aprendizado.",
    functions: [
      "Formação de novas memórias",
      "Consolidação da memória",
      "Navegação espacial (mapa cognitivo)",
      "Contextualização de memórias",
    ],
    examples: [
      "Aprender o caminho para um lugar novo",
      "Lembrar o que você estudou ontem",
      "Associar um cheiro a uma memória afetiva",
    ],
  },
  {
    id: "cerebellum",
    name: "Cerebelo",
    lobe: "Cerebelo",
    color: "#67E8F9",
    activeColor: "#0891B2",
    cx: 398,
    cy: 255,
    rx: 58,
    ry: 42,
    activations: ["movement"],
    description:
      "Coordena movimentos, equilíbrio e postura. Recebe informações dos sentidos e ajusta o movimento com precisão.",
    functions: [
      "Coordenação motora fina",
      "Equilíbrio e postura",
      "Refinamento e suavização de movimentos",
      "Aprendizado de habilidades motoras",
    ],
    examples: [
      "Caminhar sem cair",
      "Coordenar movimentos ao dançar",
      "Ajustar postura automaticamente",
    ],
  },
];

const STIMULUS_PRESETS: StimulusPreset[] = [
  {
    id: "fear",
    label: "Medo",
    emoji: "😨",
    regions: ["amygdala", "prefrontal", "temporal"],
    description: "Situação de ameaça ativa amígdala (alarme) e córtex pré-frontal (avaliação).",
  },
  {
    id: "learning",
    label: "Aprendizado",
    emoji: "📚",
    regions: ["hippocampus", "prefrontal", "temporal", "motor"],
    description: "Aprender algo novo envolve hipocampo (memória), pré-frontal (atenção) e temporal (linguagem).",
  },
  {
    id: "stress",
    label: "Estresse",
    emoji: "😰",
    regions: ["amygdala", "hippocampus", "prefrontal", "parietal"],
    description: "Estresse crônico hiperativa amígdala e pode prejudicar hipocampo e pré-frontal.",
  },
  {
    id: "movement",
    label: "Movimento",
    emoji: "🏃",
    regions: ["motor", "cerebellum", "parietal"],
    description: "Movimentos voluntários recrutam córtex motor, cerebelo (coordenação) e parietal (sensação).",
  },
  {
    id: "social",
    label: "Interação Social",
    emoji: "🤝",
    regions: ["prefrontal", "amygdala", "temporal"],
    description: "Interações sociais ativam pré-frontal (empatia), amígdala (emoções) e temporal (linguagem).",
  },
];

// SVG paths for the brain outline
const BRAIN_OUTLINE =
  "M 105 195 C 78 172 62 138 62 108 C 62 73 83 43 118 25 C 145 11 182 5 222 3 C 262 1 305 8 342 22 C 382 38 415 65 432 98 C 450 130 452 165 440 193 C 430 216 412 235 390 246 C 364 258 330 262 300 255 C 270 248 248 235 230 225 C 215 217 200 210 185 206 Z";

const CEREBELLUM_OUTLINE =
  "M 300 248 C 320 256 355 265 382 258 C 408 251 428 232 430 210 C 432 190 418 178 402 180 C 386 182 372 196 360 213 C 348 228 336 244 328 252 Z";

const BRAINSTEM_PATH =
  "M 168 202 C 172 215 176 242 173 266 C 170 286 165 298 167 305 L 193 305 C 195 298 190 286 187 266 C 184 242 188 215 194 202";

const GYRI_LINES = [
  "M 125 92 C 142 78 158 93 170 80",
  "M 90 142 C 106 128 124 143 136 130",
  "M 182 55 C 197 42 212 57 224 44",
  "M 246 32 C 260 20 274 34 286 22",
  "M 296 52 C 312 40 328 54 340 42",
  "M 344 82 C 360 70 375 84 386 72",
  "M 392 122 C 405 112 416 125 426 114",
  "M 388 168 C 400 157 412 170 422 159",
];

export default function NeuroLabPage() {
  const [selected, setSelected] = useState<BrainRegion | null>(null);
  const [activationMode, setActivationMode] = useState(false);
  const [activeStimulus, setActiveStimulus] = useState<StimulusPreset | null>(null);

  const activeRegionIds = activeStimulus?.regions ?? [];

  const isActive = (region: BrainRegion) =>
    activationMode && activeRegionIds.includes(region.id);

  const handleRegionClick = (region: BrainRegion) => {
    setSelected(selected?.id === region.id ? null : region);
  };

  const handleStimulusClick = (preset: StimulusPreset) => {
    if (activeStimulus?.id === preset.id) {
      setActiveStimulus(null);
    } else {
      setActiveStimulus(preset);
      setActivationMode(true);
    }
  };

  const toggleActivationMode = () => {
    setActivationMode((v) => {
      if (v) setActiveStimulus(null);
      return !v;
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
          🧠 NeuroLab
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">NeuroLab</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Clique nas regiões do cérebro para explorar suas funções. Use o Modo Ativação para ver
          quais áreas acendem em diferentes situações.
        </p>
      </div>

      {/* Activation mode toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleActivationMode}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activationMode
              ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <Zap className="h-4 w-4" />
          Modo Ativação {activationMode ? "ON" : "OFF"}
        </button>

        {activationMode && (
          <div className="flex flex-wrap gap-2">
            {STIMULUS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleStimulusClick(preset)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeStimulus?.id === preset.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {preset.emoji} {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stimulus description */}
      {activeStimulus && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{activeStimulus.description}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Brain SVG */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <svg
              viewBox="0 -20 480 370"
              className="w-full select-none"
              style={{ maxHeight: 380 }}
            >
              <defs>
                <clipPath id="brainClip">
                  <path d={BRAIN_OUTLINE} />
                </clipPath>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Brain background */}
              <path d={BRAIN_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />

              {/* Cerebellum background */}
              <path d={CEREBELLUM_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />

              {/* Brainstem background */}
              <path d={BRAINSTEM_PATH} fill="#FEF9F0" stroke="none" className="dark:fill-gray-800" />
              <rect x="167" y="202" width="27" height="103" rx="4" fill="#FEF9F0" className="dark:fill-gray-800" />

              {/* Colored lobe regions (clipped to brain) */}
              {BRAIN_REGIONS.filter((r) => !r.isSubcortical && r.id !== "cerebellum").map(
                (region) => (
                  <ellipse
                    key={region.id}
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill={isActive(region) ? region.activeColor : region.color}
                    opacity={
                      activationMode
                        ? isActive(region)
                          ? 0.85
                          : 0.15
                        : selected?.id === region.id
                          ? 0.8
                          : 0.35
                    }
                    clipPath="url(#brainClip)"
                    style={{ cursor: "pointer", transition: "all 0.3s" }}
                    filter={isActive(region) ? "url(#glow)" : undefined}
                    onClick={() => handleRegionClick(region)}
                  />
                )
              )}

              {/* Cerebellum colored */}
              {(() => {
                const cb = BRAIN_REGIONS.find((r) => r.id === "cerebellum")!;
                return (
                  <ellipse
                    cx={cb.cx}
                    cy={cb.cy}
                    rx={cb.rx}
                    ry={cb.ry}
                    fill={isActive(cb) ? cb.activeColor : cb.color}
                    opacity={
                      activationMode
                        ? isActive(cb)
                          ? 0.85
                          : 0.15
                        : selected?.id === cb.id
                          ? 0.8
                          : 0.35
                    }
                    style={{ cursor: "pointer", transition: "all 0.3s" }}
                    filter={isActive(cb) ? "url(#glow)" : undefined}
                    onClick={() => handleRegionClick(cb)}
                  />
                );
              })()}

              {/* Subcortical hotspots */}
              {BRAIN_REGIONS.filter((r) => r.isSubcortical).map((region) => (
                <g key={region.id} style={{ cursor: "pointer" }} onClick={() => handleRegionClick(region)}>
                  {/* Pulse ring when active */}
                  {isActive(region) && (
                    <circle
                      cx={region.cx}
                      cy={region.cy}
                      r={region.rx + 8}
                      fill="none"
                      stroke={region.activeColor}
                      strokeWidth="2"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="r"
                        values={`${region.rx}; ${region.rx + 14}; ${region.rx}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill={isActive(region) ? region.activeColor : selected?.id === region.id ? region.activeColor : region.color}
                    opacity={activationMode ? (isActive(region) ? 0.9 : 0.25) : selected?.id === region.id ? 0.9 : 0.7}
                    stroke={isActive(region) || selected?.id === region.id ? region.activeColor : "transparent"}
                    strokeWidth="2"
                    style={{ transition: "all 0.3s" }}
                    clipPath="url(#brainClip)"
                    filter={isActive(region) ? "url(#glow)" : undefined}
                  />
                  {/* Small label dot */}
                  <circle cx={region.cx} cy={region.cy} r="4" fill="white" opacity="0.9" />
                </g>
              ))}

              {/* Clickable transparent overlays for lobes */}
              {BRAIN_REGIONS.filter((r) => !r.isSubcortical && r.id !== "cerebellum").map(
                (region) => (
                  <ellipse
                    key={`click-${region.id}`}
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill="transparent"
                    clipPath="url(#brainClip)"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRegionClick(region)}
                  />
                )
              )}

              {/* Brain outline on top */}
              <path
                d={BRAIN_OUTLINE}
                fill="none"
                stroke="#6B7280"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d={CEREBELLUM_OUTLINE}
                fill="none"
                stroke="#6B7280"
                strokeWidth="2.5"
              />
              <path
                d={BRAINSTEM_PATH}
                fill="none"
                stroke="#6B7280"
                strokeWidth="2.5"
              />

              {/* Gyri decorative lines */}
              {GYRI_LINES.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}

              {/* Region labels */}
              {BRAIN_REGIONS.filter((r) => !r.isSubcortical).map((region) => (
                <text
                  key={`label-${region.id}`}
                  x={region.cx}
                  y={region.cy + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={
                    activationMode
                      ? isActive(region)
                        ? "white"
                        : "#9CA3AF"
                      : selected?.id === region.id
                        ? "white"
                        : "#374151"
                  }
                  style={{ pointerEvents: "none", transition: "fill 0.3s" }}
                >
                  {region.id === "cerebellum"
                    ? "Cerebelo"
                    : region.id === "prefrontal"
                      ? "Pré-frontal"
                      : region.id === "motor"
                        ? "Motor"
                        : region.id === "parietal"
                          ? "Parietal"
                          : region.id === "temporal"
                            ? "Temporal"
                            : region.id === "occipital"
                              ? "Occipital"
                              : ""}
                </text>
              ))}

              {/* Subcortical labels */}
              {BRAIN_REGIONS.filter((r) => r.isSubcortical).map((region) => (
                <text
                  key={`sub-label-${region.id}`}
                  x={region.cx}
                  y={region.cy + 3}
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: "none" }}
                >
                  {region.id === "amygdala" ? "Amíg." : "Hipoc."}
                </text>
              ))}

              {/* Brainstem label */}
              <text x="180" y="258" fontSize="8" fill="#9CA3AF" fontWeight="500">
                Tronco
              </text>

              {/* Legend */}
              <text x="10" y="340" fontSize="9" fill="#9CA3AF">
                Clique em uma região para explorar
              </text>
            </svg>
          </div>

          {/* Region color legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {BRAIN_REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleRegionClick(region)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected?.id === region.id
                    ? "border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: region.isSubcortical ? region.activeColor : region.activeColor }}
                />
                <span className="text-gray-700 dark:text-gray-300">{region.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: selected.activeColor }}
                />
                <span className="text-xs font-medium text-gray-400">{selected.lobe}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selected.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {selected.description}
              </p>

              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Funções principais
                </h3>
                <ul className="space-y-1.5">
                  {selected.functions.map((fn, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: selected.activeColor }}
                      />
                      {fn}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Exemplos comportamentais
                </h3>
                <ul className="space-y-2">
                  {selected.examples.map((ex, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-gray-50 p-2.5 text-sm italic text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      &ldquo;{ex}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Ativada em
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selected.activations.map((act) => {
                    const preset = STIMULUS_PRESETS.find((p) => p.id === act);
                    return preset ? (
                      <span
                        key={act}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {preset.emoji} {preset.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/50">
              <div className="mb-3 text-4xl">🧠</div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Clique em qualquer região do cérebro para explorar suas funções e comportamentos.
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Ative o Modo Ativação para ver quais áreas &quot;acendem&quot; em diferentes situações.
              </p>
            </div>
          )}

          {/* Quick tips */}
          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              💡 Dica rápida
            </h3>
            <div className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              A <strong>amígdala</strong> e o <strong>hipocampo</strong> ficam escondidos dentro
              do cérebro (estruturas subcorticais). Eles aparecem marcados com ponto branco no
              diagrama.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
