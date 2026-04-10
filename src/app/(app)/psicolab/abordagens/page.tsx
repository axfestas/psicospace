"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface ClinicalCase {
  title: string;
  scenario: string;
  intervention: string;
  technique: string;
}

interface Approach {
  id: string;
  name: string;
  emoji: string;
  color: string;
  headerColor: string;
  founder: string;
  period: string;
  tagline: string;
  description: string;
  keyAssumptions: string[];
  keyConcepts: { term: string; definition: string }[];
  techniques: string[];
  clinicalCase: ClinicalCase;
  quote: { text: string; author: string };
}

const APPROACHES: Approach[] = [
  {
    id: "behaviorismo",
    name: "Behaviorismo",
    emoji: "🔬",
    color: "emerald",
    headerColor: "bg-emerald-500",
    founder: "John B. Watson, B. F. Skinner, Ivan Pavlov",
    period: "Séc. XX (1913–presente)",
    tagline: "O comportamento é moldado pelo ambiente e suas consequências.",
    description:
      "O Behaviorismo estuda apenas comportamentos observáveis e mensuráveis, ignorando processos mentais internos. O ser humano nasce como uma \"tábula rasa\" (folha em branco) e é moldado pelas experiências — reforços, punições e condicionamentos.",
    keyAssumptions: [
      "Apenas comportamentos observáveis são objeto da ciência",
      "Comportamento é aprendido por condicionamento (clássico ou operante)",
      "O ambiente determina o comportamento",
      "Reforço aumenta comportamento; punição diminui",
    ],
    keyConcepts: [
      { term: "Condicionamento Clássico", definition: "Associar um estímulo neutro a uma resposta já existente (Pavlov: sino → salivação)." },
      { term: "Condicionamento Operante", definition: "Comportamento muda conforme suas consequências: reforço positivo/negativo ou punição (Skinner)." },
      { term: "Reforço", definition: "Qualquer consequência que aumenta a probabilidade de um comportamento se repetir." },
      { term: "Extinção", definition: "Eliminação de um comportamento pela remoção do reforço que o mantinha." },
      { term: "Modelagem", definition: "Reforço gradual de aproximações sucessivas ao comportamento desejado." },
    ],
    techniques: [
      "Terapia Comportamental (TCC — parte comportamental)",
      "Dessensibilização sistemática (fobias)",
      "Economia de fichas (autismo, escolas)",
      "Reforço diferencial",
      "Treinamento de habilidades sociais",
    ],
    clinicalCase: {
      title: "Fobia de Elevadores",
      scenario:
        "Maria, 28 anos, evita elevadores desde um episódio em que ficou presa por 30 min. Agora sente pânico apenas de se aproximar do elevador.",
      intervention:
        "Dessensibilização sistemática: criar hierarquia de situações ansiogênicas (ver fotos de elevador → estar no corredor → entrar com porta aberta → subir 1 andar) e associar cada passo a relaxamento progressivo.",
      technique: "Condicionamento clássico reverso + exposição gradual",
    },
    quote: {
      text: "Dê-me uma dúzia de crianças saudáveis e meu próprio mundo especificado para criá-las, e eu garantirei que qualquer uma delas se tornará qualquer tipo de especialista que eu queira.",
      author: "John B. Watson",
    },
  },
  {
    id: "psicanalise",
    name: "Psicanálise",
    emoji: "🛋️",
    color: "violet",
    headerColor: "bg-violet-600",
    founder: "Sigmund Freud, Carl Jung, Melanie Klein",
    period: "Fin do Séc. XIX (1890–presente)",
    tagline: "O inconsciente é o motor do comportamento humano.",
    description:
      "A Psicanálise propõe que a maior parte da vida mental ocorre fora da consciência. Conflitos inconscientes, desejos reprimidos e experiências da infância determinam nossa personalidade e sofrimento psíquico.",
    keyAssumptions: [
      "A mente é composta por consciente, pré-consciente e inconsciente",
      "Conflitos não resolvidos na infância geram sintomas na vida adulta",
      "A libido (energia psíquica) se organiza em fases do desenvolvimento",
      "Mecanismos de defesa protegem o ego de ansiedades",
    ],
    keyConcepts: [
      { term: "Id, Ego e Superego", definition: "Id (impulsos primitivos), Ego (mediador racional), Superego (normas morais interiorizadas)." },
      { term: "Inconsciente", definition: "Repositório de memórias, desejos e conflitos reprimidos que influenciam o comportamento." },
      { term: "Mecanismos de Defesa", definition: "Estratégias do Ego para lidar com a ansiedade: repressão, projeção, racionalização, sublimação..." },
      { term: "Transferência", definition: "Processo pelo qual o paciente transfere sentimentos de relações passadas para o terapeuta." },
      { term: "Pulsão", definition: "Força motivacional que busca satisfação — pulsão de vida (Eros) e de morte (Tânatos)." },
    ],
    techniques: [
      "Associação livre (falar tudo que vem à mente)",
      "Interpretação dos sonhos",
      "Análise da transferência",
      "Interpretação de atos falhos (lapsus)",
      "Psicoterapia de longa duração",
    ],
    clinicalCase: {
      title: "Conflito com a Figura Paterna",
      scenario:
        "Carlos, 35 anos, tem dificuldade em relações com chefes e autoridades — sempre entra em conflito. Em sessões, percebe raiva intensa porém não consegue explicar sua origem.",
      intervention:
        "Análise da transferência: Carlos começa a tratar o terapeuta com a mesma hostilidade. O terapeuta nomeia esse padrão e facilita a elaboração da relação com o pai. A compreensão da origem reduz os conflitos atuais.",
      technique: "Análise da transferência + interpretação de conflitos inconscientes",
    },
    quote: {
      text: "A voz da inteligência é suave, mas não desiste até que alguém a ouça.",
      author: "Sigmund Freud",
    },
  },
  {
    id: "humanismo",
    name: "Humanismo",
    emoji: "🌱",
    color: "amber",
    headerColor: "bg-amber-500",
    founder: "Abraham Maslow, Carl Rogers, Viktor Frankl",
    period: "Séc. XX (1950s–presente)",
    tagline: "Todo ser humano tende naturalmente ao crescimento e à autorrealização.",
    description:
      "O Humanismo surge como \"terceira força\" (após psicanálise e behaviorismo), focando no potencial positivo humano. Cada pessoa possui recursos internos para crescer, e o terapeuta cria condições para que isso aconteça.",
    keyAssumptions: [
      "O ser humano é naturalmente bom e tende ao crescimento",
      "Cada pessoa é única e deve ser compreendida em sua totalidade",
      "A subjetividade e a experiência vivida têm valor científico",
      "O livre-arbítrio e a responsabilidade são centrais",
    ],
    keyConcepts: [
      { term: "Hierarquia de Maslow", definition: "Pirâmide de necessidades: fisiológicas → segurança → pertencimento → estima → autorrealização." },
      { term: "Autorrealização", definition: "Tendência humana a desenvolver plenamente o próprio potencial." },
      { term: "Consideração Positiva Incondicional", definition: "Aceitar o cliente sem julgamentos, criando ambiente seguro para crescimento." },
      { term: "Congruência", definition: "O terapeuta deve ser autêntico e genuíno na relação terapêutica (Rogers)." },
      { term: "Empatia", definition: "Capacidade de compreender o mundo interno do outro como se fosse o próprio." },
    ],
    techniques: [
      "Escuta ativa e reflexiva",
      "Terapia Centrada na Pessoa (Rogers)",
      "Logoterapia — busca de sentido (Frankl)",
      "Gestalt-terapia (Perls)",
      "Terapia existencial",
    ],
    clinicalCase: {
      title: "Crise de Sentido após Aposentadoria",
      scenario:
        "João, 62 anos, se aposentou e sente vazio e falta de propósito. Define sua identidade pelo trabalho e agora sente que \"não existe mais\".",
      intervention:
        "Terapia Centrada na Pessoa: o terapeuta oferece espaço de escuta genuína sem julgamento. João explora seus valores, identifica hobbies abandonados e gradualmente reconstrói um senso de identidade e propósito além do trabalho.",
      technique: "Consideração positiva incondicional + escuta reflexiva + exploração de valores",
    },
    quote: {
      text: "A vida é 10% o que acontece comigo e 90% como eu reajo a isso.",
      author: "Abraham Maslow",
    },
  },
  {
    id: "cognitivismo",
    name: "Cognitivismo",
    emoji: "💭",
    color: "blue",
    headerColor: "bg-blue-600",
    founder: "Aaron Beck, Albert Ellis, George Kelly",
    period: "Séc. XX (1960s–presente)",
    tagline: "Como pensamos determina como nos sentimos e agimos.",
    description:
      "O Cognitivismo estuda como os processos mentais — percepção, atenção, memória, raciocínio — influenciam o comportamento. Na clínica, identifica pensamentos automáticos e crenças disfuncionais que geram sofrimento.",
    keyAssumptions: [
      "Pensamentos, emoções e comportamentos se influenciam mutuamente",
      "Distorções cognitivas contribuem para transtornos psicológicos",
      "Mudando o pensamento, mudamos emoções e comportamentos",
      "A mente processa informações de forma ativa e construtiva",
    ],
    keyConcepts: [
      { term: "Pensamentos Automáticos", definition: "Pensamentos espontâneos e rápidos que influenciam emoções, frequentemente distorcidos." },
      { term: "Crenças Nucleares", definition: "Visões profundas e absolutas sobre si mesmo e o mundo (ex: \"Sou incapaz\")." },
      { term: "Distorções Cognitivas", definition: "Padrões sistemáticos de pensamento irracional: catastrofização, generalização, leitura mental..." },
      { term: "Reestruturação Cognitiva", definition: "Identificar e questionar pensamentos disfuncionais substituindo-os por mais realistas." },
      { term: "TCC", definition: "Terapia Cognitivo-Comportamental — une cognitivismo e behaviorismo para tratar transtornos." },
    ],
    techniques: [
      "Registro de pensamentos automáticos",
      "Reestruturação cognitiva (questionamento socrático)",
      "Experimentos comportamentais",
      "Resolução de problemas",
      "Mindfulness (TCC de 3ª onda)",
    ],
    clinicalCase: {
      title: "Ansiedade Social",
      scenario:
        "Ana, 22 anos, evita apresentações na faculdade por acreditar que \"todos vão perceber que sou burra\" e \"vou fazer papel de ridícula\". Isso limita muito sua vida acadêmica.",
      intervention:
        "TCC: Identificar pensamentos automáticos (\"Todos me julgam\"). Questionamento socrático: \"Qual a evidência para isso? Existe outra explicação?\". Experimento comportamental: fazer uma pequena apresentação e observar o resultado real vs. o catastrofizado.",
      technique: "Registro de pensamentos + reestruturação cognitiva + experimento comportamental",
    },
    quote: {
      text: "Não são as coisas em si que perturbam os homens, mas as opiniões que têm a respeito dessas coisas.",
      author: "Epicteto (precursor do pensamento cognitivo)",
    },
  },
];

