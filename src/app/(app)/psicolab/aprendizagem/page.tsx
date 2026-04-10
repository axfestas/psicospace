"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";

type SimType = "pavlov" | "bandura";

// ── Pavlov types ───────────────────────────────────────────────────────────────
type PavlovPhase = "before" | "acquisition" | "acquisition_done" | "test" | "extinction";

interface PavlovState {
  phase: PavlovPhase;
  trial: number;
  maxTrials: number;
  dogSalivating: boolean;
  bellRinging: boolean;
  foodPresent: boolean;
  associations: number; // 0–100
  message: string;
}

// ── Bandura Bobo Doll ──────────────────────────────────────────────────────────
type ModelBehavior = "aggressive" | "nonaggressive" | "none";
type ChildAge = "3" | "5" | "7";

interface BanduraResult {
  imitationRate: number;
  aggressionLevel: string;
  explanation: string;
}

function computeBandura(
  model: ModelBehavior,
  childAge: ChildAge,
  sameGender: boolean,
  rewardObserved: boolean
): BanduraResult {
  if (model === "none") {
    return {
      imitationRate: 15,
      aggressionLevel: "Baixa",
      explanation: "Sem modelo para observar, a criança exibe comportamentos espontâneos de baixa agressividade.",
    };
  }
  if (model === "nonaggressive") {
    return {
      imitationRate: 12,
      aggressionLevel: "Muito Baixa",
      explanation: "O modelo não-agressivo inibe o comportamento agressivo — a criança aprende indiretamente que a agressão não é a norma.",
    };
  }

  let base = 60;
  if (sameGender) base += 15;
  if (rewardObserved) base += 12;
  if (childAge === "3") base -= 5;
  if (childAge === "7") base += 8;
  base = Math.min(95, Math.max(20, base));

  return {
    imitationRate: base,
    aggressionLevel: base > 70 ? "Alta" : base > 45 ? "Moderada" : "Baixa",
    explanation: `A criança imitou comportamentos agressivos observados${sameGender ? ", especialmente por identificar-se com o modelo do mesmo gênero" : ""}${rewardObserved ? " e porque o modelo foi recompensado (reforço vicário)" : ""}. Bandura demonstrou que a <strong>aprendizagem observacional</strong> não requer experiência direta.`,
  };
}

const PAVLOV_MESSAGES: Record<string, string> = {
  before: "O cão não responde ao sino — ele é neutro. Ao ver a comida, saliva naturalmente.",
  acquisition: "Apresentando sino + comida juntos. A associação está se formando...",
  acquisition_done: "Condicionamento completo! O cão agora associa o sino à comida.",
  test: "Apenas o sino — sem comida. Observe a salivação condicionada!",
  extinction: "Apresentando só o sino repetidamente sem comida... a resposta começa a enfraquecer.",
};

