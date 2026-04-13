"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Info, Layers } from "lucide-react";

type ViewType = "lateral" | "medial" | "superior";

interface BrainRegion {
  id: string;
  name: string;
  lobe: string;
  color: string;
  activeColor: string;
  views: ViewType[];
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

// ─── REGION DATA ────────────────────────────────────────────────────────────

const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: "prefrontal",
    name: "Córtex Pré-frontal",
    lobe: "Lobo Frontal",
    color: "#93C5FD",
    activeColor: "#2563EB",
    views: ["lateral", "medial", "superior"],
    activations: ["stress", "learning", "social", "decision"],
    description:
      "Centro executivo do cérebro. Coordena pensamentos, ações e comportamentos complexos em relação a objetivos sociais e pessoais.",
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
    name: "Córtex Motor (Giro Pré-central)",
    lobe: "Lobo Frontal",
    color: "#818CF8",
    activeColor: "#4338CA",
    views: ["lateral", "superior"],
    activations: ["movement", "learning"],
    description:
      "Controla todos os movimentos voluntários do corpo. Cada área corresponde a uma parte do corpo — homúnculo motor. Localizado imediatamente anterior ao sulco central.",
    functions: [
      "Movimentos voluntários precisos",
      "Coordenação motora fina",
      "Execução de habilidades motoras aprendidas",
      "Controle da fala (área de Broca, hemisfério esquerdo)",
    ],
    examples: [
      "Mover o braço para pegar um objeto",
      "Escrever à mão com precisão",
      "Tocar um instrumento musical",
    ],
  },
  {
    id: "somatosensory",
    name: "Córtex Somatossensorial (Giro Pós-central)",
    lobe: "Lobo Parietal",
    color: "#34D399",
    activeColor: "#059669",
    views: ["lateral", "superior"],
    activations: ["sensory"],
    description:
      "Processa todas as informações sensoriais do corpo — tato, pressão, temperatura e dor. Localizado logo atrás do sulco central. Cada área do córtex corresponde a uma região do corpo (homúnculo sensorial).",
    functions: [
      "Percepção do toque e pressão",
      "Localização precisa de estímulos no corpo",
      "Discriminação de texturas e formas ao tato",
      "Percepção de dor e temperatura",
    ],
    examples: [
      "Sentir a temperatura da água no banho",
      "Perceber a textura de um tecido",
      "Localizar onde foi tocado sem olhar",
    ],
  },
  {
    id: "parietal",
    name: "Lobo Parietal (Associação)",
    lobe: "Lobo Parietal",
    color: "#6EE7B7",
    activeColor: "#10B981",
    views: ["lateral", "medial", "superior"],
    activations: ["sensory", "stress"],
    description:
      "Integra informações sensoriais de diversas fontes e processa percepção espacial, orientação corporal e linguagem. Fundamental para reconhecer objetos pelo tato e para aritmética.",
    functions: [
      "Percepção espacial e orientação",
      "Integração multissensorial",
      "Consciência do esquema corporal",
      "Aritmética e processamento numérico",
    ],
    examples: [
      "Saber a posição do seu corpo no espaço",
      "Navegação e orientação geográfica",
      "Reconhecer objetos apenas pelo tato",
    ],
  },
  {
    id: "temporal",
    name: "Lobo Temporal",
    lobe: "Lobo Temporal",
    color: "#FCD34D",
    activeColor: "#D97706",
    views: ["lateral", "superior"],
    activations: ["social", "learning", "fear"],
    description:
      "Processa sons e linguagem, é essencial para memória de longo prazo e reconhecimento de rostos e objetos. Contém a área de Wernicke (compreensão da linguagem).",
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
    views: ["lateral", "medial", "superior"],
    activations: ["sensory"],
    description:
      "Principal área de processamento visual. Interpreta informações provenientes dos olhos para criar nossa percepção visual do mundo. Contém o córtex visual primário (V1) e áreas de associação visual.",
    functions: [
      "Processamento visual primário (V1)",
      "Reconhecimento de cores e formas",
      "Detecção de movimento visual",
      "Percepção de profundidade e distância",
    ],
    examples: [
      "Ver e interpretar cores",
      "Reconhecer objetos visualmente",
      "Perceber o movimento de objetos",
    ],
  },
  {
    id: "insula",
    name: "Ínsula (Córtex Insular)",
    lobe: "Córtex Insular",
    color: "#C084FC",
    activeColor: "#9333EA",
    views: ["lateral"],
    activations: ["social", "stress", "sensory"],
    description:
      "Estrutura cortical escondida dentro da fissura lateral de Sylvius, coberta pelos opérculos frontal e temporal. Integra consciência corporal interna (interoceptção), processamento emocional e dor.",
    functions: [
      "Interoceptção (sensações internas do corpo)",
      "Regulação e processamento da dor",
      "Empatia e reconhecimento de emoções",
      "Consciência da sede, fome e batimento cardíaco",
    ],
    examples: [
      "Sentir dor visceral (dor de estômago)",
      "Perceber o coração acelerado sob ansiedade",
      "Sentir repulsa ou nojo intenso",
    ],
  },
  {
    id: "amygdala",
    name: "Amígdala",
    lobe: "Sistema Límbico",
    color: "#F9A8D4",
    activeColor: "#DB2777",
    views: ["lateral", "medial"],
    activations: ["fear", "stress", "social"],
    description:
      "Centro emocional do cérebro, especialmente ligado ao medo e ansiedade. Detecta ameaças e ativa a resposta de luta-ou-fuga via hipotálamo. Localizada no polo anterior do lobo temporal.",
    functions: [
      "Processamento do medo e ansiedade",
      "Resposta emocional automática",
      "Memória emocional",
      "Detecção rápida de ameaças",
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
    lobe: "Sistema Límbico",
    color: "#C4B5FD",
    activeColor: "#7C3AED",
    views: ["lateral", "medial"],
    activations: ["learning", "stress"],
    description:
      "Fundamental para a formação de novas memórias explícitas. Consolida memórias de curto prazo em memórias de longo prazo e cria mapas cognitivos para navegação espacial.",
    functions: [
      "Formação de novas memórias explícitas",
      "Consolidação da memória (curto → longo prazo)",
      "Navegação espacial (mapa cognitivo)",
      "Contextualização e localização de memórias",
    ],
    examples: [
      "Aprender o caminho para um lugar novo",
      "Lembrar o que você estudou ontem",
      "Associar um cheiro a uma memória afetiva",
    ],
  },
  {
    id: "corpus_callosum",
    name: "Corpo Caloso",
    lobe: "Substância Branca",
    color: "#E5E7EB",
    activeColor: "#6B7280",
    views: ["medial"],
    activations: ["learning", "social"],
    description:
      "Maior comissura cerebral — feixe de ~250 milhões de fibras nervosas que conecta os dois hemisférios cerebrais, permitindo troca constante de informações entre eles.",
    functions: [
      "Transferência de informações entre hemisférios",
      "Integração bilateral motora e sensorial",
      "Coordenação de processos cognitivos bilaterais",
    ],
    examples: [
      "Usar as duas mãos de forma coordenada",
      "Integrar linguagem (hem. esq.) com contexto emocional (hem. dir.)",
      "Processar estímulos visuais de ambos os campos visuais",
    ],
  },
  {
    id: "cingulate",
    name: "Giro Cingulado",
    lobe: "Córtex Límbico",
    color: "#FDE68A",
    activeColor: "#F59E0B",
    views: ["medial"],
    activations: ["stress", "decision", "social"],
    description:
      "Parte central do sistema límbico, circunda o corpo caloso. O cingulado anterior regula emoções, atenção e detecta conflitos. O cingulado posterior processa memória autobiográfica.",
    functions: [
      "Regulação emocional e motivação",
      "Atenção seletiva e monitoramento de erros",
      "Processamento da dor emocional",
      "Tomada de decisão sob conflito",
    ],
    examples: [
      "Sentir sofrimento emocional por rejeição social",
      "Focar atenção e detectar erros em uma tarefa",
      "Memória autobiográfica e autorreferência",
    ],
  },
  {
    id: "thalamus",
    name: "Tálamo",
    lobe: "Diencéfalo",
    color: "#FB923C",
    activeColor: "#EA580C",
    views: ["medial"],
    activations: ["sensory", "learning", "stress"],
    description:
      "Principal estação de retransmissão do SNC. Quase todas as informações sensoriais (exceto olfato) passam pelo tálamo antes de chegar ao córtex. Regula atenção, sono e vigília.",
    functions: [
      "Retransmissão de sinais sensoriais ao córtex",
      "Regulação do ciclo sono-vigília",
      "Filtragem e direcionamento da atenção",
      "Integração motora e sensorial",
    ],
    examples: [
      "Filtrar ruídos durante o sono profundo",
      "Direcionar atenção para um estímulo importante",
      "Transmitir sensação de dor para o córtex",
    ],
  },
  {
    id: "hypothalamus",
    name: "Hipotálamo",
    lobe: "Diencéfalo",
    color: "#F87171",
    activeColor: "#B91C1C",
    views: ["medial"],
    activations: ["stress", "fear"],
    description:
      "Controla o sistema nervoso autônomo e o sistema endócrino via hipófise. Regula funções vitais homeostáticas: temperatura, fome, sede, sono, ciclos hormonais e resposta ao estresse.",
    functions: [
      "Regulação da temperatura corporal",
      "Controle do apetite e sede",
      "Regulação hormonal (via hipófise — eixo HPA)",
      "Resposta ao estresse (libera CRH → cortisol)",
    ],
    examples: [
      "Suar em dia quente para se resfriar",
      "Sentir fome quando a glicemia cai",
      "Liberar cortisol sob estresse agudo",
    ],
  },
  {
    id: "cerebellum",
    name: "Cerebelo",
    lobe: "Cerebelo",
    color: "#67E8F9",
    activeColor: "#0891B2",
    views: ["lateral", "medial", "superior"],
    activations: ["movement"],
    description:
      "Coordena movimentos, equilíbrio e postura. Recebe informações dos sentidos, córtex motor e medula e ajusta o movimento em tempo real com alta precisão. Contém mais da metade dos neurônios do cérebro.",
    functions: [
      "Coordenação motora fina e equilíbrio",
      "Refinamento e suavização de movimentos",
      "Aprendizado de habilidades motoras automáticas",
      "Controle da postura e marcha",
    ],
    examples: [
      "Caminhar sem cair",
      "Coordenar movimentos ao dançar",
      "Aprender a andar de bicicleta",
    ],
  },
  {
    id: "brainstem",
    name: "Tronco Encefálico",
    lobe: "Tronco Encefálico",
    color: "#D1D5DB",
    activeColor: "#6B7280",
    views: ["lateral", "medial"],
    activations: ["sensory"],
    description:
      "Controla funções vitais automáticas como respiração, frequência cardíaca e pressão arterial. Inclui mesencéfalo (superior), ponte/pons (médio) e bulbo/medula oblonga (inferior).",
    functions: [
      "Regulação da respiração (bulbo)",
      "Controle da frequência cardíaca (bulbo)",
      "Reflexos vitais: deglutição, tosse, vômito",
      "Via de passagem de sinais motores e sensoriais",
    ],
    examples: [
      "Respirar automaticamente durante o sono",
      "Controlar a pressão arterial",
      "Reflexo de tosse protetora",
    ],
  },
];

