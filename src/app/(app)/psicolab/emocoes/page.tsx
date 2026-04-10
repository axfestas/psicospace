"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface EmotionWheel {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  opposites: string[];
  description: string;
  combinations: { with: string; result: string }[];
}

const EMOTIONS: EmotionWheel[] = [
  {
    id: "alegria",
    name: "Alegria",
    emoji: "😄",
    color: "yellow",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    textColor: "text-yellow-700 dark:text-yellow-300",
    opposites: ["tristeza"],
    description: "Sentimento de prazer, satisfação e bem-estar. Associada a conquistas, conexão social e momentos positivos.",
    combinations: [
      { with: "confiança", result: "Amor" },
      { with: "antecipação", result: "Otimismo" },
      { with: "surpresa", result: "Deleite" },
    ],
  },
  {
    id: "confianca",
    name: "Confiança",
    emoji: "🤝",
    color: "emerald",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    textColor: "text-emerald-700 dark:text-emerald-300",
    opposites: ["nojo"],
    description: "Sensação de segurança e aceitação em relação a si mesmo ou aos outros. Base das relações saudáveis.",
    combinations: [
      { with: "alegria", result: "Amor" },
      { with: "medo", result: "Submissão" },
      { with: "surpresa", result: "Curiosidade" },
    ],
  },
  {
    id: "medo",
    name: "Medo",
    emoji: "😨",
    color: "violet",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-300 dark:border-violet-700",
    textColor: "text-violet-700 dark:text-violet-300",
    opposites: ["raiva"],
    description: "Resposta a ameaças percebidas. Ativa o sistema de luta-ou-fuga. Evolutivamente essencial para sobrevivência.",
    combinations: [
      { with: "surpresa", result: "Susto" },
      { with: "tristeza", result: "Desespero" },
      { with: "confianca", result: "Submissão" },
    ],
  },
  {
    id: "surpresa",
    name: "Surpresa",
    emoji: "😲",
    color: "sky",
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
    borderColor: "border-sky-300 dark:border-sky-700",
    textColor: "text-sky-700 dark:text-sky-300",
    opposites: ["antecipacao"],
    description: "Reação a eventos inesperados. Neutra em si mesma — pode se tornar positiva (deleite) ou negativa (susto).",
    combinations: [
      { with: "alegria", result: "Deleite" },
      { with: "medo", result: "Susto" },
      { with: "tristeza", result: "Desapontamento" },
    ],
  },
  {
    id: "tristeza",
    name: "Tristeza",
    emoji: "😢",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    textColor: "text-blue-700 dark:text-blue-300",
    opposites: ["alegria"],
    description: "Resposta a perdas, frustrações ou decepções. Função adaptativa: sinaliza a necessidade de apoio e reflexão.",
    combinations: [
      { with: "raiva", result: "Inveja" },
      { with: "nojo", result: "Remorso" },
      { with: "surpresa", result: "Desapontamento" },
    ],
  },
  {
    id: "nojo",
    name: "Nojo",
    emoji: "🤢",
    color: "lime",
    bgColor: "bg-lime-50 dark:bg-lime-900/20",
    borderColor: "border-lime-300 dark:border-lime-700",
    textColor: "text-lime-700 dark:text-lime-300",
    opposites: ["confianca"],
    description: "Rejeição a algo percebido como nocivo ou moralmente repugnante. Protege de substâncias e comportamentos perigosos.",
    combinations: [
      { with: "tristeza", result: "Remorso" },
      { with: "raiva", result: "Desprezo" },
      { with: "antecipacao", result: "Cinismo" },
    ],
  },
  {
    id: "raiva",
    name: "Raiva",
    emoji: "😠",
    color: "red",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
    textColor: "text-red-700 dark:text-red-300",
    opposites: ["medo"],
    description: "Ativação intensa diante de ameaças, injustiças ou bloqueios de objetivos. Pode motivar ação ou destruir relações.",
    combinations: [
      { with: "antecipacao", result: "Agressividade" },
      { with: "nojo", result: "Desprezo" },
      { with: "tristeza", result: "Inveja" },
    ],
  },
  {
    id: "antecipacao",
    name: "Antecipação",
    emoji: "🎯",
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    textColor: "text-orange-700 dark:text-orange-300",
    opposites: ["surpresa"],
    description: "Orientação para o futuro com expectativa. Pode gerar planejamento saudável ou ansiedade antecipatória.",
    combinations: [
      { with: "alegria", result: "Otimismo" },
      { with: "raiva", result: "Agressividade" },
      { with: "nojo", result: "Cinismo" },
    ],
  },
];

