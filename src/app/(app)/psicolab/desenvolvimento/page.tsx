"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type Theorist = "piaget" | "erikson";

interface PiagetStage {
  age: string;
  name: string;
  key: string;
  description: string;
  abilities: string[];
  limitations: string[];
  example: string;
  color: string;
}

interface EriksonStage {
  age: string;
  crisis: string;
  virtue: string;
  description: string;
  positive: string;
  negative: string;
  example: string;
  color: string;
}

const PIAGET_STAGES: PiagetStage[] = [
  {
    age: "0–2 anos",
    name: "Sensório-Motor",
    key: "Permanência do objeto",
    description: "A criança aprende sobre o mundo através dos sentidos e ações motoras. O pensamento ainda não existe de forma simbólica.",
    abilities: ["Reflexos → ações intencionais", "Permanência do objeto (8-12m)", "Início de imitação diferida"],
    limitations: ["Sem representação mental", "Egocêntrico (ainda sem teoria da mente)", "Sem linguagem complexa"],
    example: "Um bebê chora quando o brinquedo some — ainda está descobrindo que objetos existem mesmo fora do campo visual.",
    color: "sky",
  },
  {
    age: "2–7 anos",
    name: "Pré-Operacional",
    key: "Pensamento simbólico sem lógica",
    description: "A criança desenvolve linguagem e pensamento simbólico, mas ainda não consegue operar mentalmente (reversibilidade, conservação).",
    abilities: ["Linguagem e símbolos", "Jogo de faz-de-conta", "Pensamento egocêntrico", "Animismo (objetos têm vida)"],
    limitations: ["Sem conservação (volume, número)", "Irreversibilidade do pensamento", "Centração (foca em 1 aspecto)"],
    example: "Derrame água de um copo alto para um largo — a criança acha que há menos água, pois o nível ficou mais baixo.",
    color: "emerald",
  },
  {
    age: "7–12 anos",
    name: "Operacional Concreto",
    key: "Lógica com objetos concretos",
    description: "Surge a capacidade de pensar logicamente, mas apenas sobre objetos e situações concretas, não abstratas.",
    abilities: ["Conservação adquirida", "Reversibilidade", "Classificação e seriação", "Menos egocentrismo"],
    limitations: ["Dificuldade com abstrações", "Raciocínio hipotético limitado", "Lógica ligada ao contexto físico"],
    example: "A criança entende que a bola de argila achatada tem a mesma quantidade — porque pode ser refeita (reversibilidade).",
    color: "amber",
  },
  {
    age: "12+ anos",
    name: "Operacional Formal",
    key: "Pensamento abstrato e hipotético",
    description: "Surge a capacidade de raciocinar sobre hipóteses, abstrações e possibilidades — não apenas sobre o concreto.",
    abilities: ["Raciocínio hipotético-dedutivo", "Pensamento abstrato", "Metapensamento (pensar sobre pensar)", "Raciocínio moral complexo"],
    limitations: ["Nem todos atingem completamente", "Pode variar por domínio", "Adolescente pode ter pensamento idealista extremo"],
    example: "O adolescente consegue raciocinar: 'Se eu tivesse nascido em outro país, minha visão de mundo seria diferente?'",
    color: "violet",
  },
];