// ─── STIMULUS PRESETS ────────────────────────────────────────────────────────

const STIMULUS_PRESETS: StimulusPreset[] = [
  {
    id: "fear",
    label: "Medo",
    emoji: "😨",
    regions: ["amygdala", "prefrontal", "temporal", "hypothalamus"],
    description:
      "Situação de ameaça: amígdala dispara o alarme, hipotálamo ativa luta-ou-fuga, pré-frontal tenta avaliar racionalmente.",
  },
  {
    id: "learning",
    label: "Aprendizado",
    emoji: "📚",
    regions: ["hippocampus", "prefrontal", "temporal", "motor", "cingulate"],
    description:
      "Aprender algo novo envolve hipocampo (consolidação), pré-frontal (atenção/organização), temporal (linguagem) e cingulado (motivação).",
  },
  {
    id: "stress",
    label: "Estresse",
    emoji: "😰",
    regions: ["amygdala", "hippocampus", "prefrontal", "parietal", "hypothalamus", "cingulate"],
    description:
      "Estresse crônico hiperativa amígdala e hipotálamo, podendo prejudicar hipocampo (memória) e pré-frontal (controle executivo).",
  },
  {
    id: "movement",
    label: "Movimento",
    emoji: "🏃",
    regions: ["motor", "cerebellum", "parietal", "somatosensory", "brainstem"],
    description:
      "Movimentos voluntários recrutam córtex motor, cerebelo (coordenação/equilíbrio), parietal (sensação) e tronco encefálico (execução).",
  },
  {
    id: "social",
    label: "Interação Social",
    emoji: "🤝",
    regions: ["prefrontal", "amygdala", "temporal", "insula", "cingulate"],
    description:
      "Interações sociais ativam pré-frontal (empatia/teoria da mente), amígdala (emoções), temporal (linguagem) e ínsula (sentir o outro).",
  },
  {
    id: "decision",
    label: "Tomada de Decisão",
    emoji: "🤔",
    regions: ["prefrontal", "cingulate", "amygdala", "thalamus"],
    description:
      "Decidir envolve pré-frontal (avaliação racional), cingulado anterior (detecção de conflito), amígdala (peso emocional) e tálamo (integração).",
  },
  {
    id: "sensory",
    label: "Percepção Sensorial",
    emoji: "🖐️",
    regions: ["somatosensory", "parietal", "occipital", "temporal", "thalamus", "insula"],
    description:
      "Toda percepção sensorial passa pelo tálamo, chega ao córtex específico (visual, auditivo, somatossensorial) e é integrada no parietal e ínsula.",
  },
];