const EVENTS = [
  "Receber uma crítica no trabalho",
  "Uma promoção inesperada",
  "Terminar um relacionamento",
  "Ser surpreendido com um presente",
  "Perder algo importante",
  "Conflito com um amigo próximo",
  "Uma conquista após longo esforço",
  "Testemunhar uma injustiça",
];

const SOCIAL_CONTEXTS = [
  "Sozinho(a)",
  "Em família",
  "No trabalho",
  "Com amigos íntimos",
  "Em público com desconhecidos",
];

const INTERNAL_STATES = [
  "Descansado(a) e bem",
  "Cansado(a) / exausto(a)",
  "Ansioso(a) já antes",
  "Triste / vulnerável",
  "Motivado(a) e confiante",
];

const colorBg: Record<string, string> = {
  yellow:  "bg-yellow-100  dark:bg-yellow-900/30",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30",
  violet:  "bg-violet-100  dark:bg-violet-900/30",
  sky:     "bg-sky-100     dark:bg-sky-900/30",
  blue:    "bg-blue-100    dark:bg-blue-900/30",
  lime:    "bg-lime-100    dark:bg-lime-900/30",
  red:     "bg-red-100     dark:bg-red-900/30",
  orange:  "bg-orange-100  dark:bg-orange-900/30",
};

