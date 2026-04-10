"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Play, CheckCircle, XCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = "ebbinghaus" | "stroop" | "vieses";

// ── Stroop ─────────────────────────────────────────────────────────────────────
interface StroopWord {
  word: string;
  inkColor: string;
  colorLabel: string;
}

const STROOP_ITEMS: StroopWord[] = [
  { word: "VERMELHO", inkColor: "#3b82f6", colorLabel: "Azul" },
  { word: "AZUL",     inkColor: "#ef4444", colorLabel: "Vermelho" },
  { word: "VERDE",    inkColor: "#f59e0b", colorLabel: "Amarelo" },
  { word: "AMARELO",  inkColor: "#22c55e", colorLabel: "Verde" },
  { word: "ROXO",     inkColor: "#ef4444", colorLabel: "Vermelho" },
  { word: "LARANJA",  inkColor: "#8b5cf6", colorLabel: "Roxo" },
  { word: "ROSA",     inkColor: "#22c55e", colorLabel: "Verde" },
  { word: "VERDE",    inkColor: "#3b82f6", colorLabel: "Azul" },
  { word: "AZUL",     inkColor: "#f59e0b", colorLabel: "Amarelo" },
  { word: "VERMELHO", inkColor: "#8b5cf6", colorLabel: "Roxo" },
];

const COLOR_OPTIONS = ["Vermelho", "Azul", "Verde", "Amarelo", "Roxo", "Laranja", "Rosa"];

// ── Vieses ─────────────────────────────────────────────────────────────────────
interface Bias {
  id: string;
  name: string;
  emoji: string;
  description: string;
  example: string;
  strategy: string;
  color: string;
}

const BIASES: Bias[] = [
  {
    id: "confirmacao",
    name: "Viés de Confirmação",
    emoji: "🔍",
    description: "Tendemos a buscar, interpretar e lembrar informações que confirmam nossas crenças pré-existentes, ignorando evidências contrárias.",
    example: "Você acredita que uma dieta funciona e ignora os estudos que mostram o contrário, focando apenas nos que a apoiam.",
    strategy: "Busque ativamente evidências que contradigam suas crenças. Pergunte: 'O que poderia provar que estou errado?'",
    color: "amber",
  },
  {
    id: "ancoragem",
    name: "Viés de Ancoragem",
    emoji: "⚓",
    description: "Dependemos excessivamente da primeira informação que recebemos (a 'âncora') ao tomar decisões subsequentes.",
    example: "Um produto marcado de R$ 200 para R$ 100 parece uma ótima oferta — mesmo que o valor real seja R$ 80.",
    strategy: "Questione sempre a primeira informação recebida. Pesquise referências independentes antes de decidir.",
    color: "blue",
  },
  {
    id: "disponibilidade",
    name: "Heurística da Disponibilidade",
    emoji: "📰",
    description: "Julgamos a probabilidade de eventos com base na facilidade com que exemplos vêm à mente.",
    example: "Após ver notícias sobre acidentes aéreos, superestimamos os riscos de voar em relação a dirigir.",
    strategy: "Consulte dados estatísticos reais. Lembre que eventos impactantes são mais memoráveis, não mais frequentes.",
    color: "rose",
  },
  {
    id: "dunning_kruger",
    name: "Efeito Dunning-Kruger",
    emoji: "🎓",
    description: "Pessoas com pouco conhecimento tendem a superestimar sua competência; especialistas tendem a subestimá-la.",
    example: "Após ler um artigo sobre investimentos, a pessoa se sente confiante o suficiente para fazer apostas arriscadas.",
    strategy: "Cultive a 'ignorância consciente': quanto mais você aprende, mais percebe o que não sabe. Busque feedback externo.",
    color: "violet",
  },
  {
    id: "sunk_cost",
    name: "Falácia do Custo Irrecuperável",
    emoji: "💸",
    description: "Continuamos investindo em algo apenas porque já investimos muito — mesmo quando o retorno é improvável.",
    example: "Continuar assistindo um filme ruim 'porque já pagamos o ingresso'.",
    strategy: "Avalie cada decisão com base no futuro, não no passado. Pergunte: 'Se começasse agora, faria isso?'",
    color: "emerald",
  },
  {
    id: "halo",
    name: "Efeito Halo",
    emoji: "✨",
    description: "Uma característica positiva (ou negativa) de uma pessoa influencia nossa percepção geral sobre ela.",
    example: "Assumimos que pessoas atraentes são mais inteligentes, honestas ou competentes.",
    strategy: "Avalie características de forma independente. Separe julgamentos de aparência dos de competência.",
    color: "orange",
  },
];