// ─── QUIZ ────────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: "Qual região é responsável pelo controle de impulsos e tomada de decisão racional?",
    options: ["Amígdala", "Córtex Pré-frontal", "Cerebelo", "Hipocampo"],
    correct: 1,
  },
  {
    question: "O 'centro do medo' do cérebro — dispara a resposta de luta-ou-fuga — é:",
    options: ["Hipocampo", "Córtex Motor", "Amígdala", "Lobo Parietal"],
    correct: 2,
  },
  {
    question: "Qual estrutura é essencial para a formação de novas memórias de longo prazo?",
    options: ["Hipocampo", "Cerebelo", "Lobo Occipital", "Tronco Encefálico"],
    correct: 0,
  },
  {
    question: "Onde são processadas as informações visuais primárias?",
    options: ["Lobo Frontal", "Lobo Temporal", "Lobo Occipital", "Lobo Parietal"],
    correct: 2,
  },
  {
    question: "Coordenação motora, equilíbrio e habilidades motoras automáticas dependem de:",
    options: ["Córtex Pré-frontal", "Tronco Encefálico", "Cerebelo", "Amígdala"],
    correct: 2,
  },
  {
    question: "Qual estrutura conecta os dois hemisférios cerebrais e permite comunicação entre eles?",
    options: ["Tálamo", "Corpo Caloso", "Hipotálamo", "Giro Cingulado"],
    correct: 1,
  },
  {
    question: "O tálamo é frequentemente chamado de 'estação de retransmissão' do cérebro porque:",
    options: [
      "Produz hormônios importantes",
      "Coordena movimentos voluntários",
      "Retransmite quase todos os sinais sensoriais ao córtex",
      "Regula o apetite e sede",
    ],
    correct: 2,
  },
  {
    question: "Qual lobo cerebral processa a compreensão da linguagem (Área de Wernicke)?",
    options: ["Lobo Frontal", "Lobo Parietal", "Lobo Temporal", "Lobo Occipital"],
    correct: 2,
  },
] as const;

// ─── SVG CONSTANTS (Lateral view, viewBox "0 -20 480 370") ───────────────────

// Improved brain outline with gyri bumps along the superior surface
const BRAIN_OUTLINE =
  "M 105 195 C 78 172 62 138 62 108 C 62 73 83 43 118 25 " +
  "C 134 16 148 19 158 10 C 170 1 188 -3 208 -3 " +
  "C 226 -3 238 5 252 -1 C 268 -7 288 -7 305 1 " +
  "C 318 7 326 17 340 11 C 358 3 382 21 410 56 " +
  "C 438 90 450 128 450 165 C 450 198 434 220 412 234 " +
  "C 388 250 362 258 336 260 C 310 262 286 254 268 246 " +
  "C 250 238 232 228 218 218 C 205 210 192 206 185 206 Z";

// Cerebellum — more detailed outline with folia suggestion
const CEREBELLUM_OUTLINE =
  "M 305 248 C 320 256 348 265 376 260 C 404 254 428 236 432 212 " +
  "C 436 190 422 177 406 179 C 390 181 374 196 362 215 " +
  "C 350 232 336 248 318 255 Z";

// Brainstem
const BRAINSTEM_PATH =
  "M 170 204 C 174 220 177 248 174 272 C 171 292 168 304 170 310 " +
  "L 193 310 C 195 304 192 292 189 272 C 186 248 189 220 193 204 Z";

// Lobe fill regions (clipped to BRAIN_OUTLINE):
// ── Frontal: everything anterior to central sulcus + above Sylvian fissure
const FRONTAL_FILL = "M 58 -20 L 268 -20 C 265 38 258 88 252 148 L 148 178 L 58 218 Z";
// ── Motor cortex strip (precentral gyrus)
const MOTOR_FILL = "M 268 -20 L 296 -20 C 292 38 287 88 282 148 L 252 148 C 258 88 265 38 268 -20 Z";
// ── Somatosensory strip (postcentral gyrus)
const SOMATO_FILL = "M 296 -20 L 330 -20 C 326 38 322 88 318 150 L 282 148 C 287 88 292 38 296 -20 Z";
// ── Parietal: behind somatosensory, in front of parieto-occipital, above Sylvian
const PARIETAL_FILL = "M 330 -20 L 386 -20 L 386 28 C 382 72 380 114 382 155 L 318 150 C 322 88 326 38 330 -20 Z";
// ── Temporal: below Sylvian fissure
const TEMPORAL_FILL = "M 58 178 L 382 155 L 382 280 L 58 280 Z";
// ── Occipital: posterior to parieto-occipital sulcus
const OCCIPITAL_FILL = "M 386 -20 L 460 -20 L 460 280 L 386 155 C 380 114 382 72 386 28 Z";

// ─── Sulci lines (lateral) ──────────────────────────────────────────────────
const CENTRAL_SULCUS     = "M 268 -4 C 263 38 256 88 252 148";
const PRECENTRAL_SULCUS  = "M 240 -3 C 236 38 232 88 228 148";
const POSTCENTRAL_SULCUS = "M 298 -3 C 294 38 290 88 285 148";
const SYLVIAN_FISSURE    = "M 148 178 C 188 164 224 157 252 154 C 280 152 312 152 342 155";
const PARIETO_OCC_SULCUS = "M 382 24 C 380 70 380 112 382 155";
const SUP_TEMPORAL_SULCUS= "M 165 208 C 205 196 248 190 285 188 C 312 186 340 188 360 194";

// Gyri texture lines (lateral)
const LATERAL_GYRI = [
  "M 84 118 C 100 108 116 118 130 110",
  "M 80 152 C 95 142 110 152 123 144",
  "M 126 62 C 140 52 154 62 168 52",
  "M 143 32 C 157 22 170 33 183 24",
  "M 192 6 C 206 -4 220 8 234 -2",
  "M 248 3 C 262 -6 276 5 290 -4",
  "M 296 3 C 310 -6 325 5 338 -3",
  "M 338 19 C 353 10 367 21 381 13",
  "M 388 46 C 402 37 414 48 426 40",
  "M 420 74 C 432 65 442 76 451 68",
  "M 424 110 C 436 101 445 112 454 106",
  "M 420 147 C 431 138 440 149 449 143",
  "M 155 182 C 168 173 180 183 193 175",
  "M 200 194 C 215 185 228 196 242 188",
];

// ─── MEDIAL VIEW SVG CONSTANTS (same viewBox "0 -20 480 370") ───────────────
// Corpus callosum (major white matter commissure — arched band)
const CORPUS_CALLOSUM =
  "M 148 162 C 148 146 158 134 176 127 C 196 119 226 115 256 114 " +
  "C 292 113 330 118 356 131 C 376 141 382 153 368 163 " +
  "C 352 171 322 175 290 175 L 256 175 C 226 175 195 173 172 168 " +
  "C 156 164 148 163 148 162 Z";

// Cingulate gyrus (arches just above corpus callosum)
const CINGULATE_FILL =
  "M 140 155 C 140 124 156 100 180 86 C 205 71 238 63 270 62 " +
  "C 306 61 344 70 370 87 C 393 102 402 124 392 144 " +
  "C 385 128 368 118 348 112 C 324 104 294 101 264 101 " +
  "C 234 101 200 106 178 116 C 158 125 148 138 148 155 Z";

// Medial frontal, parietal, occipital regions (above/behind cingulate)
const MEDIAL_FRONTAL_FILL =
  "M 58 -20 L 270 -20 L 268 -4 C 262 -10 245 -8 228 -2 " +
  "C 210 4 194 0 178 86 L 140 155 L 58 200 Z";
const MEDIAL_PARIETAL_FILL =
  "M 270 -20 L 386 -20 L 386 28 C 382 72 380 114 382 155 " +
  "C 370 87 344 70 268 62 L 270 -20 Z";
const MEDIAL_OCCIPITAL_FILL =
  "M 386 -20 L 460 -20 L 460 280 L 386 155 C 380 114 382 72 386 28 Z";

// Thalamus (egg-shaped relay center)
const THALAMUS_PATH =
  "M 232 182 C 240 170 258 164 280 163 C 304 162 324 169 335 182 " +
  "C 346 195 344 212 332 222 C 320 232 300 237 278 237 " +
  "C 256 237 238 230 228 220 C 217 208 222 194 232 182 Z";

