"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

interface NeuronPart {
  id: string;
  name: string;
  description: string;
  functions: string[];
}

const NEURON_PARTS: NeuronPart[] = [
  {
    id: "dendrites",
    name: "Dendritos",
    description:
      "Extensões ramificadas do corpo celular que recebem sinais elétricos e químicos de outros neurônios.",
    functions: [
      "Receber sinais de outros neurônios",
      "Integrar informações de múltiplas fontes",
      "Conduzir impulsos em direção ao corpo celular",
    ],
  },
  {
    id: "soma",
    name: "Corpo Celular (Soma)",
    description:
      "Núcleo do neurônio. Contém o núcleo celular e organelas essenciais para a vida e função da célula.",
    functions: [
      "Manutenção e metabolismo celular",
      "Síntese de proteínas e neurotransmissores",
      "Integração dos sinais recebidos pelos dendritos",
      "Tomada de decisão: disparar ou não o potencial de ação",
    ],
  },
  {
    id: "axon_hillock",
    name: "Cone de Implantação",
    description:
      "Região de transição entre o soma e o axônio. É aqui que o potencial de ação é gerado quando o limiar de disparo é atingido.",
    functions: [
      "Integração final dos impulsos do soma",
      "Geração do potencial de ação",
      "Ponto de decisão tudo-ou-nada",
    ],
  },
  {
    id: "axon",
    name: "Axônio",
    description:
      "Extensão longa e fina que conduz o potencial de ação do corpo celular até os terminais axônicos.",
    functions: [
      "Transmissão do potencial de ação a longas distâncias",
      "Condução saltatória (entre os nodos de Ranvier)",
      "Transporte axônico de substâncias",
    ],
  },
  {
    id: "myelin",
    name: "Bainha de Mielina",
    description:
      "Camada isolante de lipídios formada pelas células de Schwann (SNP) ou oligodendrócitos (SNC) que envolve o axônio.",
    functions: [
      "Isolamento elétrico do axônio",
      "Aceleração da condução nervosa (até 100× mais rápida)",
      "Redução do gasto energético da transmissão",
    ],
  },
  {
    id: "node",
    name: "Nodo de Ranvier",
    description:
      "Intervalos regulares sem mielina ao longo do axônio. Permitem a condução saltatória do impulso nervoso.",
    functions: [
      "Regeneração do potencial de ação",
      "Condução saltatória (impulso 'pula' entre nodos)",
      "Aumento da velocidade de condução",
    ],
  },
  {
    id: "terminals",
    name: "Terminais Axônicos",
    description:
      "Ramificações na extremidade do axônio que formam sinapses com a célula seguinte (neurônio, músculo ou glândula).",
    functions: [
      "Armazenamento de vesículas sinápticas",
      "Liberação de neurotransmissores",
      "Formação da fenda sináptica",
    ],
  },
];

// ──────────────────────────────────────────────
// Synapse data
// ──────────────────────────────────────────────

interface NeurotransmitterInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  dotColor: string;
  type: string;
  effects: string[];
  diseases: string[];
}

const NEUROTRANSMITTERS: NeurotransmitterInfo[] = [
  {
    id: "glutamate",
    name: "Glutamato",
    emoji: "⚡",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    dotColor: "#F59E0B",
    type: "Excitatório",
    effects: [
      "Excita neurônios pós-sinápticos",
      "Fundamental para aprendizagem e memória (LTP)",
      "Mais abundante no SNC",
    ],
    diseases: ["Excesso: epilepsia, excitotoxicidade", "Alterações: esquizofrenia, depressão"],
  },
  {
    id: "gaba",
    name: "GABA",
    emoji: "🛑",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    dotColor: "#3B82F6",
    type: "Inibitório",
    effects: [
      "Inibe neurônios pós-sinápticos",
      "Reduz excitabilidade neuronal",
      "Principal inibitório do SNC",
    ],
    diseases: ["Déficit: ansiedade, epilepsia, insônia", "Alvo dos benzodiazepínicos"],
  },
  {
    id: "dopamine",
    name: "Dopamina",
    emoji: "🎯",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    dotColor: "#F43F5E",
    type: "Modulatório",
    effects: [
      "Regulação de recompensa e prazer",
      "Controle de movimentos voluntários",
      "Motivação e reforço de comportamentos",
    ],
    diseases: ["Déficit: Parkinson (controle motor)", "Excesso: esquizofrenia", "Disfunção: dependência química"],
  },
  {
    id: "serotonin",
    name: "Serotonina",
    emoji: "😊",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    dotColor: "#10B981",
    type: "Modulatório",
    effects: [
      "Regulação do humor e bem-estar",
      "Controle do sono e apetite",
      "Redução da dor",
    ],
    diseases: ["Déficit: depressão, ansiedade, TOC", "Alvo dos antidepressivos (ISRS)"],
  },
  {
    id: "acetylcholine",
    name: "Acetilcolina",
    emoji: "🧠",
    color: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
    dotColor: "#8B5CF6",
    type: "Excitatório/Inibitório",
    effects: [
      "Contração muscular voluntária",
      "Aprendizagem e memória",
      "Atenção e estado de vigília",
    ],
    diseases: ["Déficit: Alzheimer (memória)", "Bloqueio: relaxamento muscular cirúrgico"],
  },
];