// ── Ebbinghaus curve data ──────────────────────────────────────────────────────
const CURVE_POINTS = [
  { label: "Imediato",  retention: 100, hours: 0 },
  { label: "20 min",    retention: 58,  hours: 0.33 },
  { label: "1 hora",    retention: 44,  hours: 1 },
  { label: "9 horas",   retention: 36,  hours: 9 },
  { label: "1 dia",     retention: 33,  hours: 24 },
  { label: "2 dias",    retention: 27,  hours: 48 },
  { label: "6 dias",    retention: 25,  hours: 144 },
  { label: "31 dias",   retention: 21,  hours: 744 },
];

const REVIEW_INTERVALS = ["Após 1 dia", "Após 1 semana", "Após 1 mês", "Após 3 meses"];

export default function CognitivoPage() {
  const [tab, setTab] = useState<Tab>("ebbinghaus");

  // ── Stroop state ──────────────────────────────────────────────────────────
  const [stroopIndex, setStroopIndex] = useState(0);
  const [stroopScore, setStroopScore] = useState(0);
  const [stroopErrors, setStroopErrors] = useState(0);
  const [stroopStartTime, setStroopStartTime] = useState<number | null>(null);
  const [stroopTimes, setStroopTimes] = useState<number[]>([]);
  const [stroopDone, setStroopDone] = useState(false);
  const [stroopFeedback, setStroopFeedback] = useState<"correct" | "wrong" | null>(null);
  const [stroopStarted, setStroopStarted] = useState(false);

  // ── Bias state ────────────────────────────────────────────────────────────
  const [selectedBias, setSelectedBias] = useState<Bias | null>(null);

  const startStroop = useCallback(() => {
    setStroopIndex(0);
    setStroopScore(0);
    setStroopErrors(0);
    setStroopTimes([]);
    setStroopDone(false);
    setStroopFeedback(null);
    setStroopStartTime(Date.now());
    setStroopStarted(true);
  }, []);

  const handleStroopAnswer = useCallback((choice: string) => {
    if (stroopDone || !stroopStarted) return;
    const item = STROOP_ITEMS[stroopIndex];
    const now = Date.now();
    const elapsed = stroopStartTime ? now - stroopStartTime : 0;
    const correct = choice === item.colorLabel;
    setStroopFeedback(correct ? "correct" : "wrong");
    setStroopTimes((t) => [...t, elapsed]);
    if (correct) setStroopScore((s) => s + 1);
    else setStroopErrors((e) => e + 1);
    setStroopStartTime(now);

    setTimeout(() => {
      setStroopFeedback(null);
      if (stroopIndex + 1 >= STROOP_ITEMS.length) {
        setStroopDone(true);
      } else {
        setStroopIndex((i) => i + 1);
      }
    }, 400);
  }, [stroopDone, stroopStarted, stroopIndex, stroopStartTime]);

  const avgTime = stroopTimes.length ? Math.round(stroopTimes.reduce((a, b) => a + b, 0) / stroopTimes.length) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Processos Cognitivos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Memória, Atenção e Vieses da Mente Humana</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(["ebbinghaus", "stroop", "vieses"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === t
                ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {t === "ebbinghaus" ? "🧠 Curva de Ebbinghaus" : t === "stroop" ? "🎨 Efeito Stroop" : "🪞 Vieses Cognitivos"}
          </button>
        ))}
      </div>

      {/* ── Ebbinghaus ── */}
      {tab === "ebbinghaus" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">📉 A Curva do Esquecimento</h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Hermann Ebbinghaus (1885) demonstrou que esquecemos de forma previsível. Sem revisão,
              perdemos ~58% do que aprendemos em apenas 20 minutos.
            </p>
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-semibold text-gray-800 dark:text-gray-200">Retenção ao longo do tempo (sem revisão)</h3>
            <div className="space-y-3">
              {CURVE_POINTS.map((pt) => (
                <div key={pt.label} className="flex items-center gap-3">
                  <span className="w-20 text-right text-xs text-gray-500 dark:text-gray-400">{pt.label}</span>
                  <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${pt.retention}%` }}
                    >
                      <span className="text-xs font-bold text-amber-900">{pt.retention}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spaced repetition */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">🔁 Repetição Espaçada: Combatendo o Esquecimento</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Revisar o material nos momentos certos resets a curva e consolida a memória de longo prazo.
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              {REVIEW_INTERVALS.map((interval, i) => (
                <div
                  key={interval}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20"
                >
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">R{i + 1}</div>
                  <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">{interval}</div>
                  <div className="mt-1 text-xs text-gray-500">≈ {[90, 95, 98, 99][i]}% retenção</div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              💡 <strong>Dica:</strong> Apps como Anki e Quizlet usam algoritmos de repetição espaçada baseados na curva de Ebbinghaus para otimizar o momento de cada revisão.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">📌 Fatores que afetam a retenção</h3>
            <ul className="grid gap-2 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-2">
              {[
                ["Significância emocional", "Memórias emocionais são retidas melhor (amígdala)."],
                ["Sono", "A consolidação da memória ocorre durante o sono REM."],
                ["Atenção", "Memórias não se formam sem atenção focada."],
                ["Contexto", "Lembrar é mais fácil no mesmo contexto do aprendizado."],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{title}:</span> {desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Stroop ── */}
      {tab === "stroop" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
            <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">🎨 O Efeito Stroop</h2>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              John Ridley Stroop (1935) descobriu que nomear a <strong>cor da tinta</strong> de uma palavra cujo significado é uma cor diferente é muito mais difícil — porque leitura e nomeação de cores competem por recursos cognitivos.
            </p>
          </div>

          {!stroopStarted && !stroopDone && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pronto para testar sua atenção?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Você verá palavras coloridas. Clique na <strong>cor da tinta</strong> — NÃO na palavra escrita. Seja rápido!
              </p>
              <button
                onClick={startStroop}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Play className="h-5 w-5" />
                Iniciar Teste ({STROOP_ITEMS.length} itens)
              </button>
            </div>
          )}

          {stroopStarted && !stroopDone && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Item {stroopIndex + 1} / {STROOP_ITEMS.length}</span>
                <span>✅ {stroopScore} &nbsp; ❌ {stroopErrors}</span>
              </div>

              {/* Word display */}
              <div
                className={`mb-6 rounded-2xl py-10 text-center text-5xl font-black transition-all ${
                  stroopFeedback === "correct" ? "bg-green-50 dark:bg-green-900/20" :
                  stroopFeedback === "wrong"   ? "bg-red-50 dark:bg-red-900/20" :
                  "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <span style={{ color: STROOP_ITEMS[stroopIndex].inkColor }}>
                  {STROOP_ITEMS[stroopIndex].word}
                </span>
                {stroopFeedback && (
                  <div className="mt-2 text-2xl">
                    {stroopFeedback === "correct" ? <CheckCircle className="mx-auto text-green-500 h-8 w-8" /> : <XCircle className="mx-auto text-red-500 h-8 w-8" />}
                  </div>
                )}
              </div>

              {/* Color buttons */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleStroopAnswer(c)}
                    className="rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stroopDone && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Teste Concluído!</h3>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-green-600">{stroopScore}</div>
                    <div className="text-xs text-gray-500">Acertos</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-red-500">{stroopErrors}</div>
                    <div className="text-xs text-gray-500">Erros</div>
                  </div>
                  <div className="rounded-xl bg-white p-3 dark:bg-gray-900">
                    <div className="text-2xl font-bold text-blue-600">{avgTime}ms</div>
                    <div className="text-xs text-gray-500">Tempo médio</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  ⏱ Tempo médio: <strong>{avgTime} ms</strong> —{" "}
                  {avgTime < 600
                    ? "Excelente! Controle cognitivo muito alto."
                    : avgTime <= 900
                    ? "Bom! Interferência moderada."
                    : "A interferência de Stroop foi forte — é normal!"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🧠 Por que é difícil?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A leitura é um processo automático no cérebro adulto — ela ocorre antes mesmo de você decidir ler. Por isso, o significado da palavra interfere na tarefa de nomear a cor. O córtex pré-frontal precisa inibir a resposta automática (ler) para executar a tarefa intencional (nomear a cor).
                </p>
              </div>

              <button
                onClick={startStroop}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4" /> Repetir teste
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Vieses Cognitivos ── */}
      {tab === "vieses" && (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-900/20">
            <h2 className="text-lg font-bold text-violet-800 dark:text-violet-300">🪞 Vieses Cognitivos</h2>
            <p className="mt-1 text-sm text-violet-700 dark:text-violet-400">
              Vieses cognitivos são padrões sistemáticos de desvio da racionalidade no julgamento. São atalhos mentais que economizam esforço — mas distorcem a realidade. Clique em cada viés para explorar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {BIASES.map((bias) => (
              <button
                key={bias.id}
                onClick={() => setSelectedBias(selectedBias?.id === bias.id ? null : bias)}
                className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  selectedBias?.id === bias.id
                    ? "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-900/20"
                    : "border-gray-200 bg-white hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{bias.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{bias.name}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{bias.description}</p>
                  </div>
                </div>

                {selectedBias?.id === bias.id && (
                  <div className="mt-4 space-y-3 border-t border-violet-200 pt-3 dark:border-violet-800">
                    <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                      <span className="text-xs font-semibold uppercase text-violet-600 dark:text-violet-400">Exemplo</span>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{bias.example}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                      <span className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">Como se proteger</span>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{bias.strategy}</p>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            Identificar um viés não é suficiente para eliminá-lo — mas aumenta a chance de você notar quando está acontecendo.
          </p>
        </div>
      )}
    </div>
  );
}
