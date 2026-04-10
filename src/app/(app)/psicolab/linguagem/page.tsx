"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type TopicId = "sapir_whorf" | "framing" | "linguagem_neutra" | "vygotsky";

interface FramingDemo {
  scenario: string;
  positiveFrame: string;
  negativeFrame: string;
  question: string;
  positiveEffect: string;
  negativeEffect: string;
}

interface SapirExperiment {
  language: string;
  flag: string;
  example: string;
  implication: string;
}

interface Topic {
  id: TopicId;
  name: string;
  emoji: string;
  color: string;
  subtitle: string;
  description: string;
}

const TOPICS: Topic[] = [
  { id: "sapir_whorf", name: "Hipótese de Sapir-Whorf", emoji: "🌍", color: "violet", subtitle: "A língua molda o pensamento?", description: "A hipótese linguística da relatividade propõe que a língua que falamos influencia (ou determina) a forma como pensamos e percebemos a realidade." },
  { id: "framing", name: "Framing Persuasivo", emoji: "🖼️", color: "amber", subtitle: "Como o enquadramento muda tudo", description: "O framing é o modo como uma informação é apresentada — o enquadramento da mensagem afeta profundamente julgamentos e decisões, mesmo sem alterar os fatos." },
  { id: "linguagem_neutra", name: "Linguagem Neutra", emoji: "⚖️", color: "emerald", subtitle: "Gênero, inclusão e cognição", description: "O debate sobre linguagem de gênero e suas implicações cognitivas, sociais e práticas — o que a ciência diz sobre como nomear influencia percepção." },
  { id: "vygotsky", name: "Linguagem e Pensamento (Vygotsky)", emoji: "🗣️", color: "blue", subtitle: "Fala interna e zona de desenvolvimento", description: "Lev Vygotsky propôs que linguagem e pensamento são inicialmente separados mas se integram, e que a fala interna é a voz do raciocínio." },
];

const SAPIR_EXAMPLES: SapirExperiment[] = [
  {
    language: "Hopi (nativos americanos)",
    flag: "🏔️",
    example: "Não possui palavras para passado/futuro — o tempo é expresso como processo contínuo, não como linha.",
    implication: "Falantes Hopi percebem o tempo de forma cíclica e processual, não linear.",
  },
  {
    language: "Pirahã (Amazônia)",
    flag: "🌿",
    example: "Sem números, cores distintas ou conceito de recursão gramatical. Sem tempo passado ou futuro.",
    implication: "Daniel Everett argumenta que isso limita conceitos abstratos — gerando debate intenso na linguística.",
  },
  {
    language: "Russo",
    flag: "🇷🇺",
    example: "Tem dois termos distintos para azul claro (goluboy) e azul escuro (siniy), tratados como cores diferentes.",
    implication: "Falantes russos discriminam mais rápido tons de azul — efeito comprovado em experimentos de tempo de reação.",
  },
  {
    language: "Guugu Ymithirr (Austrália)",
    flag: "🦘",
    example: "Usa somente direções absolutas (Norte, Sul, Leste, Oeste) — nunca 'à esquerda' ou 'à direita'.",
    implication: "Falantes têm sentido de orientação absoluto notavelmente preciso — a língua obriga o rastreamento contínuo do espaço.",
  },
];

const FRAMING_DEMOS: FramingDemo[] = [
  {
    scenario: "Tratamento médico",
    positiveFrame: "Este procedimento tem 90% de taxa de sobrevivência.",
    negativeFrame: "Este procedimento tem 10% de taxa de mortalidade.",
    question: "Qual versão tornaria você mais disposto a fazer o procedimento?",
    positiveEffect: "A maioria das pessoas aceita mais o tratamento — mesmo sendo a mesma informação.",
    negativeEffect: "A maioria hesita mais — o foco na perda ativa o sistema de aversão.",
  },
  {
    scenario: "Carne em embalagem",
    positiveFrame: "Este produto é 95% sem gordura.",
    negativeFrame: "Este produto contém 5% de gordura.",
    question: "Qual parece mais saudável?",
    positiveEffect: "Parece mais saudável e vende mais — mesmo sendo idêntico.",
    negativeEffect: "Parece menos saudável — 'gordura' é aversivo semanticamente.",
  },
  {
    scenario: "Política econômica",
    positiveFrame: "Esta política vai criar 200.000 empregos.",
    negativeFrame: "Esta política não vai resolver o desemprego de 800.000 pessoas.",
    question: "Qual versão gera mais apoio?",
    positiveEffect: "Gera mais aprovação — foco em ganho (gain frame).",
    negativeEffect: "Gera mais resistência — foco em perda (loss frame). Kahneman: perdas pesam 2x mais que ganhos.",
  },
];

