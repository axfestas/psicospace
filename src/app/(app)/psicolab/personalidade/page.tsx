"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";

interface Question {
  id: number;
  text: string;
  trait: "O" | "C" | "E" | "A" | "N";
  reversed?: boolean;
}

interface TraitInfo {
  key: "O" | "C" | "E" | "A" | "N";
  name: string;
  fullName: string;
  emoji: string;
  color: string;
  low: string;
  high: string;
  description: string;
}

const TRAITS: TraitInfo[] = [
  {
    key: "O",
    name: "Abertura",
    fullName: "Openness (Abertura à Experiência)",
    emoji: "🎨",
    color: "violet",
    low: "Convencional, prático, prefere rotina",
    high: "Criativo, curioso, aberto a novas ideias",
    description: "Mede a disposição para novas experiências, criatividade, curiosidade intelectual e apreciação pela arte.",
  },
  {
    key: "C",
    name: "Conscienciosidade",
    fullName: "Conscientiousness (Conscienciosidade)",
    emoji: "📋",
    color: "blue",
    low: "Flexível, espontâneo, menos organizado",
    high: "Organizado, disciplinado, confiável",
    description: "Reflete autodisciplina, organização, pontualidade e tendência a planejar antes de agir.",
  },
  {
    key: "E",
    name: "Extroversão",
    fullName: "Extraversion (Extroversão)",
    emoji: "🎉",
    color: "amber",
    low: "Introvertido, reservado, prefere solidão",
    high: "Extrovertido, sociável, energético",
    description: "Grau em que uma pessoa busca estimulação no mundo externo, especialmente em interações sociais.",
  },
  {
    key: "A",
    name: "Amabilidade",
    fullName: "Agreeableness (Amabilidade)",
    emoji: "🤝",
    color: "emerald",
    low: "Competitivo, cético, direto",
    high: "Cooperativo, empático, confiante nos outros",
    description: "Tendência a ser compassivo, cooperativo e a confiar nas pessoas, evitando conflitos.",
  },
  {
    key: "N",
    name: "Neuroticismo",
    fullName: "Neuroticism (Neuroticismo)",
    emoji: "😟",
    color: "rose",
    low: "Emocionalmente estável, calmo, resiliente",
    high: "Ansioso, irritável, emocionalmente reativo",
    description: "Tendência a experimentar emoções negativas como ansiedade, raiva, tristeza e vulnerabilidade.",
  },
];

const QUESTIONS: Question[] = [
  { id: 1,  text: "Sou original, tenho sempre novas ideias.",                          trait: "O" },
  { id: 2,  text: "Prefiro fazer as coisas de forma metódica e organizada.",            trait: "C" },
  { id: 3,  text: "Sou falante e sociável nas festas e reuniões.",                      trait: "E" },
  { id: 4,  text: "Tenho interesse genuíno pelas pessoas ao meu redor.",               trait: "A" },
  { id: 5,  text: "Me preocupo muito com as coisas.",                                   trait: "N" },
  { id: 6,  text: "Tenho uma imaginação bastante ativa e vívida.",                     trait: "O" },
  { id: 7,  text: "Costumo ser descuidado com os meus pertences.",                     trait: "C", reversed: true },
  { id: 8,  text: "Prefiro ficar em casa a sair para festas.",                         trait: "E", reversed: true },
  { id: 9,  text: "Às vezes sou indelicado com os outros.",                            trait: "A", reversed: true },
  { id: 10, text: "Fico perturbado facilmente com situações difíceis.",                trait: "N" },
  { id: 11, text: "Tenho apreciação pela arte, música ou literatura.",                 trait: "O" },
  { id: 12, text: "Faço planos e os sigo à risca.",                                    trait: "C" },
  { id: 13, text: "Tenho muita energia e estou sempre em movimento.",                  trait: "E" },
  { id: 14, text: "Faço as pessoas se sentirem bem-vindas e à vontade.",               trait: "A" },
  { id: 15, text: "Tenho oscilações de humor frequentes.",                             trait: "N" },
  { id: 16, text: "Tenho curiosidade por muitas coisas diferentes.",                   trait: "O" },
  { id: 17, text: "Deixo a bagunça se acumular antes de limpar.",                     trait: "C", reversed: true },
  { id: 18, text: "Sou reservado e não gosto de ser o centro das atenções.",          trait: "E", reversed: true },
  { id: 19, text: "Raramente me importo com os sentimentos dos outros.",               trait: "A", reversed: true },
  { id: 20, text: "Fico ansioso facilmente.",                                          trait: "N" },
];

const SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo totalmente" },
];

