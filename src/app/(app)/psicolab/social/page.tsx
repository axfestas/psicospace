"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";

type Experiment = "asch" | "milgram";

// ── Asch ──────────────────────────────────────────────────────────────────────
interface AschTrial {
  reference: number;
  options: [number, number, number];
  correct: number;
  confederateChoice: number; // index 0-2 (wrong answer)
}

const ASCH_TRIALS: AschTrial[] = [
  { reference: 10, options: [8, 10, 13], correct: 1, confederateChoice: 0 },
  { reference: 15, options: [14, 17, 15], correct: 2, confederateChoice: 1 },
  { reference: 7,  options: [7, 9, 6],   correct: 0, confederateChoice: 2 },
  { reference: 12, options: [11, 14, 12], correct: 2, confederateChoice: 0 },
  { reference: 9,  options: [9, 6, 11],  correct: 0, confederateChoice: 2 },
  { reference: 18, options: [16, 18, 20], correct: 1, confederateChoice: 2 },
];

// ── Milgram ───────────────────────────────────────────────────────────────────
interface MilgramStep {
  voltage: number;
  label: string;
  reaction: string;
  authority: string;
}

const MILGRAM_STEPS: MilgramStep[] = [
  { voltage: 15,  label: "Leve",              reaction: "...",                                                              authority: "Por favor, continue." },
  { voltage: 75,  label: "Leve-Moderado",     reaction: "[Gemido leve]",                                                   authority: "O experimento exige que você continue." },
  { voltage: 135, label: "Forte",             reaction: "Ah! Isso dói! Deixe-me sair!",                                    authority: "É absolutamente essencial que você continue." },
  { voltage: 210, label: "Muito Forte",       reaction: "Eu não suporto mais a dor! Me deixe sair!",                       authority: "Você não tem outra escolha senão continuar." },
  { voltage: 285, label: "Intenso",           reaction: "[Grito de dor] Não vou mais responder!",                          authority: "Seja membro responsável desta pesquisa e continue." },
  { voltage: 360, label: "Extremo",           reaction: "[Silêncio total]",                                                 authority: "Continue. O experimento precisa ser concluído." },
  { voltage: 450, label: "XXX — Perigo",      reaction: "[Sem resposta]",                                                   authority: "Continue com o nível de voltagem máximo." },
];