// Hypothalamus (below thalamus, small)
const HYPOTHALAMUS_PATH =
  "M 242 220 C 252 212 266 207 280 207 C 296 207 310 213 318 222 " +
  "C 326 232 320 244 306 250 C 293 256 264 256 252 250 " +
  "C 237 244 232 230 242 220 Z";

// Pons (anterior brainstem)
const PONS_PATH =
  "M 238 248 L 270 248 C 277 256 280 272 278 288 " +
  "C 276 300 268 310 260 313 C 252 316 244 310 240 300 " +
  "C 234 288 233 272 238 255 Z";

// Medulla oblongata
const MEDULLA_PATH =
  "M 245 311 L 268 311 L 266 342 C 264 352 255 356 252 352 " +
  "C 248 356 240 352 240 342 Z";

// Medial gyri / sulci texture lines
const MEDIAL_GYRI = [
  "M 78 148 C 93 136 108 148 121 138",
  "M 74 114 C 88 102 103 114 116 104",
  "M 86 80 C 100 68 115 80 128 70",
  "M 113 50 C 126 40 140 52 152 42",
  "M 148 24 C 162 14 175 26 187 16",
  "M 193 6 C 205 -3 218 8 230 -2",
  "M 300 4 C 314 -6 328 6 342 -2",
  "M 346 18 C 360 8 374 20 386 12",
];

// ─── SUPERIOR VIEW SVG CONSTANTS (same viewBox "0 -20 480 370") ─────────────
// Brain outline (top-down oval, both hemispheres together)
const SUPERIOR_OUTLINE =
  "M 240 265 C 206 268 170 262 140 248 " +
  "C 100 228 68 196 52 158 C 36 120 42 80 64 52 " +
  "C 88 24 128 6 172 -2 C 200 -8 222 -6 240 -6 " +
  "C 258 -6 280 -8 308 -2 C 352 6 392 24 416 52 " +
  "C 438 80 444 120 428 158 C 412 196 380 228 340 248 " +
  "C 310 262 274 268 240 265 Z";

// Interhemispheric fissure
const INTERHEMISPHERIC = "M 240 -6 L 240 265";

// Superior lobe fills:
const SUP_FRONTAL_L  = "M 40  -20 L 240 -20 L 240 118 L 40  118 Z";
const SUP_FRONTAL_R  = "M 240 -20 L 440 -20 L 440 118 L 240 118 Z";
const SUP_PARIETAL_L = "M 40  116 L 240 116 L 240 202 L 40  202 Z";
const SUP_PARIETAL_R = "M 240 116 L 440 116 L 440 202 L 240 202 Z";
const SUP_OCCIPITAL_L= "M 40  200 L 240 200 L 240 280 L 40  280 Z";
const SUP_OCCIPITAL_R= "M 240 200 L 440 200 L 440 280 L 240 280 Z";

// Central sulcus (horizontal in superior view)
const CENTRAL_SUL_SUP = "M 62 118 L 240 118 M 240 118 L 418 118";
// Pre/postcentral
const PREC_SUP  = "M 68 95 L 240 95 M 240 95 L 412 95";
const POSTC_SUP = "M 60 140 L 240 140 M 240 140 L 420 140";
// Parieto-occipital
const PO_SUP    = "M 56 202 C 120 196 180 193 240 193 C 300 193 360 196 424 202";