export default function EmocoesPage() {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionWheel | null>(null);

  const toggleEmotion = (id: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : prev.length < 3 ? [...prev, id] : prev
    );
    setShowProfile(false);
  };

  const reset = () => {
    setSelectedEmotions([]);
    setSelectedEvent(null);
    setSelectedContext(null);
    setSelectedState(null);
    setShowProfile(false);
    setSelectedEmotion(null);
  };

  const canGenerate = selectedEmotions.length > 0 && selectedEvent && selectedContext && selectedState;

  const selectedEmotionData = EMOTIONS.filter((e) => selectedEmotions.includes(e.id));

  const combinations = selectedEmotionData.flatMap((e) =>
    e.combinations.filter((c) => selectedEmotions.includes(c.with))
  );
  const uniqueCombinations = combinations.filter(
    (c, i) => combinations.findIndex((x) => x.result === c.result) === i
  );

  const regulationStrategies: Record<string, string[]> = {
    raiva: ["Técnica de pausa de 10 segundos", "Exercício físico intenso", "Escrita expressiva"],
    medo: ["Respiração diafragmática (4-7-8)", "Exposição gradual", "Reestruturação cognitiva"],
    tristeza: ["Permitir sentir sem julgamento", "Contato social", "Ativação comportamental"],
    nojo: ["Distanciamento consciente", "Reavaliação cognitiva", "Contato com valores pessoais"],
    surpresa: ["Grounding (5 sentidos)", "Nomear a emoção", "Aguardar processamento"],
    alegria: ["Savoring (saborear o momento)", "Gratidão escrita", "Compartilhar com outros"],
    confianca: ["Reforçar vínculos seguros", "Autocuidado", "Reafirmação de valores"],
    antecipacao: ["Mindfulness do presente", "Plano de ação concreto", "Técnica preocupação agendada"],
  };

  const allStrategies = [...new Set(selectedEmotions.flatMap((id) => regulationStrategies[id] ?? []))];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lab de Emoções</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Roda de Plutchik — Emoções em Tempo Real</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 p-5 dark:border-pink-800 dark:bg-pink-900/20">
        <p className="text-sm text-pink-700 dark:text-pink-300">
          🌸 Robert Plutchik (1980) propôs que existem <strong>8 emoções primárias</strong> que se combinam, formam opostos e variam em intensidade — como cores. Explore a roda abaixo e gere seu perfil emocional.
        </p>
      </div>

      {/* Plutchik Wheel */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
          1. Selecione até 3 emoções que você está sentindo
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EMOTIONS.map((e) => {
            const selected = selectedEmotions.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggleEmotion(e.id)}
                className={`rounded-2xl border-2 p-3 text-left transition-all hover:shadow-md ${
                  selected ? `${e.borderColor} ${e.bgColor}` : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="text-2xl mb-1">{e.emoji}</div>
                <div className={`text-sm font-bold ${selected ? e.textColor : "text-gray-800 dark:text-gray-200"}`}>{e.name}</div>
                {selected && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); setSelectedEmotion(selectedEmotion?.id === e.id ? null : e); }}
                    className={`mt-1 text-xs ${e.textColor} underline`}
                  >
                    {selectedEmotion?.id === e.id ? "fechar" : "saiba mais"}
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {selectedEmotion && (
          <div className={`mt-3 rounded-2xl border-2 p-4 ${selectedEmotion.borderColor} ${selectedEmotion.bgColor}`}>
            <h3 className={`font-bold ${selectedEmotion.textColor}`}>{selectedEmotion.emoji} {selectedEmotion.name}</h3>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedEmotion.description}</p>
            <p className="mt-2 text-xs text-gray-500">
              <strong>Oposta a:</strong> {EMOTIONS.find((e) => selectedEmotion.opposites.includes(e.id))?.name ?? "—"}
            </p>
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500">Combinações:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedEmotion.combinations.map((c) => (
                  <span key={c.result} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-700 border dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700">
                    + {EMOTIONS.find((e) => e.id === c.with)?.name ?? c.with} = <strong>{c.result}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context */}
      <div>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">2. Qual foi o evento desencadeador?</h2>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((ev) => (
            <button
              key={ev}
              onClick={() => { setSelectedEvent(ev); setShowProfile(false); }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                selectedEvent === ev
                  ? "border-pink-400 bg-pink-100 text-pink-700 dark:border-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                  : "border-gray-200 bg-white text-gray-600 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              }`}
            >
              {ev}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">3. Contexto social</h2>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_CONTEXTS.map((c) => (
            <button key={c} onClick={() => { setSelectedContext(c); setShowProfile(false); }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                selectedContext === c
                  ? "border-pink-400 bg-pink-100 text-pink-700 dark:border-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                  : "border-gray-200 bg-white text-gray-600 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              }`}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">4. Estado interno anterior</h2>
        <div className="flex flex-wrap gap-2">
          {INTERNAL_STATES.map((s) => (
            <button key={s} onClick={() => { setSelectedState(s); setShowProfile(false); }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                selectedState === s
                  ? "border-pink-400 bg-pink-100 text-pink-700 dark:border-pink-600 dark:bg-pink-900/30 dark:text-pink-300"
                  : "border-gray-200 bg-white text-gray-600 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowProfile(true)}
          disabled={!canGenerate}
          className="flex-1 rounded-xl bg-pink-600 py-3 font-semibold text-white transition-all hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Gerar Perfil Emocional
        </button>
        <button onClick={reset} className="rounded-xl border border-gray-200 px-4 py-3 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Profile */}
      {showProfile && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 p-6 dark:border-pink-800 dark:bg-pink-900/20">
            <h3 className="text-lg font-bold text-pink-800 dark:text-pink-300">Seu Perfil Emocional</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedEmotionData.map((e) => (
                <span key={e.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${e.bgColor} ${e.textColor} border ${e.borderColor}`}>
                  {e.emoji} {e.name}
                </span>
              ))}
            </div>

            {uniqueCombinations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Emoções secundárias (combinações):</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {uniqueCombinations.map((c) => (
                    <span key={c.result} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                      ✨ {c.result}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              <div className="rounded-lg bg-white/70 p-2 dark:bg-gray-900/40">
                <span className="text-xs font-semibold text-gray-500">Evento:</span>
                <p className="text-gray-700 dark:text-gray-300">{selectedEvent}</p>
              </div>
              <div className="rounded-lg bg-white/70 p-2 dark:bg-gray-900/40">
                <span className="text-xs font-semibold text-gray-500">Contexto:</span>
                <p className="text-gray-700 dark:text-gray-300">{selectedContext}</p>
              </div>
              <div className="rounded-lg bg-white/70 p-2 sm:col-span-2 dark:bg-gray-900/40">
                <span className="text-xs font-semibold text-gray-500">Estado anterior:</span>
                <p className="text-gray-700 dark:text-gray-300">{selectedState}</p>
              </div>
            </div>
          </div>

          {allStrategies.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🛠️ Estratégias de Regulação Emocional</h4>
              <ul className="space-y-1.5">
                {allStrategies.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-pink-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            A avaliação cognitiva do evento e o contexto social amplificam ou atenuam a resposta emocional — o mesmo evento pode gerar emoções completamente diferentes.
          </p>
        </div>
      )}
    </div>
  );
}