export default function SocialPage() {
  const [experiment, setExperiment] = useState<Experiment>("asch");

  // ── Asch state ──────────────────────────────────────────────────────────
  const [aschTrial, setAschTrial] = useState(0);
  const [aschAnswer, setAschAnswer] = useState<number | null>(null);
  const [aschConformed, setAschConformed] = useState(0);
  const [aschCorrect, setAschCorrect] = useState(0);
  const [aschDone, setAschDone] = useState(false);
  const [aschStarted, setAschStarted] = useState(false);
  const [aschPhase, setAschPhase] = useState<"confederates" | "choice">("confederates");
  const [confIndex, setConfIndex] = useState(0);
  const confTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Milgram state ──────────────────────────────────────────────────────
  const [milgramStep, setMilgramStep] = useState(0);
  const [milgramStopped, setMilgramStopped] = useState(false);
  const [milgramDone, setMilgramDone] = useState(false);
  const [milgramStarted, setMilgramStarted] = useState(false);

  const startAsch = useCallback(() => {
    setAschTrial(0);
    setAschAnswer(null);
    setAschConformed(0);
    setAschCorrect(0);
    setAschDone(false);
    setAschPhase("confederates");
    setConfIndex(0);
    setAschStarted(true);
  }, []);

  // Animate confederates answering
  useEffect(() => {
    if (!aschStarted || aschDone || aschPhase !== "confederates") return;
    const trial = ASCH_TRIALS[aschTrial];
    if (confIndex < 4) {
      confTimerRef.current = setTimeout(() => {
        setConfIndex((i) => i + 1);
      }, 700);
    } else {
      confTimerRef.current = setTimeout(() => {
        setAschPhase("choice");
      }, 600);
    }
    return () => { if (confTimerRef.current) clearTimeout(confTimerRef.current); };
  }, [aschStarted, aschDone, aschPhase, confIndex, aschTrial]);

  const handleAschChoice = (optionIndex: number) => {
    if (aschPhase !== "choice" || aschAnswer !== null) return;
    const trial = ASCH_TRIALS[aschTrial];
    setAschAnswer(optionIndex);
    const conformedNow = optionIndex === trial.confederateChoice;
    const correctNow = optionIndex === trial.correct;
    if (conformedNow) setAschConformed((c) => c + 1);
    if (correctNow) setAschCorrect((c) => c + 1);

    setTimeout(() => {
      if (aschTrial + 1 >= ASCH_TRIALS.length) {
        setAschDone(true);
      } else {
        setAschTrial((t) => t + 1);
        setAschAnswer(null);
        setAschPhase("confederates");
        setConfIndex(0);
      }
    }, 1200);
  };

  const startMilgram = () => {
    setMilgramStep(0);
    setMilgramStopped(false);
    setMilgramDone(false);
    setMilgramStarted(true);
  };

  const handleMilgramContinue = () => {
    if (milgramStep + 1 >= MILGRAM_STEPS.length) {
      setMilgramDone(true);
    } else {
      setMilgramStep((s) => s + 1);
    }
  };

  const handleMilgramStop = () => {
    setMilgramStopped(true);
    setMilgramDone(true);
  };

  const currentTrial = ASCH_TRIALS[aschTrial];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Psicologia Social</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comportamento em Grupo — Asch & Milgram</p>
        </div>
      </div>

      {/* Experiment switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setExperiment("asch")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            experiment === "asch"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          🧱 Experimento de Asch (Conformidade)
        </button>
        <button
          onClick={() => setExperiment("milgram")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            experiment === "milgram"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          ⚡ Experimento de Milgram (Obediência)
        </button>
      </div>

      {/* ── ASCH ── */}
      {experiment === "asch" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
            <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">🧱 Experimento de Asch (1951)</h2>
            <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
              Solomon Asch mostrou que pessoas normais conformam à opinião do grupo mesmo quando ela está claramente errada.
              Em seus experimentos, <strong>75%</strong> das pessoas conformaram pelo menos uma vez.
              Você está em um grupo com 4 cúmplices que vão dar a resposta errada. Escolha qual linha tem o mesmo tamanho que a referência.
            </p>
          </div>

          {!aschStarted && !aschDone && (
            <div className="text-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
              <div className="text-4xl mb-3">🧱</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Pronto para o experimento?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Você será o último a responder após 4 cúmplices que escolherão a resposta errada. Confie no que você vê!
              </p>
              <button
                onClick={startAsch}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                <Play className="h-5 w-5" /> Iniciar ({ASCH_TRIALS.length} tentativas)
              </button>
            </div>
          )}

          {aschStarted && !aschDone && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>Tentativa {aschTrial + 1} / {ASCH_TRIALS.length}</span>
                <span>Conformou: {aschConformed} | Correto: {aschCorrect}</span>
              </div>

              {/* Lines visualization */}
              <div className="flex items-end justify-center gap-8 mb-6 py-4">
                {/* Reference line */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 bg-gray-800 dark:bg-gray-200 rounded" style={{ height: `${currentTrial.reference * 4}px` }} />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Referência</span>
                </div>
                {/* Options */}
                <div className="flex items-end gap-4">
                  {currentTrial.options.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleAschChoice(i)}
                      disabled={aschPhase !== "choice" || aschAnswer !== null}
                      className={`flex flex-col items-center gap-2 transition-all ${
                        aschAnswer === i
                          ? i === currentTrial.correct
                            ? "opacity-100"
                            : "opacity-100"
                          : aschAnswer !== null
                          ? "opacity-40"
                          : "hover:scale-105"
                      }`}
                    >
                      <div
                        className={`w-8 rounded transition-colors ${
                          aschAnswer === i
                            ? i === currentTrial.correct
                              ? "bg-green-500"
                              : "bg-red-500"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                        style={{ height: `${h * 4}px` }}
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{["A", "B", "C"][i]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confederates */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">Respostas dos cúmplices (todos escolhem {["A", "B", "C"][currentTrial.confederateChoice]}):</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        confIndex >= n
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                      }`}
                    >
                      {confIndex >= n ? ["A", "B", "C"][currentTrial.confederateChoice] : n}
                    </div>
                  ))}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border-2 ${
                    aschPhase === "choice" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 animate-pulse" : "border-gray-300 text-gray-400"
                  }`}>
                    {aschAnswer !== null ? ["A", "B", "C"][aschAnswer] : "Você"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {aschDone && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 text-center dark:border-indigo-800 dark:bg-indigo-900/20">
                <div className="text-4xl mb-2">{aschConformed === 0 ? "💪" : aschConformed >= 4 ? "😮" : "🤔"}</div>
                <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">Resultados</h3>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-red-500">{aschConformed}</div>
                    <div className="text-xs text-gray-500">Conformidades</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-green-600">{aschCorrect}</div>
                    <div className="text-xs text-gray-500">Respostas corretas</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-indigo-600">{Math.round((aschConformed / ASCH_TRIALS.length) * 100)}%</div>
                    <div className="text-xs text-gray-500">Taxa de conformidade</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-indigo-700 dark:text-indigo-400">
                  {aschConformed === 0
                    ? "Você manteve sua resposta independente em todas as tentativas! (Apenas ~25% das pessoas fazem isso)"
                    : aschConformed >= 4
                    ? "Alta taxa de conformidade — você sentiu a pressão do grupo! Isso é completamente normal."
                    : "Resultado misto — você cedeu algumas vezes, mas também manteve sua posição em outras."}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📚 Por que conformamos?</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• <strong>Influência informacional:</strong> Pensamos que o grupo sabe mais do que nós</li>
                  <li>• <strong>Influência normativa:</strong> Queremos ser aceitos e evitar rejeição social</li>
                  <li>• <strong>Pressão situacional:</strong> Mesmo quando temos certeza, o grupo abala nossa confiança</li>
                </ul>
              </div>
              <button onClick={startAsch} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <RotateCcw className="h-4 w-4" /> Repetir
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MILGRAM ── */}
      {experiment === "milgram" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">⚡ Experimento de Milgram (1963)</h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Stanley Milgram investigou até que ponto pessoas obedeceriam a uma autoridade para causar dano a outra pessoa.
              <strong> 65% dos participantes</strong> continuaram até o máximo de 450V, mesmo ouvindo gritos de dor.
              Você administra choques elétricos crescentes a um &quot;aprendiz&quot; por ordens de um pesquisador.
              <br />
              <span className="text-xs">(Nenhum choque real foi dado — o &quot;aprendiz&quot; era um ator.)</span>
            </p>
          </div>

          {!milgramStarted && !milgramDone && (
            <div className="text-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Você está no laboratório</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Você é o &quot;Professor&quot;. O pesquisador pediu que você aplique um choque a cada erro do aprendiz, aumentando a voltagem progressivamente.
                Em que ponto você vai parar?
              </p>
              <button
                onClick={startMilgram}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700"
              >
                <Play className="h-5 w-5" /> Iniciar experimento
              </button>
            </div>
          )}

          {milgramStarted && !milgramDone && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 space-y-4">
              {/* Voltage meter */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 dark:bg-amber-900/30">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{MILGRAM_STEPS[milgramStep].voltage}V</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{MILGRAM_STEPS[milgramStep].label}</span>
                </div>
              </div>

              {/* Voltage progress */}
              <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-yellow-400 to-red-600 transition-all duration-500"
                  style={{ width: `${((milgramStep + 1) / MILGRAM_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Learner reaction */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 mb-1">Reação do aprendiz:</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">
                  &ldquo;{MILGRAM_STEPS[milgramStep].reaction}&rdquo;
                </p>
              </div>

              {/* Authority prompt */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Pesquisador (autoridade):</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  &ldquo;{MILGRAM_STEPS[milgramStep].authority}&rdquo;
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMilgramContinue}
                  className="flex-1 rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700"
                >
                  {milgramStep + 1 >= MILGRAM_STEPS.length ? "Finalizar" : `Continuar → ${MILGRAM_STEPS[milgramStep + 1]?.voltage ?? ""}V`}
                </button>
                <button
                  onClick={handleMilgramStop}
                  className="flex-1 rounded-xl bg-red-100 py-3 font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  🛑 Recusar / Parar
                </button>
              </div>
            </div>
          )}

          {milgramDone && (
            <div className="space-y-4">
              <div className={`rounded-2xl border-2 p-6 text-center ${
                milgramStopped
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}>
                <div className="text-4xl mb-2">{milgramStopped ? "✋" : "😰"}</div>
                <h3 className={`text-xl font-bold ${milgramStopped ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                  {milgramStopped
                    ? `Você recusou no nível ${MILGRAM_STEPS[milgramStep].voltage}V`
                    : "Você chegou ao máximo: 450V"}
                </h3>
                <p className={`mt-2 text-sm ${milgramStopped ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {milgramStopped
                    ? "No experimento real, parar exige resistência ativa à autoridade — o que a maioria não conseguiu fazer."
                    : "No experimento de Milgram, 65% dos participantes chegaram ao máximo. A obediência à autoridade é extremamente poderosa."}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">📚 Lições do Experimento de Milgram</h4>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <li>• <strong>Estado agentivo:</strong> Quando obedecemos, delegamos a responsabilidade moral à autoridade</li>
                  <li>• <strong>Gradual commitment:</strong> Cada pequeno passo torna o próximo mais fácil de aceitar</li>
                  <li>• <strong>Contexto legítimo:</strong> Um ambiente institucional reduz a resistência moral</li>
                  <li>• <strong>Responsabilidade difusa:</strong> &quot;Só estou seguindo ordens&quot; — a banalidade do mal (Hannah Arendt)</li>
                </ul>
              </div>

              <button onClick={startMilgram} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <RotateCcw className="h-4 w-4" /> Repetir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