export default function AbordagensPage() {
  const [activeApproach, setActiveApproach] = useState<string>("behaviorismo");
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [caseVisible, setCaseVisible] = useState(false);

  const approach = APPROACHES.find((a) => a.id === activeApproach)!;

  const colorMap: Record<string, { tab: string; active: string; badge: string; card: string; quote: string }> = {
    emerald: {
      tab: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
      active: "bg-emerald-500 text-white",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      card: "border-emerald-200 dark:border-emerald-800",
      quote: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
    },
    violet: {
      tab: "hover:bg-violet-50 dark:hover:bg-violet-900/20",
      active: "bg-violet-600 text-white",
      badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
      card: "border-violet-200 dark:border-violet-800",
      quote: "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800",
    },
    amber: {
      tab: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
      active: "bg-amber-500 text-white",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      card: "border-amber-200 dark:border-amber-800",
      quote: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    },
    blue: {
      tab: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
      active: "bg-blue-600 text-white",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      card: "border-blue-200 dark:border-blue-800",
      quote: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    },
  };

  const colors = colorMap[approach.color];

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
          📖 Lab de Abordagens
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Lab de Abordagens Psicológicas
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Explore as principais teorias que fundamentam a Psicologia moderna. Conceitos, técnicas
          e casos clínicos ilustrativos.
        </p>
      </div>

      {/* Approach tabs */}
      <div className="flex flex-wrap gap-2">
        {APPROACHES.map((a) => {
          const c = colorMap[a.color];
          return (
            <button
              key={a.id}
              onClick={() => {
                setActiveApproach(a.id);
                setCaseVisible(false);
                setExpandedConcept(null);
              }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeApproach === a.id
                  ? c.active + " border-transparent"
                  : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 " + c.tab
              }`}
            >
              <span>{a.emoji}</span>
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Approach content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Header card */}
          <div className={`rounded-2xl border bg-white p-5 dark:bg-gray-900 ${colors.card}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{approach.emoji}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {approach.name}
                  </h2>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500">{approach.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 ${colors.badge}`}>
                👤 {approach.founder}
              </span>
              <span className={`rounded-full px-2.5 py-1 ${colors.badge}`}>
                📅 {approach.period}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {approach.description}
            </p>
          </div>

          {/* Key assumptions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Premissas Fundamentais
            </h3>
            <ul className="space-y-2">
              {approach.keyAssumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${approach.headerColor}`}>
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Key concepts (accordion) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Conceitos-Chave
            </h3>
            <div className="space-y-2">
              {approach.keyConcepts.map((concept) => (
                <div
                  key={concept.term}
                  className={`rounded-xl border transition-colors ${colors.card}`}
                >
                  <button
                    className="flex w-full items-center justify-between p-3 text-left"
                    onClick={() =>
                      setExpandedConcept(
                        expandedConcept === concept.term ? null : concept.term
                      )
                    }
                  >
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {concept.term}
                    </span>
                    {expandedConcept === concept.term ? (
                      <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    )}
                  </button>
                  {expandedConcept === concept.term && (
                    <div className="border-t border-gray-100 px-3 pb-3 pt-2 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      {concept.definition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical case */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setCaseVisible((v) => !v)}
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                📋 Caso Clínico Ilustrativo: {approach.clinicalCase.title}
              </h3>
              {caseVisible ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {caseVisible && (
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Situação
                  </span>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {approach.clinicalCase.scenario}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Intervenção
                  </span>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {approach.clinicalCase.intervention}
                  </p>
                </div>
                <div className={`rounded-lg border px-3 py-2 text-xs ${colors.quote}`}>
                  <strong>Técnica utilizada:</strong> {approach.clinicalCase.technique}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Techniques */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Técnicas & Intervenções
            </h3>
            <ul className="space-y-2">
              {approach.techniques.map((tech, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm">🛠️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quote */}
          <div className={`rounded-2xl border p-4 ${colors.quote}`}>
            <div className="mb-2 text-2xl">&ldquo;</div>
            <p className="text-sm italic leading-relaxed text-gray-700 dark:text-gray-300">
              {approach.quote.text}
            </p>
            <p className="mt-2 text-right text-xs font-semibold text-gray-500">
              — {approach.quote.author}
            </p>
          </div>

          {/* Compare hint */}
          <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            💡 <strong>Compare as abordagens:</strong> o mesmo caso de fobia seria tratado de
            formas completamente diferentes por um behaviorista (exposição gradual), um psicanalista
            (explorar o significado inconsciente), um humanista (empoderamento e autoconhecimento) e
            um cognitivista (identificar pensamentos catastróficos).
          </div>
        </div>
      </div>
    </div>
  );
}