// ──────────────────────────────────────────────
// Nervous System data
// ──────────────────────────────────────────────

interface NervousSystemSection {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  components: { name: string; role: string }[];
}

const NERVOUS_SYSTEM: NervousSystemSection[] = [
  {
    id: "snc",
    name: "Sistema Nervoso Central",
    abbreviation: "SNC",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    description:
      "Composto pelo encéfalo e medula espinhal, o SNC é o principal centro de processamento e coordenação de toda informação nervosa do organismo.",
    components: [
      { name: "Córtex Cerebral", role: "Processos cognitivos superiores, percepção, linguagem, memória" },
      { name: "Cerebelo", role: "Coordenação motora, equilíbrio, postura" },
      { name: "Tronco Encefálico", role: "Funções vitais: respiração, frequência cardíaca, sono/vigília" },
      { name: "Hipocampo", role: "Formação de novas memórias, navegação espacial" },
      { name: "Amígdala", role: "Processamento emocional, medo, resposta ao estresse" },
      { name: "Hipotálamo", role: "Regulação hormonal, temperatura, fome, sede" },
      { name: "Medula Espinhal", role: "Via de condução entre encéfalo e SNP; reflexos medulares" },
    ],
  },
  {
    id: "snp",
    name: "Sistema Nervoso Periférico",
    abbreviation: "SNP",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    description:
      "Engloba todos os nervos e gânglios fora do encéfalo e medula espinhal. Conecta o SNC aos órgãos, músculos e pele.",
    components: [
      { name: "Nervos Cranianos (12 pares)", role: "Inervam cabeça, pescoço e vísceras (olfato, visão, audição…)" },
      { name: "Nervos Espinhais (31 pares)", role: "Inervam tronco, membros e vísceras abdominais/pélvicas" },
      { name: "Gânglios Sensitivos", role: "Corpos celulares de neurônios sensoriais fora do SNC" },
    ],
  },
  {
    id: "sns",
    name: "Sistema Nervoso Somático",
    abbreviation: "SNSo",
    color: "text-violet-700 dark:text-violet-300",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-300 dark:border-violet-700",
    description:
      "Divisão do SNP responsável pelo controle voluntário da musculatura esquelética e pela recepção de estímulos do ambiente externo.",
    components: [
      { name: "Neurônios Motores Somáticos", role: "Controlam músculos esqueléticos (ação voluntária)" },
      { name: "Neurônios Sensitivos (aferentes)", role: "Transmitem sensações de pele, articulações e músculos ao SNC" },
      { name: "Arco Reflexo Somático", role: "Resposta motora involuntária e rápida (ex.: reflexo patelar)" },
    ],
  },
  {
    id: "sna",
    name: "Sistema Nervoso Autônomo",
    abbreviation: "SNA",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-300 dark:border-rose-700",
    description:
      "Controla involuntariamente as vísceras, glândulas e músculo cardíaco. Dividido em simpático, parassimpático e entérico.",
    components: [
      { name: "Simpático (luta-ou-fuga)", role: "Ativa o organismo para situações de emergência: ↑FC, ↑pressão, midríase" },
      { name: "Parassimpático (descanso)", role: "Restaura o organismo em repouso: ↓FC, digestão, miose" },
      { name: "Entérico", role: "Rede nervosa autônoma do trato gastrointestinal ('segundo cérebro')" },
    ],
  },
];

// ──────────────────────────────────────────────
// Neuron SVG
// ──────────────────────────────────────────────