const colorMap: Record<string, { border: string; bg: string; text: string; bar: string; badge: string }> = {
  violet:  { border: "border-violet-200 dark:border-violet-800",  bg: "bg-violet-50 dark:bg-violet-900/20",  text: "text-violet-700 dark:text-violet-300",  bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  blue:    { border: "border-blue-200 dark:border-blue-800",      bg: "bg-blue-50 dark:bg-blue-900/20",      text: "text-blue-700 dark:text-blue-300",      bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  amber:   { border: "border-amber-200 dark:border-amber-800",    bg: "bg-amber-50 dark:bg-amber-900/20",    text: "text-amber-700 dark:text-amber-300",    bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  emerald: { border: "border-emerald-200 dark:border-emerald-800",bg: "bg-emerald-50 dark:bg-emerald-900/20",text: "text-emerald-700 dark:text-emerald-300",bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rose:    { border: "border-rose-200 dark:border-rose-800",      bg: "bg-rose-50 dark:bg-rose-900/20",      text: "text-rose-700 dark:text-rose-300",      bar: "bg-rose-500",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

function computeScores(answers: Record<number, number>) {
  const sums: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  QUESTIONS.forEach((q) => {
    const val = answers[q.id];
    if (val !== undefined) {
      const score = q.reversed ? 6 - val : val;
      sums[q.trait].push(score);
    }
  });
  const result: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    const arr = sums[key];
    result[key] = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / (arr.length * 5)) * 100) : 0;
  }
  return result;
}

function getArchetype(scores: Record<string, number>) {
  const { O, C, E, A, N } = scores;
  if (O > 65 && E > 65 && N < 40) return { name: "O Explorador", emoji: "🚀", desc: "Curioso, sociável e emocionalmente estável. Prospera em ambientes novos e criativos." };
  if (C > 65 && A > 55 && N < 45) return { name: "O Líder Equilibrado", emoji: "👑", desc: "Organizado, empático e resiliente. Combina disciplina com sensibilidade social." };
  if (E > 65 && A > 60) return { name: "O Conector Social", emoji: "🤝", desc: "Extrovertido e amigável. Constrói redes facilmente e inspira colaboração." };
  if (O > 60 && C < 40) return { name: "O Artista Criativo", emoji: "🎨", desc: "Imaginativo e espontâneo. Prefere criar livremente a seguir estruturas rígidas." };
  if (C > 65 && N < 40) return { name: "O Perfeccionista Calmo", emoji: "📐", desc: "Metódico e estável. Entrega resultados consistentes com pouco drama emocional." };
  if (N > 65) return { name: "O Sensível Profundo", emoji: "🌊", desc: "Emocionalmente intenso e empático. Muita profundidade interior, necessita de suporte emocional." };
  return { name: "O Multifacetado", emoji: "🔮", desc: "Perfil equilibrado e adaptável. Você se ajusta bem a diferentes situações e papéis." };
}

export default function PersonalidadePage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (questionId: number, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ((q) => q + 1);
    } else {
      setDone(true);
    }
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setDone(false);
  };

  const scores = computeScores(answers);
  const archetype = getArchetype(scores);
  const progress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Simulador de Personalidade</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Big Five (OCEAN) — Os 5 Grandes Fatores</p>
        </div>
      </div>

      {!done && (
        <>
          {/* Intro / OCEAN overview */}
          {currentQ === 0 && Object.keys(answers).length === 0 && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20">
              <h2 className="text-lg font-bold text-orange-800 dark:text-orange-300">O Modelo Big Five (OCEAN)</h2>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                O modelo Big Five é o mais aceito cientificamente para descrever a personalidade humana.
                Responda 20 afirmações com sinceridade — não há respostas certas ou erradas.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRAITS.map((t) => (
                  <span key={t.key} className={`rounded-full px-3 py-1 text-xs font-semibold ${colorMap[t.color].badge}`}>
                    {t.key} — {t.name} {t.emoji}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="rounded-xl bg-gray-100 dark:bg-gray-800 h-2">
            <div
              className="h-2 rounded-xl bg-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Questão {currentQ + 1} de {QUESTIONS.length}
          </p>

          {/* Question */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-4">
              {TRAITS.find((t) => t.key === QUESTIONS[currentQ].trait)?.emoji}{" "}
              {TRAITS.find((t) => t.key === QUESTIONS[currentQ].trait)?.name}
            </p>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              &ldquo;{QUESTIONS[currentQ].text}&rdquo;
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {SCALE.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleAnswer(QUESTIONS[currentQ].id, s.value)}
                  className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20"
                >
                  <span className="block text-lg font-bold">{s.value}</span>
                  <span className="text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {done && (
        <div className="space-y-6">
          {/* Archetype */}
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-800 dark:bg-orange-900/20">
            <div className="text-5xl mb-2">{archetype.emoji}</div>
            <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-300">{archetype.name}</h3>
            <p className="mt-2 text-sm text-orange-700 dark:text-orange-400">{archetype.desc}</p>
          </div>

          {/* Radar bars */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Seu Perfil OCEAN</h3>
            {TRAITS.map((t) => {
              const score = scores[t.key] ?? 0;
              const cc = colorMap[t.color];
              return (
                <div key={t.key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.emoji} {t.name}
                    </span>
                    <span className={`text-sm font-bold ${cc.text}`}>{score}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-3 rounded-full ${cc.bar} transition-all duration-700`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>{t.low}</span>
                    <span className="text-right">{t.high}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trait descriptions */}
          <div className="grid gap-3 sm:grid-cols-2">
            {TRAITS.map((t) => {
              const score = scores[t.key] ?? 0;
              const cc = colorMap[t.color];
              return (
                <div key={t.key} className={`rounded-xl border p-4 ${cc.border} ${cc.bg}`}>
                  <div className="flex justify-between items-start">
                    <h4 className={`font-semibold ${cc.text}`}>{t.emoji} {t.fullName}</h4>
                    <span className={`text-xs font-bold ${cc.text}`}>{score}%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t.description}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4" /> Refazer questionário
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            O Big Five mede traços em um espectro contínuo — não há perfil &quot;melhor&quot; ou &quot;pior&quot;. Cada combinação tem pontos fortes únicos.
          </p>
        </div>
      )}
    </div>
  );
}