export default function AprendizagemPage() {
  const [sim, setSim] = useState<SimType>("pavlov");

  // ── Pavlov state ─────────────────────────────────────────────────────────
  const [pavlov, setPavlov] = useState<PavlovState>({
    phase: "before",
    trial: 0,
    maxTrials: 5,
    dogSalivating: false,
    bellRinging: false,
    foodPresent: false,
    associations: 0,
    message: PAVLOV_MESSAGES.before,
  });
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bandura state ─────────────────────────────────────────────────────────
  const [modelBehavior, setModelBehavior] = useState<ModelBehavior>("aggressive");
  const [childAge, setChildAge] = useState<ChildAge>("5");
  const [sameGender, setSameGender] = useState(false);
  const [rewardObserved, setRewardObserved] = useState(false);
  const [banduraResult, setBanduraResult] = useState<BanduraResult | null>(null);

  const runPavlovTrial = useCallback((state: PavlovState): PavlovState => {
    if (state.phase === "before") {
      // Demo: ring bell (no salivation), then show food (salivation)
      return {
        ...state,
        foodPresent: true,
        dogSalivating: true,
        bellRinging: false,
        message: "Comida aparece → salivação (resposta incondicionada). Sino sozinho = sem reação.",
      };
    }

    if (state.phase === "acquisition") {
      const newTrial = state.trial + 1;
      const newAssoc = Math.min(100, state.associations + 18);
      if (newTrial >= state.maxTrials) {
        return {
          ...state,
          trial: newTrial,
          associations: newAssoc,
          bellRinging: true,
          foodPresent: true,
          dogSalivating: true,
          phase: "acquisition_done",
          message: PAVLOV_MESSAGES.acquisition_done,
        };
      }
      return {
        ...state,
        trial: newTrial,
        associations: newAssoc,
        bellRinging: true,
        foodPresent: true,
        dogSalivating: true,
        message: `Tentativa ${newTrial}/${state.maxTrials}: sino + comida. Associação: ${newAssoc}%`,
      };
    }

    if (state.phase === "test") {
      return {
        ...state,
        bellRinging: true,
        foodPresent: false,
        dogSalivating: true,
        message: "🔔 Só o sino — o cão saliva! Condicionamento clássico demonstrado!",
      };
    }

    if (state.phase === "extinction") {
      const newAssoc = Math.max(0, state.associations - 22);
      const salivating = newAssoc > 20;
      return {
        ...state,
        associations: newAssoc,
        bellRinging: true,
        foodPresent: false,
        dogSalivating: salivating,
        message: newAssoc <= 0
          ? "Extinção completa — sem comida, a resposta condicionada desapareceu."
          : `Sino sem comida... associação caindo: ${newAssoc}%. ${salivating ? "Ainda salivando." : "Sem mais salivação."}`,
      };
    }

    return state;
  }, []);

  const startAcquisition = () => {
    setPavlov((s) => ({ ...s, phase: "acquisition", trial: 0, associations: 0, message: PAVLOV_MESSAGES.acquisition }));
    setRunning(true);
  };

  const startTest = () => {
    setPavlov((s) => ({ ...s, phase: "test", dogSalivating: false, bellRinging: false, foodPresent: false }));
    setRunning(true);
  };

  const startExtinction = () => {
    setPavlov((s) => ({ ...s, phase: "extinction", dogSalivating: false, bellRinging: false, foodPresent: false }));
    setRunning(true);
  };

  const resetPavlov = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPavlov({
      phase: "before",
      trial: 0,
      maxTrials: 5,
      dogSalivating: false,
      bellRinging: false,
      foodPresent: false,
      associations: 0,
      message: PAVLOV_MESSAGES.before,
    });
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setTimeout(() => {
      setPavlov((s) => {
        const next = runPavlovTrial(s);
        if (next.phase === "acquisition_done" || next.phase === "test" || next.phase === "before") {
          setRunning(false);
        }
        if (next.phase === "extinction" && next.associations <= 0) {
          setRunning(false);
        }
        return next;
      });
    }, 1200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, pavlov, runPavlovTrial]);

  // Trigger next acquisition trial
  useEffect(() => {
    if (running && pavlov.phase === "acquisition" && pavlov.trial < pavlov.maxTrials) {
      intervalRef.current = setTimeout(() => {
        setPavlov((s) => runPavlovTrial(s));
      }, 1500);
    }
    if (running && pavlov.phase === "extinction" && pavlov.associations > 0) {
      intervalRef.current = setTimeout(() => {
        setPavlov((s) => runPavlovTrial(s));
      }, 1500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, pavlov.phase, pavlov.trial, pavlov.associations, runPavlovTrial]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lab de Aprendizagem</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pavlov, Skinner e Além — Aprendizagem Clássica e Observacional</p>
        </div>
      </div>

      {/* Sim switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setSim("pavlov")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            sim === "pavlov"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          🐕 Condicionamento Clássico (Pavlov)
        </button>
        <button
          onClick={() => setSim("bandura")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            sim === "bandura"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          🧒 Aprendizagem Observacional (Bandura)
        </button>
      </div>

      {/* ── PAVLOV ── */}
      {sim === "pavlov" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 dark:border-sky-800 dark:bg-sky-900/20">
            <h2 className="text-lg font-bold text-sky-800 dark:text-sky-300">🐕 Ivan Pavlov e o Cão</h2>
            <p className="mt-1 text-sm text-sky-700 dark:text-sky-400">
              Pavlov descobriu que um estímulo neutro (sino) pode adquirir a capacidade de provocar uma resposta reflexa (salivação) quando repetidamente associado a um estímulo que naturalmente a provoca (comida).
            </p>
          </div>

          {/* Dog animation */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-6">
              {/* Visual */}
              <div className="flex items-center gap-8 py-4">
                <div className="text-center">
                  <div className={`text-6xl transition-all duration-500 ${pavlov.bellRinging ? "scale-125 drop-shadow-lg" : ""}`}>
                    🔔
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Sino (EC)</p>
                  {pavlov.bellRinging && <span className="text-xs text-sky-600 font-semibold animate-pulse">♪♪♪</span>}
                </div>
                <div className="text-3xl text-gray-400">{pavlov.foodPresent && pavlov.bellRinging ? "+" : "→"}</div>
                <div className="text-center">
                  <div className={`text-6xl transition-all duration-300 ${pavlov.foodPresent ? "scale-110" : "opacity-30"}`}>
                    🍖
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Comida (EI)</p>
                </div>
                <div className="text-3xl text-gray-400">→</div>
                <div className="text-center">
                  <div className={`text-6xl transition-all duration-500 ${pavlov.dogSalivating ? "scale-110 drop-shadow-lg" : ""}`}>
                    🐕
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Cão</p>
                  {pavlov.dogSalivating && <span className="text-xs text-blue-500 font-semibold animate-bounce">💧💧</span>}
                </div>
              </div>

              {/* Association bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Força da associação</span>
                  <span className="font-bold">{pavlov.associations}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-3 rounded-full bg-sky-500 transition-all duration-700"
                    style={{ width: `${pavlov.associations}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 w-full text-center dark:bg-sky-900/20 dark:border-sky-800">
                <p className="text-sm text-sky-700 dark:text-sky-300">{pavlov.message}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid gap-3 sm:grid-cols-4">
            <button
              onClick={startAcquisition}
              disabled={running || pavlov.phase === "acquisition_done" || pavlov.phase === "test"}
              className="rounded-xl bg-sky-100 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-200 disabled:opacity-40 dark:bg-sky-900/30 dark:text-sky-300"
            >
              🔁 Fase de Aquisição
            </button>
            <button
              onClick={startTest}
              disabled={running || pavlov.associations < 70}
              className="rounded-xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-200 disabled:opacity-40 dark:bg-green-900/30 dark:text-green-300"
            >
              🔔 Testar Condicionamento
            </button>
            <button
              onClick={startExtinction}
              disabled={running || pavlov.associations < 50}
              className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-40 dark:bg-amber-900/30 dark:text-amber-300"
            >
              🚫 Extinguir Resposta
            </button>
            <button
              onClick={resetPavlov}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4 mx-auto" />
            </button>
          </div>

          {/* Glossary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📚 Glossário do Condicionamento Clássico</h3>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              {[
                ["EI — Estímulo Incondicionado", "Comida: provoca resposta reflexa naturalmente"],
                ["RI — Resposta Incondicionada", "Salivação ao ver comida (inato)"],
                ["EN → EC — Estímulo Condicionado", "Sino: neutro → depois de associações, provoca resposta"],
                ["RC — Resposta Condicionada", "Salivação ao ouvir o sino (aprendida)"],
                ["Aquisição", "Fase de emparelhar EC + EI para formar associação"],
                ["Extinção", "Apresentar EC sem EI → resposta diminui gradualmente"],
                ["Recuperação Espontânea", "Após extinção + pausa, a RC pode reaparecer"],
                ["Generalização", "Resposta a estímulos similares ao EC original"],
              ].map(([term, def]) => (
                <div key={term} className="rounded-lg border border-gray-100 p-2 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{term}:</span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">{def}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BANDURA ── */}
      {sim === "bandura" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20">
            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-300">🧒 Albert Bandura e o Experimento Bobo Doll</h2>
            <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
              Em 1961, Bandura mostrou que crianças imitam comportamentos agressivos de adultos mesmo sem reforço direto.
              A <strong>aprendizagem observacional</strong> (ou vicária) ocorre apenas por observar um modelo.
              Ajuste as variáveis abaixo e veja como elas afetam a taxa de imitação.
            </p>
          </div>

          {/* Variables */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 space-y-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Configure o experimento:</h3>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comportamento do modelo adulto:</p>
              <div className="flex flex-wrap gap-2">
                {(["aggressive", "nonaggressive", "none"] as ModelBehavior[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setModelBehavior(m); setBanduraResult(null); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                      modelBehavior === m
                        ? "bg-orange-500 text-white border-orange-600"
                        : "border-gray-200 text-gray-600 hover:border-orange-300 dark:border-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {m === "aggressive" ? "🥊 Agressivo" : m === "nonaggressive" ? "😊 Não-agressivo" : "🚫 Sem modelo"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idade da criança:</p>
              <div className="flex gap-2">
                {(["3", "5", "7"] as ChildAge[]).map((age) => (
                  <button
                    key={age}
                    onClick={() => { setChildAge(age); setBanduraResult(null); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                      childAge === age
                        ? "bg-orange-500 text-white border-orange-600"
                        : "border-gray-200 text-gray-600 hover:border-orange-300 dark:border-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {age} anos
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameGender}
                  onChange={(e) => { setSameGender(e.target.checked); setBanduraResult(null); }}
                  className="rounded accent-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mesmo gênero que o modelo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rewardObserved}
                  onChange={(e) => { setRewardObserved(e.target.checked); setBanduraResult(null); }}
                  className="rounded accent-orange-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Modelo foi recompensado (reforço vicário)</span>
              </label>
            </div>

            <button
              onClick={() => setBanduraResult(computeBandura(modelBehavior, childAge, sameGender, rewardObserved))}
              className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Simular experimento
            </button>
          </div>

          {banduraResult && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20 space-y-4">
              <h3 className="font-bold text-orange-800 dark:text-orange-300">Resultado do experimento</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 text-center dark:bg-gray-900">
                  <div className={`text-3xl font-black ${banduraResult.imitationRate > 60 ? "text-red-500" : banduraResult.imitationRate > 30 ? "text-amber-500" : "text-green-500"}`}>
                    {banduraResult.imitationRate}%
                  </div>
                  <div className="text-xs text-gray-500">Taxa de imitação</div>
                </div>
                <div className="rounded-xl bg-white p-3 text-center dark:bg-gray-900">
                  <div className={`text-3xl font-black ${banduraResult.aggressionLevel === "Alta" ? "text-red-500" : banduraResult.aggressionLevel === "Moderada" ? "text-amber-500" : "text-green-500"}`}>
                    {banduraResult.aggressionLevel}
                  </div>
                  <div className="text-xs text-gray-500">Nível de agressão</div>
                </div>
                <div className="rounded-xl bg-white p-3 text-center dark:bg-gray-900">
                  <div className="text-3xl">
                    {modelBehavior === "aggressive" ? "🥊" : modelBehavior === "nonaggressive" ? "😊" : "🚫"}
                  </div>
                  <div className="text-xs text-gray-500">Modelo observado</div>
                </div>
              </div>
              <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
                <p className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: banduraResult.explanation }} />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🧠 Processos da Aprendizagem Observacional (ARRM)</h4>
            <div className="grid gap-2 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400">
              {[
                ["Atenção", "Focar no modelo — influenciado por saliência, atração e similaridade"],
                ["Retenção", "Armazenar mentalmente o comportamento observado"],
                ["Reprodução", "Capacidade motora e cognitiva para executar o comportamento"],
                ["Motivação", "Razão para imitar — reforço vicário, direto ou autorreforço"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-gray-100 p-2 dark:border-gray-700">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{k}:</span> {v}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