const GENDER_POINTS = [
  { pro: "Representação importa: o uso do masculino genérico pode reduzir a visibilidade mental de mulheres", con: "Mudanças na língua são lentas e resistidas — não necessariamente refletem mudança de atitude" },
  { pro: "Estudos mostram que linguagem inclusiva aumenta a inclusão mental de todos os gêneros em representações", con: "Há debate sobre se neologismos artificiais (ex: 'elu') são aceitos e usados espontaneamente" },
  { pro: "O francês, espanhol e português usam masculino genérico — isso afeta a percepção de profissões", con: "Algumas línguas (ex: finlandês, turco) são neutras em gênero sem evidência de maior igualdade" },
  { pro: "Linguagem de gênero neutro está associada a percepções mais igualitárias em experimentos laboratoriais", con: "A relação causal entre linguagem e atitudes ainda é debatida — correlação ≠ causalidade" },
];

const VYGOTSKY_CONCEPTS = [
  {
    name: "Zona de Desenvolvimento Proximal (ZDP)",
    emoji: "🎯",
    description: "A distância entre o que a criança faz sozinha e o que pode fazer com ajuda de alguém mais capaz. O aprendizado ocorre nessa zona.",
    example: "Uma criança não consegue resolver um problema de matemática sozinha, mas com um adulto guiando por perguntas, consegue.",
  },
  {
    name: "Andaimento (Scaffolding)",
    emoji: "🏗️",
    description: "Suporte temporário oferecido por um adulto ou par mais competente para que a criança realize tarefas além de sua capacidade atual.",
    example: "O professor que não dá a resposta direta, mas faz perguntas que levam a criança a raciocinar e encontrar a solução.",
  },
  {
    name: "Fala Privada",
    emoji: "🗣️",
    description: "A fala que as crianças pequenas fazem para si mesmas enquanto resolvem problemas. Para Vygotsky, é a transição entre fala social e pensamento verbal interno.",
    example: "Uma criança que diz em voz alta 'agora vou pegar a peça azul... coloco aqui...' enquanto resolve um quebra-cabeça.",
  },
  {
    name: "Fala Interna (Discurso Interior)",
    emoji: "💭",
    description: "A fala internalizada — o diálogo silencioso que usamos para pensar, planejar e regular comportamento. É a linguagem transformada em pensamento.",
    example: "Quando você 'ouve' sua própria voz enquanto lê este texto ou planeja sua resposta antes de falar.",
  },
  {
    name: "Instrumentos e Mediação",
    emoji: "🔧",
    description: "Para Vygotsky, a linguagem é o principal instrumento psicológico — uma ferramenta cultural que medeia todas as funções cognitivas superiores.",
    example: "Usar linguagem para memorizar (criar uma história para lembrar uma lista) transforma uma capacidade cognitiva.",
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; btn: string }> = {
  violet:  { border: "border-violet-200 dark:border-violet-800", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", btn: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300" },
  amber:   { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-300",   btn: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300" },
  emerald: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", btn: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" },
  blue:    { border: "border-blue-200 dark:border-blue-800",     bg: "bg-blue-50 dark:bg-blue-900/20",     text: "text-blue-700 dark:text-blue-300",     btn: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300" },
};

export default function LinguagemPage() {
  const [topic, setTopic] = useState<TopicId>("sapir_whorf");
  const [framingRevealed, setFramingRevealed] = useState<number[]>([]);

  const topicData = TOPICS.find((t) => t.id === topic)!;
  const cc = colorMap[topicData.color];

  const revealFraming = (i: number) => {
    setFramingRevealed((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Linguagem e Pensamento</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Como palavras moldam a mente</p>
        </div>
      </div>

      {/* Topic selector */}
      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map((t) => {
          const tcc = colorMap[t.color];
          return (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                topic === t.id ? `${tcc.border} ${tcc.bg}` : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <div className="text-3xl mb-2">{t.emoji}</div>
              <h3 className={`font-bold text-sm ${topic === t.id ? tcc.text : "text-gray-800 dark:text-gray-200"}`}>{t.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Topic intro */}
      <div className={`rounded-2xl border-2 p-5 ${cc.border} ${cc.bg}`}>
        <h2 className={`text-lg font-bold ${cc.text}`}>{topicData.emoji} {topicData.name}</h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{topicData.description}</p>
      </div>

      {/* ── SAPIR-WHORF ── */}
      {topic === "sapir_whorf" && (
        <div className="space-y-4">
          <div className="grid gap-1 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-violet-200 bg-white p-4 dark:border-violet-800 dark:bg-gray-900">
              <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-1">Versão Forte (Determinismo)</h3>
              <p className="text-gray-600 dark:text-gray-400">A língua <em>determina</em> o pensamento — sem palavra para um conceito, impossível pensá-lo. (Benjamin Lee Whorf)</p>
              <p className="mt-1 text-xs text-gray-400">⚠️ Amplamente refutada — podemos pensar em conceitos sem palavras para eles.</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-white p-4 dark:border-violet-800 dark:bg-gray-900">
              <h3 className="font-semibold text-violet-700 dark:text-violet-300 mb-1">Versão Fraca (Relatividade)</h3>
              <p className="text-gray-600 dark:text-gray-400">A língua <em>influencia</em> alguns processos cognitivos, como percepção de cores, tempo e espaço. (versão atual)</p>
              <p className="mt-1 text-xs text-green-500">✅ Suportada por evidências experimentais recentes.</p>
            </div>
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-gray-200">🔬 Evidências ao redor do mundo</h3>
          <div className="space-y-3">
            {SAPIR_EXAMPLES.map((ex) => (
              <div key={ex.language} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{ex.flag}</span>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{ex.language}</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ex.example}</p>
                <div className="rounded-lg bg-violet-50 border border-violet-100 p-2 dark:bg-violet-900/20 dark:border-violet-900">
                  <p className="text-xs text-violet-700 dark:text-violet-300"><strong>Implicação cognitiva:</strong> {ex.implication}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FRAMING ── */}
      {topic === "framing" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              📌 Daniel Kahneman e Amos Tversky (1981) demostraram que como apresentamos uma informação muda radicalmente as decisões — mesmo quando os fatos são idênticos. Isso é o <strong>Efeito de Enquadramento</strong>.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Leia os enquadramentos abaixo e clique para revelar o efeito de cada um:</p>
          {FRAMING_DEMOS.map((demo, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Cenário: {demo.scenario}</h3>
              <p className="text-xs text-gray-400 mb-3 italic">&ldquo;{demo.question}&rdquo;</p>
              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 dark:bg-green-900/20 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Versão A (Enquadramento positivo)</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">&ldquo;{demo.positiveFrame}&rdquo;</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Versão B (Enquadramento negativo)</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">&ldquo;{demo.negativeFrame}&rdquo;</p>
                </div>
              </div>
              <button
                onClick={() => revealFraming(i)}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${cc.btn}`}
              >
                {framingRevealed.includes(i) ? "Ocultar efeito" : "Revelar efeito do enquadramento"}
              </button>
              {framingRevealed.includes(i) && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                    <p className="text-xs text-green-700 dark:text-green-300">✅ A: {demo.positiveEffect}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                    <p className="text-xs text-red-700 dark:text-red-300">⚠️ B: {demo.negativeEffect}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LINGUAGEM NEUTRA ── */}
      {topic === "linguagem_neutra" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              ⚖️ Este é um tópico com perspectivas diversas. Apresentamos os pontos da pesquisa científica <em>sem</em> assumir posição política.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🔬 O que a pesquisa mostra</h3>
            <div className="space-y-3">
              {GENDER_POINTS.map((p, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 dark:bg-emerald-900/20 dark:border-emerald-900">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">✅ Evidência</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{p.pro}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 dark:bg-amber-900/20 dark:border-amber-900">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">⚠️ Limitação / Contraponto</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{p.con}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🌍 Variedade entre línguas</h4>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              {[
                ["Marcado em gênero", "Português, espanhol, francês, árabe — gênero gramatical permeia toda a língua"],
                ["Parcialmente marcado", "Inglês — pronomes de gênero mas não gênero gramatical em substantivos"],
                ["Neutro em gênero", "Finlandês, húngaro, turco — sem gênero gramatical; pronome único para todos"],
              ].map(([type, desc]) => (
                <div key={type} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <p className="font-medium text-gray-700 dark:text-gray-300">{type}</p>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VYGOTSKY ── */}
      {topic === "vygotsky" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🗣️ Para Vygotsky, pensamento e linguagem têm origens separadas mas se integram no desenvolvimento — a linguagem não apenas expressa o pensamento, ela o <strong>constitui</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {VYGOTSKY_CONCEPTS.map((c) => (
              <div key={c.name} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{c.name}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
                    <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 p-2 dark:bg-blue-900/20 dark:border-blue-900">
                      <p className="text-xs text-blue-700 dark:text-blue-300"><strong>Exemplo:</strong> {c.example}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🔄 Vygotsky vs. Piaget</h4>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Piaget</p>
                <p>Desenvolvimento cognitivo precede a linguagem. A criança primeiro desenvolve conceitos, depois encontra as palavras. O social é secundário.</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Vygotsky</p>
                <p>O social e a linguagem impulsionam o desenvolvimento cognitivo. Aprendemos de fora para dentro — do social para o individual.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