function NeuronSVG({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const isActive = (id: string) => selected === id;
  const highlight = (id: string) => (isActive(id) ? "#FDA4AF" : "transparent");
  const strokeActive = (id: string) => (isActive(id) ? "#F43F5E" : "none");

  return (
    <svg
      viewBox="0 0 640 320"
      className="w-full max-w-2xl mx-auto"
      style={{ fontFamily: "inherit" }}
    >
      {/* ── Dendrites ── */}
      <g
        className="cursor-pointer"
        onClick={() => onSelect("dendrites")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect("dendrites")}
        aria-label="Dendritos"
      >
        <rect x="2" y="30" width="120" height="260" rx="8" fill={highlight("dendrites")} stroke={strokeActive("dendrites")} strokeWidth="1.5" />
        {/* main trunk */}
        <line x1="110" y1="160" x2="62" y2="160" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        {/* branches */}
        <line x1="62" y1="160" x2="30" y2="100" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="160" x2="20" y2="160" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="62" y1="160" x2="30" y2="220" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="100" x2="10" y2="70" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="100" x2="12" y2="118" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="220" x2="10" y2="242" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="220" x2="12" y2="205" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        {/* spines */}
        <circle cx="10" cy="70" r="3" fill="#94A3B8" />
        <circle cx="12" cy="118" r="3" fill="#94A3B8" />
        <circle cx="20" cy="160" r="3" fill="#94A3B8" />
        <circle cx="10" cy="242" r="3" fill="#94A3B8" />
        <circle cx="12" cy="205" r="3" fill="#94A3B8" />
        <text x="56" y="298" textAnchor="middle" fontSize="11" fill={isActive("dendrites") ? "#F43F5E" : "#64748B"} fontWeight={isActive("dendrites") ? "700" : "400"}>
          Dendritos
        </text>
      </g>

      {/* ── Soma ── */}
      <g
        className="cursor-pointer"
        onClick={() => onSelect("soma")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect("soma")}
        aria-label="Corpo Celular"
      >
        <rect x="104" y="90" width="120" height="140" rx="8" fill={highlight("soma")} stroke={strokeActive("soma")} strokeWidth="1.5" />
        <ellipse cx="164" cy="160" rx="52" ry="52" fill={isActive("soma") ? "#FEE2E2" : "#DBEAFE"} stroke={isActive("soma") ? "#F43F5E" : "#93C5FD"} strokeWidth="2" />
        {/* nucleus */}
        <ellipse cx="164" cy="160" rx="22" ry="22" fill={isActive("soma") ? "#FCA5A5" : "#93C5FD"} stroke={isActive("soma") ? "#EF4444" : "#3B82F6"} strokeWidth="1.5" />
        <text x="164" y="164" textAnchor="middle" fontSize="8" fill={isActive("soma") ? "#7F1D1D" : "#1E3A8A"} fontWeight="600">
          Núcleo
        </text>
        <text x="164" y="232" textAnchor="middle" fontSize="11" fill={isActive("soma") ? "#F43F5E" : "#64748B"} fontWeight={isActive("soma") ? "700" : "400"}>
          Corpo Celular
        </text>
      </g>

      {/* ── Axon hillock ── */}
      <g
        className="cursor-pointer"
        onClick={() => onSelect("axon_hillock")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect("axon_hillock")}
        aria-label="Cone de Implantação"
      >
        <rect x="210" y="138" width="50" height="44" rx="6" fill={highlight("axon_hillock")} stroke={strokeActive("axon_hillock")} strokeWidth="1.5" />
        <line x1="216" y1="160" x2="256" y2="160" stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
        <text x="235" y="198" textAnchor="middle" fontSize="9" fill={isActive("axon_hillock") ? "#F43F5E" : "#64748B"} fontWeight={isActive("axon_hillock") ? "700" : "400"}>
          Cone
        </text>
      </g>

      {/* ── Axon ── */}
      <g
        className="cursor-pointer"
        onClick={() => onSelect("axon")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect("axon")}
        aria-label="Axônio"
      >
        <rect x="254" y="145" width="130" height="30" rx="4" fill={highlight("axon")} stroke={strokeActive("axon")} strokeWidth="1.5" />
        <line x1="256" y1="160" x2="384" y2="160" stroke={isActive("axon") ? "#F43F5E" : "#64748B"} strokeWidth="6" strokeLinecap="round" />
        <text x="318" y="192" textAnchor="middle" fontSize="11" fill={isActive("axon") ? "#F43F5E" : "#64748B"} fontWeight={isActive("axon") ? "700" : "400"}>
          Axônio
        </text>
      </g>

      {/* ── Myelin sheaths ── */}
      {[270, 308, 346].map((x, i) => (
        <g
          key={i}
          className="cursor-pointer"
          onClick={() => onSelect("myelin")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelect("myelin")}
          aria-label="Bainha de Mielina"
        >
          <rect
            x={x}
            y={148}
            width={24}
            height={24}
            rx="3"
            fill={isActive("myelin") ? "#FEE2E2" : "#E0E7FF"}
            stroke={isActive("myelin") ? "#F43F5E" : "#818CF8"}
            strokeWidth="1.5"
            opacity="0.85"
          />
        </g>
      ))}
      <text x="318" y="134" textAnchor="middle" fontSize="9" fill={isActive("myelin") ? "#F43F5E" : "#818CF8"}>
        Mielina
      </text>

      {/* ── Nodes of Ranvier ── */}
      {[293, 331, 369].map((x, i) => (
        <g
          key={i}
          className="cursor-pointer"
          onClick={() => onSelect("node")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelect("node")}
          aria-label="Nodo de Ranvier"
        >
          <rect
            x={x}
            y={152}
            width={8}
            height={16}
            rx="2"
            fill={isActive("node") ? "#FCA5A5" : "#F8FAFC"}
            stroke={isActive("node") ? "#F43F5E" : "#CBD5E1"}
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* ── Terminals ── */}
      <g
        className="cursor-pointer"
        onClick={() => onSelect("terminals")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect("terminals")}
        aria-label="Terminais Axônicos"
      >
        <rect x="382" y="50" width="110" height="220" rx="8" fill={highlight("terminals")} stroke={strokeActive("terminals")} strokeWidth="1.5" />
        <line x1="384" y1="160" x2="418" y2="160" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
        {/* three branches */}
        <line x1="418" y1="160" x2="460" y2="100" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="418" y1="160" x2="462" y2="160" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="418" y1="160" x2="460" y2="220" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        {/* bulbs */}
        <circle cx="472" cy="96" r="10" fill={isActive("terminals") ? "#FCA5A5" : "#93C5FD"} stroke={isActive("terminals") ? "#F43F5E" : "#3B82F6"} strokeWidth="1.5" />
        <circle cx="474" cy="160" r="10" fill={isActive("terminals") ? "#FCA5A5" : "#93C5FD"} stroke={isActive("terminals") ? "#F43F5E" : "#3B82F6"} strokeWidth="1.5" />
        <circle cx="472" cy="224" r="10" fill={isActive("terminals") ? "#FCA5A5" : "#93C5FD"} stroke={isActive("terminals") ? "#F43F5E" : "#3B82F6"} strokeWidth="1.5" />
        <text x="438" y="275" textAnchor="middle" fontSize="11" fill={isActive("terminals") ? "#F43F5E" : "#64748B"} fontWeight={isActive("terminals") ? "700" : "400"}>
          Terminais
        </text>
      </g>

      {/* ── Impulse arrow ── */}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#F43F5E" />
        </marker>
      </defs>
      <line x1="110" y1="310" x2="490" y2="310" stroke="#F43F5E" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" opacity="0.5" />
      <text x="300" y="322" textAnchor="middle" fontSize="9" fill="#F43F5E" opacity="0.7">
        direção do impulso nervoso →
      </text>
    </svg>
  );
}

// ──────────────────────────────────────────────
// Synapse SVG  (static diagram + animated dots)
// ──────────────────────────────────────────────

function SynapseSVG({ activeNt }: { activeNt: string | null }) {
  const dotColor =
    activeNt
      ? (NEUROTRANSMITTERS.find((n) => n.id === activeNt)?.dotColor ?? "#F43F5E")
      : "#93C5FD";

  // fixed vesicle positions
  const vesicles = [
    { cx: 190, cy: 108 },
    { cx: 218, cy: 98 },
    { cx: 248, cy: 108 },
    { cx: 204, cy: 130 },
    { cx: 234, cy: 128 },
    { cx: 260, cy: 130 },
  ];

  // released dots (mid-cleft)
  const released = [
    { cx: 192, cy: 158 },
    { cx: 218, cy: 162 },
    { cx: 246, cy: 156 },
    { cx: 204, cy: 170 },
    { cx: 234, cy: 168 },
  ];

  return (
    <svg viewBox="0 0 440 320" className="w-full max-w-lg mx-auto">
      {/* Pre-synaptic terminal */}
      <rect x="120" y="60" width="200" height="110" rx="16" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
      <text x="220" y="82" textAnchor="middle" fontSize="11" fill="#1E40AF" fontWeight="600">
        Terminal Pré-sináptico
      </text>
      {/* mitochondria */}
      <ellipse cx="150" cy="108" rx="18" ry="10" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="150" y="112" textAnchor="middle" fontSize="7" fill="#92400E">
        Mitocôndria
      </text>
      {/* vesicles */}
      {vesicles.map((v, i) => (
        <circle key={i} cx={v.cx} cy={v.cy} r="9" fill={dotColor} stroke="white" strokeWidth="1.5" opacity="0.9" />
      ))}
      <text x="320" y="108" textAnchor="middle" fontSize="9" fill="#1E40AF">
        Vesículas
      </text>
      <text x="320" y="120" textAnchor="middle" fontSize="9" fill="#1E40AF">
        sinápticas
      </text>

      {/* Cleft */}
      <rect x="120" y="170" width="200" height="22" rx="0" fill="#F0F9FF" stroke="none" />
      <line x1="120" y1="170" x2="320" y2="170" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 3" />
      <line x1="120" y1="192" x2="320" y2="192" stroke="#86EFAC" strokeWidth="1.5" strokeDasharray="5 3" />
      <text x="80" y="184" textAnchor="middle" fontSize="9" fill="#64748B">
        Fenda
      </text>
      <text x="80" y="195" textAnchor="middle" fontSize="9" fill="#64748B">
        sináptica
      </text>

      {/* released neurotransmitters */}
      {released.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="5" fill={dotColor} opacity={activeNt ? 1 : 0.35} />
      ))}

      {/* Post-synaptic membrane */}
      <rect x="120" y="192" width="200" height="90" rx="16" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="2" />
      <text x="220" y="212" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="600">
        Membrana Pós-sináptica
      </text>
      {/* receptors */}
      {[155, 195, 235, 275].map((x, i) => (
        <g key={i}>
          <rect x={x} y={215} width="18" height="28" rx="4" fill={activeNt ? dotColor : "#86EFAC"} stroke="#166534" strokeWidth="1.5" opacity="0.85" />
          <text x={x + 9} y={232} textAnchor="middle" fontSize="7" fill="#166534">R</text>
        </g>
      ))}
      <text x="220" y="265" textAnchor="middle" fontSize="9" fill="#166534">
        Receptores
      </text>

      {/* EPSP/IPSP indicator */}
      {activeNt && (
        <>
          <rect x="340" y="190" width="88" height="42" rx="8" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5" />
          <text x="384" y="207" textAnchor="middle" fontSize="9" fill="#9A3412" fontWeight="600">
            {NEUROTRANSMITTERS.find((n) => n.id === activeNt)?.type}
          </text>
          <text x="384" y="222" textAnchor="middle" fontSize="8" fill="#9A3412">
            {NEUROTRANSMITTERS.find((n) => n.id === activeNt)?.type?.includes("Excit") ? "→ EPSP" : "→ IPSP"}
          </text>
        </>
      )}

      {/* Arrow from vesicle to cleft */}
      <line x1="220" y1="170" x2="220" y2="175" stroke={dotColor} strokeWidth="2" markerEnd="url(#arrow2)" />
      <defs>
        <marker id="arrow2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={dotColor} />
        </marker>
      </defs>
    </svg>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

type Tab = "neuron" | "synapse" | "system";

export default function AnatomiaPage() {
  const [tab, setTab] = useState<Tab>("neuron");
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedNt, setSelectedNt] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const activePart = NEURON_PARTS.find((p) => p.id === selectedPart);
  const activeNt = NEUROTRANSMITTERS.find((n) => n.id === selectedNt);
  const activeSection = NERVOUS_SYSTEM.find((s) => s.id === selectedSection);

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "neuron", label: "Neurônio", emoji: "🧬" },
    { id: "synapse", label: "Sinapse", emoji: "⚡" },
    { id: "system", label: "Sistema Nervoso", emoji: "🕸️" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/psicolab"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          PsicoLab
        </Link>
      </div>

      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          <span className="text-lg">🫀</span>
          Laboratório Interativo
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Anatomo<span className="text-rose-600">fisiologia</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
          Do neurônio à sinapse: explore o sistema nervoso completo com interações em múltiplos
          níveis de detalhe.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-rose-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-rose-700 dark:hover:text-rose-400"
            }`}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Neurônio ─── */}
      {tab === "neuron" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              Estrutura do Neurônio
            </h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Clique em cada parte para ver detalhes
            </p>
            <NeuronSVG selected={selectedPart} onSelect={setSelectedPart} />

            {/* Part list */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {NEURON_PARTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPart(p.id === selectedPart ? null : p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedPart === p.id
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            {activePart ? (
              <>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {activePart.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {activePart.description}
                </p>
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Funções principais
                  </h4>
                  <ul className="space-y-1.5">
                    {activePart.functions.map((fn) => (
                      <li
                        key={fn}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs flex items-center justify-center font-bold">
                          ✓
                        </span>
                        {fn}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <span className="text-5xl mb-4">🧬</span>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Selecione uma parte
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Clique em qualquer região do diagrama ou nos botões abaixo para explorar a
                  estrutura do neurônio.
                </p>
              </div>
            )}
          </div>

          {/* Neuron types */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Tipos de Neurônios
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  name: "Neurônio Sensorial (Aferente)",
                  emoji: "👁️",
                  color: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                  text: "text-blue-700 dark:text-blue-300",
                  description:
                    "Conduz informações dos órgãos dos sentidos e receptores periféricos ao SNC. Transforma estímulos externos (luz, som, toque) em sinais elétricos.",
                },
                {
                  name: "Interneurônio (Associativo)",
                  emoji: "🔗",
                  color: "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800",
                  text: "text-violet-700 dark:text-violet-300",
                  description:
                    "Localizado totalmente dentro do SNC. Conecta neurônios sensoriais e motores, processa informações e é responsável pelo pensamento e reflexo.",
                },
                {
                  name: "Neurônio Motor (Eferente)",
                  emoji: "💪",
                  color: "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800",
                  text: "text-rose-700 dark:text-rose-300",
                  description:
                    "Leva comandos do SNC aos músculos e glândulas. Responsável por toda ação motora voluntária e involuntária do organismo.",
                },
              ].map((type) => (
                <div
                  key={type.name}
                  className={`rounded-xl border p-4 ${type.color}`}
                >
                  <div className="text-3xl mb-2">{type.emoji}</div>
                  <h4 className={`font-semibold text-sm mb-1 ${type.text}`}>{type.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Sinapse ─── */}
      {tab === "synapse" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              Transmissão Sináptica
            </h2>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Selecione um neurotransmissor para visualizar
            </p>
            <SynapseSVG activeNt={selectedNt} />

            {/* Steps */}
            <ol className="mt-4 space-y-2">
              {[
                "Potencial de ação chega ao terminal pré-sináptico",
                "Canais de Ca²⁺ abrem → cálcio entra na célula",
                "Vesículas sinápticas fundem com a membrana",
                "Neurotransmissores são liberados na fenda sináptica",
                "NT se ligam aos receptores pós-sinápticos",
                "Geração de EPSP (excitatório) ou IPSP (inibitório)",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Neurotransmitter selector + info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">
                Principais Neurotransmissores
              </h3>
              <div className="space-y-2">
                {NEUROTRANSMITTERS.map((nt) => (
                  <button
                    key={nt.id}
                    onClick={() => setSelectedNt(nt.id === selectedNt ? null : nt.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      selectedNt === nt.id
                        ? "ring-2 ring-rose-500 " + nt.color
                        : nt.color + " hover:ring-1 hover:ring-rose-300"
                    }`}
                  >
                    <span className="text-xl">{nt.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{nt.name}</div>
                      <div className="text-xs opacity-75">{nt.type}</div>
                    </div>
                    {selectedNt === nt.id && (
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        ativo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {activeNt && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-800 dark:bg-rose-900/20">
                <h4 className="font-bold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-2">
                  <span>{activeNt.emoji}</span>
                  {activeNt.name}
                  <span className="text-xs font-normal opacity-75">— {activeNt.type}</span>
                </h4>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
                    Efeitos
                  </p>
                  <ul className="space-y-1">
                    {activeNt.effects.map((e) => (
                      <li key={e} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                        <span className="text-rose-500 mt-0.5">•</span>{e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">
                    Disfunções relacionadas
                  </p>
                  <ul className="space-y-1">
                    {activeNt.diseases.map((d) => (
                      <li key={d} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                        <span className="text-rose-500 mt-0.5">⚠</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Sistema Nervoso ─── */}
      {tab === "system" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sections list */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Divisões do Sistema Nervoso
            </h2>

            {/* Tree diagram */}
            <div className="mb-6 text-xs text-gray-600 dark:text-gray-400 font-mono leading-relaxed">
              <div className="font-bold text-gray-800 dark:text-gray-200">Sistema Nervoso</div>
              <div className="pl-3 border-l-2 border-gray-300 dark:border-gray-600 ml-1 mt-1 space-y-1">
                <div className="text-blue-600 dark:text-blue-400 font-semibold">SNC</div>
                <div className="pl-3 border-l-2 border-blue-200 dark:border-blue-800 ml-1">
                  <div>Encéfalo</div>
                  <div>Medula Espinhal</div>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">SNP</div>
                <div className="pl-3 border-l-2 border-emerald-200 dark:border-emerald-800 ml-1 space-y-0.5">
                  <div className="text-violet-600 dark:text-violet-400">SNSo (voluntário)</div>
                  <div className="text-rose-600 dark:text-rose-400">SNA (autônomo)</div>
                  <div className="pl-3 border-l-2 border-rose-200 dark:border-rose-800 ml-1 space-y-0.5">
                    <div>Simpático</div>
                    <div>Parassimpático</div>
                    <div>Entérico</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {NERVOUS_SYSTEM.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedSection === s.id
                      ? `${s.bgColor} ${s.borderColor} ring-2 ring-offset-1 ring-current`
                      : `${s.bgColor} ${s.borderColor} hover:ring-1`
                  }`}
                >
                  <span className={`text-lg font-bold ${s.color}`}>{s.abbreviation}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {activeSection ? (
              <div className={`rounded-2xl border p-6 ${activeSection.bgColor} ${activeSection.borderColor}`}>
                <h3 className={`text-xl font-bold mb-1 ${activeSection.color}`}>
                  {activeSection.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                  {activeSection.description}
                </p>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Componentes principais
                </h4>
                <div className="space-y-3">
                  {activeSection.components.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-xl bg-white/70 dark:bg-gray-900/40 px-4 py-3 border border-white/80 dark:border-gray-700"
                    >
                      <div className={`font-semibold text-sm ${activeSection.color}`}>
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {c.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                <span className="text-6xl mb-4">🕸️</span>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Selecione uma divisão
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Escolha uma divisão do sistema nervoso para ver seus componentes, funções e
                  características em detalhe.
                </p>
              </div>
            )}

            {/* Simpático vs Parassimpático comparison */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">
                Simpático × Parassimpático
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Frequência cardíaca", "↑ Aumenta", "↓ Diminui"],
                  ["Pressão arterial", "↑ Aumenta", "↓ Diminui"],
                  ["Pupilas", "Midríase (dilatam)", "Miose (contraem)"],
                  ["Digestão", "↓ Reduz peristaltismo", "↑ Aumenta peristaltismo"],
                  ["Brônquios", "Broncodilatação", "Broncoconstrição"],
                  ["Glândulas sudoríparas", "Ativadas (suor)", "Sem efeito significativo"],
                  ["Neurotransmissor", "Noradrenalina", "Acetilcolina"],
                  ["Contexto típico", "Estresse / exercício", "Repouso / digestão"],
                ].map(([fn, symp, para]) => (
                  <div key={fn} className="contents">
                    <div className="col-span-2 mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-1">
                      {fn}
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2 text-amber-800 dark:text-amber-300">
                      {symp}
                    </div>
                    <div className="rounded-lg bg-teal-50 border border-teal-200 dark:bg-teal-900/20 dark:border-teal-800 px-3 py-2 text-teal-800 dark:text-teal-300">
                      {para}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-amber-400"></span>
                  <span className="text-gray-500 dark:text-gray-400">Simpático (luta-ou-fuga)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-teal-400"></span>
                  <span className="text-gray-500 dark:text-gray-400">Parassimpático (descanso)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        🧬 Anatomofisiologia — PsicoLab · Explore neurônios, sinapses e o sistema nervoso de forma
        interativa.
      </p>
    </div>
  );
}