// Superior gyri texture (left side)
const SUP_GYRI_L = [
  "M 97 38 C 112 28 127 38 141 30",
  "M 74 64 C 88 54 102 64 116 56",
  "M 58 92 C 72 82 86 92 100 84",
  "M 52 120 C 68 110 82 120 96 112",
  "M 54 148 C 70 138 84 148 98 140",
  "M 62 174 C 78 164 93 174 106 166",
  "M 82 198 C 98 188 114 198 128 190",
  "M 112 220 C 130 210 148 222 164 213",
  "M 156 244 C 172 235 188 244 202 236",
];
// Mirror for right hemisphere: (480 - x), keep y
const SUP_GYRI_R = SUP_GYRI_L.map((d) =>
  d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${480 - parseFloat(x)} ${y}`
  )
);

// ─── LABEL DEFINITIONS PER VIEW ─────────────────────────────────────────────

interface Label {
  regionId: string;
  text: string;
  tx: number; // text anchor x
  ty: number; // text anchor y
  anchor: "start" | "middle" | "end";
  lx1: number; // line from (lx1,ly1)
  ly1: number;
  lx2: number; // to (lx2,ly2) — near region center
  ly2: number;
}

const LATERAL_LABELS: Label[] = [
  { regionId: "prefrontal",    text: "Pré-frontal",         tx: 12,  ty:  85, anchor: "start", lx1: 110, ly1:  85, lx2: 145, ly2: 105 },
  { regionId: "motor",         text: "Motor",               tx: 240, ty: -16, anchor: "middle", lx1: 268, ly1: -12, lx2: 270, ly2:  20 },
  { regionId: "somatosensory", text: "Somatossensorial",    tx: 310, ty: -16, anchor: "middle", lx1: 310, ly1: -12, lx2: 308, ly2:  20 },
  { regionId: "parietal",      text: "Parietal",            tx: 468, ty:  48, anchor: "end",   lx1: 450, ly1:  55, lx2: 358, ly2:  75 },
  { regionId: "temporal",      text: "Temporal",            tx: 220, ty: 278, anchor: "middle", lx1: 230, ly1: 270, lx2: 265, ly2: 232 },
  { regionId: "occipital",     text: "Occipital",           tx: 468, ty: 155, anchor: "end",   lx1: 450, ly1: 155, lx2: 432, ly2: 140 },
  { regionId: "insula",        text: "Ínsula ◆",            tx: 175, ty: 148, anchor: "end",   lx1: 180, ly1: 153, lx2: 215, ly2: 165 },
  { regionId: "cerebellum",    text: "Cerebelo",            tx: 380, ty: 310, anchor: "middle", lx1: 380, ly1: 304, lx2: 368, ly2: 262 },
  { regionId: "brainstem",     text: "Tronco Encefálico",   tx: 148, ty: 310, anchor: "end",   lx1: 152, ly1: 304, lx2: 180, ly2: 275 },
];

const MEDIAL_LABELS: Label[] = [
  { regionId: "prefrontal",     text: "Frontal Medial",     tx: 12,  ty: 80, anchor: "start", lx1: 115, ly1:  80, lx2: 140, ly2: 100 },
  { regionId: "cingulate",      text: "Giro Cingulado",     tx: 200, ty: -16, anchor: "middle", lx1: 210, ly1: -12, lx2: 240, ly2:  65 },
  { regionId: "corpus_callosum",text: "Corpo Caloso",       tx: 258, ty: 108, anchor: "middle", lx1: 258, ly1: 112, lx2: 258, ly2: 130 },
  { regionId: "thalamus",       text: "Tálamo",             tx: 468, ty: 185, anchor: "end",   lx1: 450, ly1: 192, lx2: 338, ly2: 198 },
  { regionId: "hypothalamus",   text: "Hipotálamo",         tx: 468, ty: 235, anchor: "end",   lx1: 450, ly1: 240, lx2: 322, ly2: 232 },
  { regionId: "parietal",       text: "Parietal Medial",    tx: 370, ty:  40, anchor: "start", lx1: 365, ly1:  48, lx2: 348, ly2:  82 },
  { regionId: "occipital",      text: "Occipital Medial",   tx: 468, ty: 120, anchor: "end",   lx1: 450, ly1: 125, lx2: 432, ly2: 115 },
  { regionId: "amygdala",       text: "Amígdala ◆",         tx: 130, ty: 218, anchor: "end",   lx1: 135, ly1: 220, lx2: 180, ly2: 218 },
  { regionId: "hippocampus",    text: "Hipocampo ◆",        tx: 130, ty: 242, anchor: "end",   lx1: 135, ly1: 245, lx2: 195, ly2: 245 },
  { regionId: "cerebellum",     text: "Cerebelo",           tx: 380, ty: 310, anchor: "middle", lx1: 380, ly1: 304, lx2: 368, ly2: 262 },
  { regionId: "brainstem",      text: "Tronco",             tx: 155, ty: 310, anchor: "end",   lx1: 158, ly1: 304, lx2: 180, ly2: 280 },
];

const SUPERIOR_LABELS: Label[] = [
  { regionId: "prefrontal",  text: "Frontal",    tx: 148, ty: 46, anchor: "middle", lx1: 148, ly1: 52, lx2: 148, ly2: 75 },
  { regionId: "motor",       text: "Motor",      tx: 148, ty: 100, anchor: "middle", lx1: 148, ly1: 106, lx2: 148, ly2: 115 },
  { regionId: "parietal",    text: "Parietal",   tx: 148, ty: 155, anchor: "middle", lx1: 148, ly1: 160, lx2: 148, ly2: 168 },
  { regionId: "occipital",   text: "Occipital",  tx: 148, ty: 230, anchor: "middle", lx1: 148, ly1: 234, lx2: 148, ly2: 240 },
  { regionId: "cerebellum",  text: "Cerebelo",   tx: 148, ty: 275, anchor: "middle", lx1: 148, ly1: 278, lx2: 148, ly2: 278 },
  // Right side mirrors
  { regionId: "prefrontal",  text: "Frontal",    tx: 332, ty: 46, anchor: "middle", lx1: 332, ly1: 52, lx2: 332, ly2: 75 },
  { regionId: "parietal",    text: "Parietal",   tx: 332, ty: 155, anchor: "middle", lx1: 332, ly1: 160, lx2: 332, ly2: 168 },
  { regionId: "occipital",   text: "Occipital",  tx: 332, ty: 230, anchor: "middle", lx1: 332, ly1: 234, lx2: 332, ly2: 240 },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const VIEW_TABS: { id: ViewType; label: string; emoji: string; desc: string }[] = [
  { id: "lateral",  label: "Visão Lateral",  emoji: "��", desc: "Superfície lateral — lobos, sulcos e giros" },
  { id: "medial",   label: "Corte Sagital",  emoji: "✂️",  desc: "Seção mediana — estruturas internas profundas" },
  { id: "superior", label: "Visão Dorsal",   emoji: "⬆️",  desc: "Vista superior — ambos os hemisférios" },
];

export default function NeuroLabPage() {
  const [view, setView] = useState<ViewType>("lateral");
  const [selected, setSelected] = useState<BrainRegion | null>(null);
  const [activationMode, setActivationMode] = useState(false);
  const [activeStimulus, setActiveStimulus] = useState<StimulusPreset | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  const activeRegionIds = activeStimulus?.regions ?? [];
  const isActive = (id: string) => activationMode && activeRegionIds.includes(id);

  const regionById = (id: string) => BRAIN_REGIONS.find((r) => r.id === id);

  const handleRegionClick = (id: string) => {
    const region = regionById(id);
    if (!region) return;
    setSelected(selected?.id === id ? null : region);
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

  // When switching views, keep selection only if region appears in the new view
  const switchView = (v: ViewType) => {
    setView(v);
    if (selected && !selected.views.includes(v)) setSelected(null);
  };

  // ── Shared fill-opacity helper
  const regionOpacity = (id: string) =>
    activationMode
      ? isActive(id)
        ? 0.82
        : 0.12
      : selected?.id === id
        ? 0.84
        : 0.38;

  const regionFill = (id: string, baseColor: string, activeColor: string) =>
    activationMode ? (isActive(id) ? activeColor : baseColor) : selected?.id === id ? activeColor : baseColor;

  // ── Legend button classes
  const legendBtnCls = (id: string) =>
    `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
      selected?.id === id
        ? "border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800"
        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
    }`;

  // ── Subcortical marker rendering (pulse when active)
  const SubcorticalMarker = ({
    cx, cy, rx, ry, id, color, activeColor,
  }: {
    cx: number; cy: number; rx: number; ry: number;
    id: string; color: string; activeColor: string;
  }) => {
    const active = isActive(id);
    const sel = selected?.id === id;
    return (
      <g style={{ cursor: "pointer" }} onClick={() => handleRegionClick(id)}>
        {(active || sel) && (
          <ellipse cx={cx} cy={cy} rx={rx + 8} ry={ry + 6} fill="none"
            stroke={activeColor} strokeWidth="1.5" opacity="0.5">
            <animate attributeName="rx" values={`${rx+4};${rx+14};${rx+4}`} dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
          </ellipse>
        )}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
          fill={active || sel ? activeColor : color}
          opacity={activationMode ? (active ? 0.88 : 0.22) : sel ? 0.9 : 0.72}
          stroke={active || sel ? activeColor : "transparent"} strokeWidth="1.5"
          style={{ transition: "all 0.3s" }}
        />
        <circle cx={cx} cy={cy} r="3.5" fill="white" opacity="0.9" />
      </g>
    );
  };

  // ── Labels renderer (shared across views)
  const renderLabels = (labels: Label[]) =>
    labels.map((l, i) => {
      const r = regionById(l.regionId);
      if (!r) return null;
      const isHighlighted = isActive(l.regionId) || selected?.id === l.regionId;
      return (
        <g key={i}>
          <line x1={l.lx1} y1={l.ly1} x2={l.lx2} y2={l.ly2}
            stroke={isHighlighted ? r.activeColor : "#9CA3AF"}
            strokeWidth={isHighlighted ? "1.5" : "0.8"}
            style={{ transition: "stroke 0.3s" }}
          />
          <text x={l.tx} y={l.ty} textAnchor={l.anchor}
            fontSize="9.5" fontWeight={isHighlighted ? "700" : "500"}
            fill={isHighlighted ? r.activeColor : "#6B7280"}
            style={{ pointerEvents: "none", transition: "fill 0.3s" }}
          >
            {l.text}
          </text>
        </g>
      );
    });

  // ─── LATERAL SVG ────────────────────────────────────────────────────────────
  const LateralSVG = () => {
    const lobe = (id: string, fillPath: string, color: string, activeColor: string) => (
      <path
        key={id} d={fillPath}
        fill={regionFill(id, color, activeColor)}
        opacity={regionOpacity(id)}
        clipPath="url(#brainClipL)"
        style={{ cursor: "pointer", transition: "all 0.3s" }}
        onClick={() => handleRegionClick(id)}
      />
    );

    // Click-area overlay for each lobe region
    const hitArea = (id: string, fillPath: string) => (
      <path key={`hit-${id}`} d={fillPath} fill="transparent"
        clipPath="url(#brainClipL)" style={{ cursor: "pointer" }}
        onClick={() => handleRegionClick(id)}
      />
    );

    const cbRegion = regionById("cerebellum")!;
    const cbActive = isActive("cerebellum");
    const cbSel    = selected?.id === "cerebellum";

    return (
      <svg viewBox="0 -20 480 370" className="w-full select-none" style={{ maxHeight: 380 }}>
        <defs>
          <clipPath id="brainClipL"><path d={BRAIN_OUTLINE} /></clipPath>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Brain body background */}
        <path d={BRAIN_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />
        <path d={CEREBELLUM_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />
        <path d={BRAINSTEM_PATH} fill="#FEF9F0" className="dark:fill-gray-800" />

        {/* ── Lobe fills (back→front order so frontal covers temporal overlap) */}
        {lobe("occipital",     OCCIPITAL_FILL,  "#FCA5A5", "#DC2626")}
        {lobe("temporal",      TEMPORAL_FILL,   "#FCD34D", "#D97706")}
        {lobe("parietal",      PARIETAL_FILL,   "#6EE7B7", "#10B981")}
        {lobe("somatosensory", SOMATO_FILL,     "#34D399", "#059669")}
        {lobe("motor",         MOTOR_FILL,      "#818CF8", "#4338CA")}
        {lobe("prefrontal",    FRONTAL_FILL,    "#93C5FD", "#2563EB")}

        {/* ── Cerebellum */}
        <path d={CEREBELLUM_OUTLINE}
          fill={regionFill("cerebellum", cbRegion.color, cbRegion.activeColor)}
          opacity={regionOpacity("cerebellum")}
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          filter={cbActive ? "url(#glow)" : undefined}
          onClick={() => handleRegionClick("cerebellum")}
        />
        {/* Cerebellar folia lines */}
        {[
          "M 320 252 C 335 242 355 244 368 238",
          "M 315 260 C 332 250 354 252 370 247",
          "M 335 265 C 350 257 368 260 382 255",
          "M 360 262 C 374 254 390 254 403 247",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#A5F3FC" strokeWidth="1.2" opacity="0.6" />
        ))}

        {/* ── Brainstem */}
        <path d={BRAINSTEM_PATH}
          fill={regionFill("brainstem", "#D1D5DB", "#6B7280")}
          opacity={regionOpacity("brainstem")}
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("brainstem")}
        />

        {/* ── Gyri texture */}
        {LATERAL_GYRI.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#D1D5DB" strokeWidth="1.6" strokeLinecap="round" />
        ))}

        {/* ── Sulci lines (drawn on top of fills) */}
        {[
          { d: CENTRAL_SULCUS,      w: 2.2, c: "#6B7280" },
          { d: PRECENTRAL_SULCUS,   w: 1.4, c: "#9CA3AF" },
          { d: POSTCENTRAL_SULCUS,  w: 1.4, c: "#9CA3AF" },
          { d: SYLVIAN_FISSURE,     w: 2.4, c: "#6B7280" },
          { d: PARIETO_OCC_SULCUS,  w: 1.8, c: "#9CA3AF" },
          { d: SUP_TEMPORAL_SULCUS, w: 1.2, c: "#B0B8C4" },
        ].map(({ d, w, c }, i) => (
          <path key={i} d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
        ))}

        {/* ── Brain outline on top */}
        <path d={BRAIN_OUTLINE} fill="none" stroke="#6B7280" strokeWidth="2.2" />
        <path d={CEREBELLUM_OUTLINE} fill="none" stroke="#6B7280" strokeWidth="2.0" />
        <path d={BRAINSTEM_PATH} fill="none" stroke="#6B7280" strokeWidth="1.8" />

        {/* ── Subcortical markers (amygdala, hippocampus, insula) */}
        <SubcorticalMarker id="insula"      cx={215} cy={165} rx={22} ry={14}
          color="#C084FC" activeColor="#9333EA" />
        <SubcorticalMarker id="amygdala"    cx={220} cy={196} rx={22} ry={16}
          color="#F9A8D4" activeColor="#DB2777" />
        <SubcorticalMarker id="hippocampus" cx={265} cy={210} rx={28} ry={14}
          color="#C4B5FD" activeColor="#7C3AED" />

        {/* ── Transparent hit areas */}
        {hitArea("occipital",     OCCIPITAL_FILL)}
        {hitArea("temporal",      TEMPORAL_FILL)}
        {hitArea("parietal",      PARIETAL_FILL)}
        {hitArea("somatosensory", SOMATO_FILL)}
        {hitArea("motor",         MOTOR_FILL)}
        {hitArea("prefrontal",    FRONTAL_FILL)}

        {/* ── Labels */}
        {renderLabels(LATERAL_LABELS)}

        {/* ── Sulcus name labels */}
        <text x="255" y="140" textAnchor="middle" fontSize="7" fill="#9CA3AF" fontStyle="italic">
          S. Central
        </text>
        <text x="248" y="170" textAnchor="start" fontSize="7" fill="#9CA3AF" fontStyle="italic">
          Fissura de Sylvius
        </text>
        <text x="10" y="350" fontSize="9" fill="#9CA3AF">
          Clique em uma região para explorar
        </text>
      </svg>
    );
  };

  // ─── MEDIAL SVG ─────────────────────────────────────────────────────────────
  const MedialSVG = () => {
    const zone = (id: string, d: string, color: string, activeColor: string) => (
      <path key={id} d={d}
        fill={regionFill(id, color, activeColor)}
        opacity={regionOpacity(id)}
        clipPath="url(#brainClipM)"
        style={{ cursor: "pointer", transition: "all 0.3s" }}
        onClick={() => handleRegionClick(id)}
      />
    );

    const cbRegion = regionById("cerebellum")!;
    const cbActive = isActive("cerebellum");

    return (
      <svg viewBox="0 -20 480 370" className="w-full select-none" style={{ maxHeight: 380 }}>
        <defs>
          <clipPath id="brainClipM"><path d={BRAIN_OUTLINE} /></clipPath>
        </defs>

        {/* Brain background */}
        <path d={BRAIN_OUTLINE}    fill="#FEF9F0" className="dark:fill-gray-800" />
        <path d={CEREBELLUM_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />

        {/* ── Medial cortical regions */}
        {zone("occipital", MEDIAL_OCCIPITAL_FILL, "#FCA5A5", "#DC2626")}
        {zone("parietal",  MEDIAL_PARIETAL_FILL,  "#6EE7B7", "#10B981")}
        {zone("prefrontal",MEDIAL_FRONTAL_FILL,   "#93C5FD", "#2563EB")}
        {zone("cingulate", CINGULATE_FILL,        "#FDE68A", "#F59E0B")}

        {/* ── Corpus callosum */}
        <path d={CORPUS_CALLOSUM}
          fill={regionFill("corpus_callosum", "#F9FAFB", "#9CA3AF")}
          opacity={activationMode ? (isActive("corpus_callosum") ? 0.95 : 0.5) : selected?.id === "corpus_callosum" ? 0.95 : 0.85}
          stroke="#9CA3AF" strokeWidth="1.2"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("corpus_callosum")}
        />

        {/* ── Gyri texture */}
        {MEDIAL_GYRI.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
        ))}

        {/* ── Parieto-occipital sulcus (medial) */}
        <path d={PARIETO_OCC_SULCUS} fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
        {/* ── Calcarine sulcus (approximate) */}
        <path d="M 390 150 C 418 168 440 188 430 215" fill="none" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />

        {/* ── Brain outline */}
        <path d={BRAIN_OUTLINE} fill="none" stroke="#6B7280" strokeWidth="2.2" />
        <path d={CEREBELLUM_OUTLINE} fill="none" stroke="#6B7280" strokeWidth="2.0" />

        {/* ── Cerebellum fill */}
        <path d={CEREBELLUM_OUTLINE}
          fill={regionFill("cerebellum", cbRegion.color, cbRegion.activeColor)}
          opacity={regionOpacity("cerebellum")}
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          filter={cbActive ? "url(#glow)" : undefined}
          onClick={() => handleRegionClick("cerebellum")}
        />
        {[
          "M 320 252 C 335 242 355 244 368 238",
          "M 316 260 C 333 250 355 252 372 247",
          "M 338 265 C 353 257 370 260 384 255",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#A5F3FC" strokeWidth="1.2" opacity="0.5" />
        ))}

        {/* ── Thalamus */}
        <path d={THALAMUS_PATH}
          fill={regionFill("thalamus", "#FB923C", "#EA580C")}
          opacity={regionOpacity("thalamus")}
          stroke="#EA580C" strokeWidth="1"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("thalamus")}
        />

        {/* ── Hypothalamus */}
        <path d={HYPOTHALAMUS_PATH}
          fill={regionFill("hypothalamus", "#F87171", "#B91C1C")}
          opacity={regionOpacity("hypothalamus")}
          stroke="#B91C1C" strokeWidth="1"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("hypothalamus")}
        />

        {/* ── Brainstem (pons + medulla) */}
        <path d={PONS_PATH}
          fill={regionFill("brainstem", "#D1D5DB", "#6B7280")}
          opacity={regionOpacity("brainstem")}
          stroke="#9CA3AF" strokeWidth="1"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("brainstem")}
        />
        <path d={MEDULLA_PATH}
          fill={regionFill("brainstem", "#E5E7EB", "#9CA3AF")}
          opacity={regionOpacity("brainstem")}
          stroke="#9CA3AF" strokeWidth="1"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("brainstem")}
        />

        {/* ── Subcortical markers */}
        <SubcorticalMarker id="amygdala"    cx={185} cy={220} rx={22} ry={14}
          color="#F9A8D4" activeColor="#DB2777" />
        <SubcorticalMarker id="hippocampus" cx={222} cy={245} rx={30} ry={14}
          color="#C4B5FD" activeColor="#7C3AED" />

        {/* ── Lateral ventricle suggestion */}
        <path d="M 175 140 C 205 132 235 130 265 130 C 295 130 325 133 350 140 C 325 145 295 148 265 148 C 235 148 205 148 175 148 Z"
          fill="#EFF6FF" opacity="0.5" className="dark:fill-blue-900/20" />
        <text x="263" y="143" textAnchor="middle" fontSize="7" fill="#93C5FD" fontStyle="italic">
          Ventrículo Lateral
        </text>

        {/* ── Labels */}
        {renderLabels(MEDIAL_LABELS)}

        <text x="10" y="350" fontSize="9" fill="#9CA3AF">
          Corte sagital (mediano) — hemisfério direito visto de dentro
        </text>
      </svg>
    );
  };

  // ─── SUPERIOR SVG ────────────────────────────────────────────────────────────
  const SuperiorSVG = () => {
    const hemisphere = (id: string, dL: string, dR: string, color: string, activeColor: string) => (
      <>
        <path d={dL} fill={regionFill(id, color, activeColor)}
          opacity={regionOpacity(id)} clipPath="url(#brainClipS)"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick(id)}
        />
        <path d={dR} fill={regionFill(id, color, activeColor)}
          opacity={regionOpacity(id)} clipPath="url(#brainClipS)"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick(id)}
        />
      </>
    );

    const cbR = regionById("cerebellum")!;
    return (
      <svg viewBox="0 -20 480 370" className="w-full select-none" style={{ maxHeight: 380 }}>
        <defs>
          <clipPath id="brainClipS"><path d={SUPERIOR_OUTLINE} /></clipPath>
        </defs>

        {/* Brain background */}
        <path d={SUPERIOR_OUTLINE} fill="#FEF9F0" className="dark:fill-gray-800" />

        {/* ── Lobe fills */}
        {hemisphere("occipital",  SUP_OCCIPITAL_L,  SUP_OCCIPITAL_R,  "#FCA5A5", "#DC2626")}
        {hemisphere("parietal",   SUP_PARIETAL_L,   SUP_PARIETAL_R,   "#6EE7B7", "#10B981")}
        {hemisphere("prefrontal", SUP_FRONTAL_L,    SUP_FRONTAL_R,    "#93C5FD", "#2563EB")}

        {/* ── Motor & somatosensory strips (narrow horizontal bands) */}
        {[
          { id: "motor",         d: `M 60 93 L 240 93 L 240 118 L 60 118 Z`,   c: "#818CF8", ac: "#4338CA" },
          { id: "somatosensory", d: `M 60 118 L 240 118 L 240 142 L 60 142 Z`, c: "#34D399", ac: "#059669" },
          { id: "motor",         d: `M 240 93 L 420 93 L 420 118 L 240 118 Z`, c: "#818CF8", ac: "#4338CA" },
          { id: "somatosensory", d: `M 240 118 L 420 118 L 420 142 L 240 142 Z`,c:"#34D399", ac: "#059669" },
        ].map(({ id, d, c, ac }, i) => (
          <path key={i} d={d}
            fill={regionFill(id, c, ac)} opacity={regionOpacity(id)}
            clipPath="url(#brainClipS)"
            style={{ cursor: "pointer", transition: "all 0.3s" }}
            onClick={() => handleRegionClick(id)}
          />
        ))}

        {/* ── Gyri texture */}
        {[...SUP_GYRI_L, ...SUP_GYRI_R].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#D1D5DB" strokeWidth="1.4" strokeLinecap="round" />
        ))}

        {/* ── Sulci lines */}
        {[
          { d: CENTRAL_SUL_SUP, w: 2.2, c: "#6B7280" },
          { d: PREC_SUP,        w: 1.3, c: "#9CA3AF" },
          { d: POSTC_SUP,       w: 1.3, c: "#9CA3AF" },
          { d: PO_SUP,          w: 1.6, c: "#9CA3AF" },
        ].map(({ d, w, c }, i) => (
          <path key={i} d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
        ))}

        {/* ── Interhemispheric fissure */}
        <path d={INTERHEMISPHERIC} fill="none" stroke="#6B7280" strokeWidth="2.5" />

        {/* ── Brain outline */}
        <path d={SUPERIOR_OUTLINE} fill="none" stroke="#6B7280" strokeWidth="2.2" />

        {/* ── Cerebellum (visible at back in superior view) */}
        <ellipse cx={240} cy={295} rx={95} ry={38}
          fill={regionFill("cerebellum", cbR.color, cbR.activeColor)}
          opacity={regionOpacity("cerebellum")}
          stroke="#6B7280" strokeWidth="1.8"
          style={{ cursor: "pointer", transition: "all 0.3s" }}
          onClick={() => handleRegionClick("cerebellum")}
        />
        {[
          "M 168 295 C 200 285 228 292 240 295",
          "M 168 302 C 200 292 228 299 240 302",
          "M 240 295 C 252 292 280 285 312 295",
          "M 240 302 C 252 299 280 292 312 302",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#A5F3FC" strokeWidth="1.2" opacity="0.6" />
        ))}

        {/* ── Sulcus labels */}
        <text x="135" y="112" textAnchor="end" fontSize="8" fill="#9CA3AF" fontStyle="italic">S. Central</text>
        <text x="130" y="137" textAnchor="end" fontSize="7.5" fill="#9CA3AF" fontStyle="italic">S. Pós-central</text>
        <text x="135" y="89"  textAnchor="end" fontSize="7.5" fill="#9CA3AF" fontStyle="italic">S. Pré-central</text>
        <text x="240" y="-10" textAnchor="middle" fontSize="8" fill="#9CA3AF">← Anterior (Frontal)</text>
        <text x="240" y="285" textAnchor="middle" fontSize="8" fill="#9CA3AF">← Posterior (Occipital)</text>

        {/* ── Labels */}
        {renderLabels(SUPERIOR_LABELS)}

        {/* Cerebelo label */}
        <text x="240" y="300" textAnchor="middle" fontSize="8.5" fontWeight="600"
          fill={isActive("cerebellum") || selected?.id === "cerebellum" ? "#0891B2" : "#6B7280"}
          style={{ pointerEvents: "none" }}>
          Cerebelo
        </text>

        <text x="10" y="350" fontSize="9" fill="#9CA3AF">
          Visão dorsal (de cima) — frente do cérebro ao topo
        </text>
      </svg>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  const visibleRegions = BRAIN_REGIONS.filter((r) => r.views.includes(view));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
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
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">🧠 NeuroLab</span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">NeuroLab</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Explore as divisões do cérebro humano em três perspectivas diferentes. Clique nas regiões
          para descobrir funções, ative o Modo Ativação para ver quais áreas acendem em situações reais.
        </p>
      </div>

      {/* ── View selector tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-900">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchView(tab.id)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-all ${
              view === tab.id
                ? "bg-white shadow text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <span className="text-base">{tab.emoji}</span>
            <span className="font-semibold text-[11px] sm:text-xs">{tab.label}</span>
            <span className="hidden sm:block text-[10px] text-gray-400 font-normal text-center leading-tight">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Activation mode controls */}
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

      {activeStimulus && (
        <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{activeStimulus.description}</p>
        </div>
      )}

      {/* ── Main grid: brain + info panel */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Brain diagram */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            {view === "lateral"  && <LateralSVG />}
            {view === "medial"   && <MedialSVG />}
            {view === "superior" && <SuperiorSVG />}
          </div>

          {/* Region color legend */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleRegions.map((region) => (
              <button
                key={region.id}
                onClick={() => handleRegionClick(region.id)}
                className={legendBtnCls(region.id)}
              >
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: region.activeColor }} />
                <span className="text-gray-700 dark:text-gray-300">{region.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.activeColor }} />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {selected.lobe}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selected.name}</h2>
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
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: selected.activeColor }} />
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
                    <li key={i}
                      className="rounded-lg bg-gray-50 p-2.5 text-sm italic text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
                      <span key={act}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
                Use as abas acima para ver o cérebro de diferentes ângulos e cortes.
              </p>
            </div>
          )}

          {/* View-specific tip */}
          <div className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <Layers className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
            {view === "lateral" && (
              <>A <strong>fissura de Sylvius</strong> (linha horizontal) separa o lobo temporal dos lobos frontal e parietal. O <strong>sulco central</strong> separa o córtex motor (azul-violeta) do somatossensorial (verde).</>
            )}
            {view === "medial" && (
              <>O <strong>corpo caloso</strong> é a grande ponte branca entre os dois hemisférios. Abaixo dele, o <strong>tálamo</strong> (laranja) retransmite quase todos os sinais sensoriais. O <strong>giro cingulado</strong> (amarelo) faz parte do sistema límbico.</>
            )}
            {view === "superior" && (
              <>O <strong>sulco central</strong> (linha horizontal) divide os lobos frontal e parietal. A <strong>fissura inter-hemisférica</strong> (linha central vertical) separa os dois hemisférios. O cerebelo aparece na parte posterior.</>
            )}
          </div>
        </div>
      </div>

      {/* ── Quiz Mode */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">🧠 Modo Quiz</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Teste seus conhecimentos sobre regiões cerebrais
            </p>
          </div>
          <button
            onClick={() => {
              setShowQuiz((v) => !v);
              setQuizIndex(0);
              setQuizAnswers([]);
              setQuizDone(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              showQuiz
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {showQuiz ? "Fechar Quiz" : "🧠 Iniciar Quiz"}
          </button>
        </div>

        {showQuiz && (
          <div className="mt-5">
            {!quizDone ? (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Questão {quizIndex + 1} / {QUIZ_QUESTIONS.length}</span>
                  <div className="flex gap-1">
                    {QUIZ_QUESTIONS.map((_, i) => (
                      <span key={i}
                        className={`inline-block h-2 w-6 rounded-full ${
                          i < quizAnswers.length
                            ? quizAnswers[i] === QUIZ_QUESTIONS[i].correct
                              ? "bg-emerald-400"
                              : "bg-red-400"
                            : i === quizIndex
                              ? "bg-blue-400"
                              : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {QUIZ_QUESTIONS[quizIndex].question}
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {QUIZ_QUESTIONS[quizIndex].options.map((opt, i) => {
                    const answered = quizAnswers.length > quizIndex;
                    const chosen   = quizAnswers[quizIndex];
                    const correct  = QUIZ_QUESTIONS[quizIndex].correct;
                    const isCorrect = i === correct;
                    const isChosen  = i === chosen;

                    let cls =
                      "rounded-xl border px-4 py-3 text-sm text-left font-medium transition-colors flex items-center gap-2 ";
                    if (!answered) {
                      cls +=
                        "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 cursor-pointer";
                    } else if (isCorrect) {
                      cls += "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600";
                    } else if (isChosen && !isCorrect) {
                      cls += "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600";
                    } else {
                      cls += "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500";
                    }

                    return (
                      <button key={i} disabled={answered}
                        onClick={() => setQuizAnswers((prev) => [...prev, i])}
                        className={cls}
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {["A", "B", "C", "D"][i]}
                        </span>
                        {opt}
                        {answered && isCorrect && <span className="ml-auto">✅</span>}
                        {answered && isChosen && !isCorrect && <span className="ml-auto">❌</span>}
                      </button>
                    );
                  })}
                </div>

                {quizAnswers.length > quizIndex && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (quizIndex + 1 >= QUIZ_QUESTIONS.length) {
                          setQuizDone(true);
                        } else {
                          setQuizIndex((v) => v + 1);
                        }
                      }}
                      className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      {quizIndex + 1 >= QUIZ_QUESTIONS.length ? "Ver resultado" : "Próxima →"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center">
                {(() => {
                  const score = quizAnswers.filter(
                    (ans, i) => ans === QUIZ_QUESTIONS[i].correct
                  ).length;
                  return (
                    <>
                      <div className="text-5xl font-black text-blue-600 dark:text-blue-400">
                        {score} / {QUIZ_QUESTIONS.length}
                      </div>
                      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {score === QUIZ_QUESTIONS.length
                          ? "🏆 Perfeito! Você domina as funções cerebrais."
                          : score >= QUIZ_QUESTIONS.length * 0.7
                            ? "🎯 Muito bem! Revise as regiões que você errou."
                            : "📖 Continue explorando o cérebro — cada região tem sua história!"}
                      </p>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {QUIZ_QUESTIONS.map((q, i) => (
                          <span key={i}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              quizAnswers[i] === q.correct
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            Q{i + 1} {quizAnswers[i] === q.correct ? "✅" : "❌"}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setQuizIndex(0);
                          setQuizAnswers([]);
                          setQuizDone(false);
                        }}
                        className="rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                      >
                        🔄 Reiniciar Quiz
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