const ERIKSON_STAGES: EriksonStage[] = [
  {
    age: "0–1 ano",
    crisis: "Confiança vs. Desconfiança",
    virtue: "Esperança",
    description: "O bebê aprende se o mundo é confiável com base na consistência do cuidado recebido.",
    positive: "Confiança básica: o mundo é seguro e as necessidades serão atendidas.",
    negative: "Desconfiança: ansiedade, insegurança, dificuldade de confiar nas relações.",
    example: "Cuidadores responsivos que atende às necessidades do bebê promovem confiança básica.",
    color: "sky",
  },
  {
    age: "1–3 anos",
    crisis: "Autonomia vs. Vergonha e Dúvida",
    virtue: "Vontade",
    description: "A criança começa a afirmar controle e independência sobre si mesma.",
    positive: "Senso de autonomia e autocontrole. 'Eu posso fazer sozinho!'",
    negative: "Vergonha e dúvida sobre as próprias capacidades, dependência excessiva.",
    example: "Deixar a criança escolher a roupa ou se alimentar sozinha — mesmo com bagunça.",
    color: "emerald",
  },
  {
    age: "3–6 anos",
    crisis: "Iniciativa vs. Culpa",
    virtue: "Propósito",
    description: "A criança começa a tomar iniciativas, planejar e executar tarefas por conta própria.",
    positive: "Senso de propósito, capacidade de liderar e planejar.",
    negative: "Culpa excessiva quando a iniciativa é punida ou ridicularizada.",
    example: "Encorajar projetos criativos e brincar de faz-de-conta desenvolve a iniciativa.",
    color: "amber",
  },
  {
    age: "6–12 anos",
    crisis: "Produtividade vs. Inferioridade",
    virtue: "Competência",
    description: "A criança aprende habilidades acadêmicas e sociais, comparando-se aos pares.",
    positive: "Senso de competência e orgulho pelas realizações.",
    negative: "Sentimento de inferioridade quando fracassa repetidamente ou é comparada negativamente.",
    example: "Feedback focado no esforço ('você tentou muito!') versus resultado protege contra inferioridade.",
    color: "lime",
  },
  {
    age: "12–18 anos",
    crisis: "Identidade vs. Confusão de Papel",
    virtue: "Fidelidade",
    description: "O adolescente explora diferentes papéis e identidades para desenvolver um senso coerente de self.",
    positive: "Identidade integrada: quem sou, o que valorizo, quais são meus objetivos.",
    negative: "Confusão de papel: incerteza sobre si mesmo, adoção de identidades negativas.",
    example: "Adolescente que experimenta estilos, grupos, crenças está saudavelmente explorando a identidade.",
    color: "orange",
  },
  {
    age: "18–40 anos",
    crisis: "Intimidade vs. Isolamento",
    virtue: "Amor",
    description: "O adulto jovem busca relações íntimas profundas e comprometidas.",
    positive: "Capacidade de amor e amizades profundas e comprometidas.",
    negative: "Isolamento, solidão, dificuldade de se comprometer.",
    example: "Relações íntimas exigem que a identidade esteja suficientemente consolidada da fase anterior.",
    color: "rose",
  },
  {
    age: "40–65 anos",
    crisis: "Generatividade vs. Estagnação",
    virtue: "Cuidado",
    description: "O adulto busca contribuir para a próxima geração — filhos, trabalho, comunidade.",
    positive: "Generatividade: legado, mentoria, criação, contribuição social.",
    negative: "Estagnação: ensimesmamento, sensação de vida sem propósito.",
    example: "Mentorear jovens profissionais ou criar arte para as próximas gerações são formas de generatividade.",
    color: "indigo",
  },
  {
    age: "65+ anos",
    crisis: "Integridade vs. Desespero",
    virtue: "Sabedoria",
    description: "O idoso olha para a vida e avalia se ela foi significativa e bem vivida.",
    positive: "Integridade: paz com a própria história, sabedoria.",
    negative: "Desespero: arrependimento profundo, amargura, medo da morte.",
    example: "Pessoas que resolversm as crises anteriores tendem a chegar aqui com maior integridade.",
    color: "violet",
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; bar: string }> = {
  sky:     { border: "border-sky-200 dark:border-sky-800",     bg: "bg-sky-50 dark:bg-sky-900/20",     text: "text-sky-700 dark:text-sky-300",     badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",     bar: "bg-sky-500" },
  emerald: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", bar: "bg-emerald-500" },
  amber:   { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-300",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",   bar: "bg-amber-500" },
  violet:  { border: "border-violet-200 dark:border-violet-800", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", bar: "bg-violet-500" },
  lime:    { border: "border-lime-200 dark:border-lime-800",     bg: "bg-lime-50 dark:bg-lime-900/20",     text: "text-lime-700 dark:text-lime-300",     badge: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",     bar: "bg-lime-500" },
  orange:  { border: "border-orange-200 dark:border-orange-800", bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", bar: "bg-orange-500" },
  rose:    { border: "border-rose-200 dark:border-rose-800",     bg: "bg-rose-50 dark:bg-rose-900/20",     text: "text-rose-700 dark:text-rose-300",     badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",     bar: "bg-rose-500" },
  indigo:  { border: "border-indigo-200 dark:border-indigo-800", bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", bar: "bg-indigo-500" },
};

export default function DesenvolvimentoPage() {
  const [theorist, setTheorist] = useState<Theorist>("piaget");
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const piagetStage = PIAGET_STAGES[selectedStage];
  const eriksonStage = ERIKSON_STAGES[selectedStage];

  const stages = theorist === "piaget" ? PIAGET_STAGES : ERIKSON_STAGES;
  const current = stages[selectedStage];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Desenvolvimento Humano</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Piaget & Erikson — Da Infância à Vida Adulta</p>
        </div>
      </div>

      {/* Theorist switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => { setTheorist("piaget"); setSelectedStage(0); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            theorist === "piaget"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          🧩 Piaget — Desenvolvimento Cognitivo
        </button>
        <button
          onClick={() => { setTheorist("erikson"); setSelectedStage(0); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            theorist === "erikson"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          🌱 Erikson — Desenvolvimento Psicossocial
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute left-0 top-5 h-1 rounded-full bg-lime-500 transition-all duration-500"
          style={{ width: `${((selectedStage + 1) / stages.length) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {stages.map((s, i) => {
            const cc = colorMap[s.color];
            return (
              <button
                key={i}
                onClick={() => setSelectedStage(i)}
                className={`flex flex-col items-center gap-1 transition-all`}
              >
                <div
                  className={`z-10 h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    selectedStage === i
                      ? `${cc.bar} border-transparent text-white shadow-lg scale-110`
                      : i < selectedStage
                      ? "border-lime-400 bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300"
                      : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-900"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 text-center max-w-[60px]">
                  {s.age}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage detail */}
      {theorist === "piaget" && (
        <div className={`rounded-2xl border-2 p-6 space-y-4 ${colorMap[piagetStage.color].border} ${colorMap[piagetStage.color].bg}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-semibold uppercase ${colorMap[piagetStage.color].text}`}>{piagetStage.age}</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{piagetStage.name}</h2>
              <p className={`text-sm font-medium ${colorMap[piagetStage.color].text}`}>🔑 {piagetStage.key}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{piagetStage.description}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">✅ Novas habilidades</p>
              <ul className="space-y-1">
                {piagetStage.abilities.map((a) => (
                  <li key={a} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">⚠️ Limitações</p>
              <ul className="space-y-1">
                {piagetStage.limitations.map((l) => (
                  <li key={l} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5">•</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
            <p className="text-xs font-semibold text-gray-500 mb-1">💡 Exemplo prático</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{piagetStage.example}</p>
          </div>
        </div>
      )}

      {theorist === "erikson" && (
        <div className={`rounded-2xl border-2 p-6 space-y-4 ${colorMap[eriksonStage.color].border} ${colorMap[eriksonStage.color].bg}`}>
          <div>
            <span className={`text-xs font-semibold uppercase ${colorMap[eriksonStage.color].text}`}>{eriksonStage.age}</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{eriksonStage.crisis}</h2>
            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold mt-1 ${colorMap[eriksonStage.color].badge}`}>
              Virtude: {eriksonStage.virtue}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{eriksonStage.description}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">✅ Resolução positiva</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{eriksonStage.positive}</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
              <p className="text-xs font-semibold text-red-500 mb-1">❌ Resolução negativa</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{eriksonStage.negative}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-900/40">
            <p className="text-xs font-semibold text-gray-500 mb-1">💡 Exemplo</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">{eriksonStage.example}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedStage((s) => Math.max(0, s - 1))}
          disabled={selectedStage === 0}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="text-sm text-gray-400 dark:text-gray-500">{selectedStage + 1} / {stages.length}</span>
        <button
          onClick={() => setSelectedStage((s) => Math.min(stages.length - 1, s + 1))}
          disabled={selectedStage === stages.length - 1}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Comparison note */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">🔄 Piaget vs. Erikson</h3>
        <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Piaget</p>
            <p>Foco no desenvolvimento <strong>cognitivo</strong>. Como a criança pensa e constrói conhecimento. 4 estágios universais até a adolescência.</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Erikson</p>
            <p>Foco no desenvolvimento <strong>psicossocial</strong>. Como o indivíduo se relaciona com o mundo ao longo de toda a vida. 8 crises do nascimento à velhice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
