"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Condition = "ansiedade" | "depressao" | "fobia";

interface AutomaticThought {
  thought: string;
  distortion: string;
  reframe: string;
}

interface PhysicalReaction {
  symptom: string;
  mechanism: string;
}

interface ConditionData {
  id: Condition;
  name: string;
  emoji: string;
  color: string;
  dsm: string;
  description: string;
  prevalence: string;
  automaticThoughts: AutomaticThought[];
  physicalReactions: PhysicalReaction[];
  treatments: { name: string; evidence: string; description: string }[];
  myths: { myth: string; reality: string }[];
}

const CONDITIONS: ConditionData[] = [
  {
    id: "ansiedade",
    name: "Transtorno de Ansiedade Generalizada",
    emoji: "😰",
    color: "amber",
    dsm: "DSM-5: F41.1",
    description: "Preocupação excessiva e difícil de controlar sobre vários eventos ou atividades, presente na maioria dos dias por pelo menos 6 meses.",
    prevalence: "3-5% da população geral; mais comum em mulheres (2:1).",
    automaticThoughts: [
      { thought: "E se algo der muito errado?", distortion: "Catastrofização", reframe: "Qual a probabilidade real? Já lidei com problemas antes." },
      { thought: "Não consigo controlar nada.", distortion: "Pensamento dicotômico", reframe: "Não controlo tudo, mas controlo minha resposta." },
      { thought: "Preciso ser perfeito para ser aceito.", distortion: "Devo / devo-não", reframe: "Sou suficientemente bom como sou." },
      { thought: "Todos vão me julgar se eu errar.", distortion: "Leitura mental", reframe: "A maioria está preocupada consigo mesma, não comigo." },
    ],
    physicalReactions: [
      { symptom: "Tensão muscular", mechanism: "Ativação do sistema nervoso simpático — prepara para luta/fuga." },
      { symptom: "Palpitações", mechanism: "Aumento do débito cardíaco para irrigar músculos em ação." },
      { symptom: "Falta de ar", mechanism: "Hiperventilação para aumentar O₂ disponível." },
      { symptom: "Insônia", mechanism: "Hiperfunção do eixo HPA (cortisol elevado) impede sono reparador." },
    ],
    treatments: [
      { name: "TCC", evidence: "Alta (grau A)", description: "Reestruturação cognitiva + treinamento de preocupação agendada + exposição." },
      { name: "Mindfulness-Based Stress Reduction", evidence: "Alta (grau A)", description: "Reduz ruminação e aumenta tolerância à incerteza." },
      { name: "ISRS/IRSN", evidence: "Alta (grau A)", description: "Paroxetina, escitalopram, venlafaxina — tratamento farmacológico de primeira linha." },
      { name: "Biofeedback", evidence: "Moderada (grau B)", description: "Treino de variabilidade da frequência cardíaca para regulação autonômica." },
    ],
    myths: [
      { myth: "Ansiedade é frescura ou falta de força de vontade.", reality: "É um transtorno neurobiológico com alterações comprovadas no eixo HPA e no córtex pré-frontal." },
      { myth: "Quem tem ansiedade deve evitar situações estressantes.", reality: "Evitação cronifica a ansiedade. A exposição gradual é o tratamento mais eficaz." },
    ],
  },
  {
    id: "depressao",
    name: "Transtorno Depressivo Maior",
    emoji: "😔",
    color: "blue",
    dsm: "DSM-5: F32/F33",
    description: "Humor deprimido ou perda de interesse por pelo menos 2 semanas, com comprometimento significativo do funcionamento.",
    prevalence: "5-10% em algum momento da vida; segunda maior causa de incapacidade no mundo (OMS).",
    automaticThoughts: [
      { thought: "Nada vai mudar. Sempre foi e sempre será assim.", distortion: "Permanência / Desesperança", reframe: "A depressão é tratável. O que sinto agora não é permanente." },
      { thought: "Sou um fracasso total.", distortion: "Abstração seletiva + generalização", reframe: "Cometi erros em algumas áreas. Isso não define quem sou." },
      { thought: "Não mereço ajuda nem amor.", distortion: "Desqualificação do positivo", reframe: "Todos merecem suporte. Pedir ajuda é força, não fraqueza." },
      { thought: "Os outros estão bem — só eu estou assim.", distortion: "Comparação injusta", reframe: "Não vejo o interior dos outros. A depressão distorce minha percepção." },
    ],
    physicalReactions: [
      { symptom: "Fadiga intensa", mechanism: "Hipofunção dopaminérgica reduz motivação e energia." },
      { symptom: "Alterações do sono", mechanism: "Disfunção serotoninérgica perturba a arquitetura do sono REM." },
      { symptom: "Dores físicas difusas", mechanism: "A depressão amplifica sinais de dor via inibição de vias serotoninérgicas analgésicas." },
      { symptom: "Anedonia", mechanism: "Disfunção do sistema de recompensa (núcleo accumbens / dopamina)." },
    ],
    treatments: [
      { name: "TCC", evidence: "Alta (grau A)", description: "Ativação comportamental + reestruturação cognitiva. Tão eficaz quanto medicação na forma leve-moderada." },
      { name: "Antidepressivos (ISRS)", evidence: "Alta (grau A)", description: "Fluoxetina, sertralina, escitalopram — medicamentos de primeira linha." },
      { name: "Psicoterapia Interpessoal (TIP)", evidence: "Alta (grau A)", description: "Foco nos relacionamentos interpessoais e mudanças de vida." },
      { name: "Exercício físico", evidence: "Alta (grau A)", description: "Metanálises mostram eficácia equivalente a antidepressivos em casos leves-moderados." },
    ],
    myths: [
      { myth: "Depressão é tristeza ou preguiça.", reality: "É um transtorno com base neurobiológica que envolve alterações em neurotransmissores, inflamação e estrutura cerebral." },
      { myth: "'Se esforce mais' é o remédio para a depressão.", reality: "Dizer isso é como dizer 'pare de ter febre'. O tratamento adequado é essencial." },
    ],
  },
  {
    id: "fobia",
    name: "Fobias Específicas",
    emoji: "😱",
    color: "rose",
    dsm: "DSM-5: F40.2xx",
    description: "Medo intenso e irracional de um objeto ou situação específica que leva a evitação ativa e sofrimento significativo.",
    prevalence: "7-9% da população; início geralmente na infância ou adolescência.",
    automaticThoughts: [
      { thought: "Se tocar nessa aranha, vou morrer.", distortion: "Catastrofização + Superestimação de ameaça", reframe: "Aranhas locais raramente são perigosas. Meu cérebro exagera a ameaça." },
      { thought: "Não consigo suportar essa sensação de medo.", distortion: "Intolerância à frustração", reframe: "O medo é desconfortável, mas não me mata. Vai passar." },
      { thought: "Se entrar nesse elevador, algo horrível vai acontecer.", distortion: "Superestimação de probabilidade", reframe: "Elevadores são extremamente seguros estatisticamente." },
    ],
    physicalReactions: [
      { symptom: "Taquicardia imediata", mechanism: "Resposta do núcleo da amígdala — alarme de sobrevivência pré-cognitivo." },
      { symptom: "Suores frios", mechanism: "Ativação simpática — preparação para fuga." },
      { symptom: "Paralisia ou congelamento", mechanism: "Resposta de congelamento (freeze) do sistema límbico antes da luta/fuga." },
      { symptom: "Desorientação", mechanism: "Hiperventilação causa alcalose respiratória temporária." },
    ],
    treatments: [
      { name: "Exposição In Vivo", evidence: "Alta (grau A)", description: "Contato progressivo e real com o estímulo fóbico — tratamento mais eficaz." },
      { name: "Dessensibilização Sistemática", evidence: "Alta (grau A)", description: "Relaxamento progressivo + exposição hierárquica (imaginária → real)." },
      { name: "Realidade Virtual", evidence: "Alta (grau A)", description: "Exposição em ambiente controlado com alta eficácia para fobias específicas." },
      { name: "Terapia de Aceitação e Compromisso (ACT)", evidence: "Moderada (grau B)", description: "Aceitação das sensações fóbicas sem evitação — reduz a luta contra o medo." },
    ],
    myths: [
      { myth: "Fobias são iracionais e a pessoa deveria 'se controlar'.", reality: "A resposta de medo é gerenciada pela amígdala, abaixo do controle racional. O tratamento re-treina essas respostas." },
      { myth: "Fobias nunca melhoram.", reality: "Com tratamento adequado (especialmente exposição), 90% das fobias específicas melhoram significativamente." },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; tab: string; activeTab: string; bar: string }> = {
  amber: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    tab: "text-amber-600 dark:text-amber-400",
    activeTab: "border-b-2 border-amber-500 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    tab: "text-blue-600 dark:text-blue-400",
    activeTab: "border-b-2 border-blue-500 text-blue-700 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  rose: {
    border: "border-rose-200 dark:border-rose-800",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-300",
    tab: "text-rose-600 dark:text-rose-400",
    activeTab: "border-b-2 border-rose-500 text-rose-700 dark:text-rose-300",
    bar: "bg-rose-500",
  },
};

type SectionTab = "thoughts" | "body" | "treatments" | "myths";

export default function PsicopatologiaPage() {
  const [condition, setCondition] = useState<Condition>("ansiedade");
  const [section, setSection] = useState<SectionTab>("thoughts");

  const data = CONDITIONS.find((c) => c.id === condition)!;
  const cc = colorMap[data.color];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Psicopatologia Interativa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Entender, não decorar — Ansiedade, Depressão e Fobias</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
        <p className="text-sm text-purple-700 dark:text-purple-300">
          ⚠️ <strong>Nota educativa:</strong> Este módulo é para fins de aprendizagem. Não substitui diagnóstico ou tratamento profissional. Se você ou alguém que você conhece precisa de suporte, procure um psicólogo ou psiquiatra.
        </p>
      </div>

      {/* Condition selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        {CONDITIONS.map((c) => {
          const ccc = colorMap[c.color];
          return (
            <button
              key={c.id}
              onClick={() => { setCondition(c.id); setSection("thoughts"); }}
              className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                condition === c.id
                  ? `${ccc.border} ${ccc.bg}`
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <div className="text-3xl mb-2">{c.emoji}</div>
              <h3 className={`font-bold text-sm ${condition === c.id ? ccc.text : "text-gray-700 dark:text-gray-300"}`}>
                {c.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{c.dsm}</p>
            </button>
          );
        })}
      </div>

      {/* Condition overview */}
      <div className={`rounded-2xl border-2 p-5 ${cc.border} ${cc.bg}`}>
        <h2 className={`text-lg font-bold ${cc.text}`}>{data.emoji} {data.name}</h2>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{data.description}</p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400"><strong>Prevalência:</strong> {data.prevalence}</p>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["thoughts", "body", "treatments", "myths"] as SectionTab[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`flex-1 pb-2 pt-1 text-sm font-medium transition-all ${
              section === s ? cc.activeTab : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            }`}
          >
            {s === "thoughts" ? "💭 Pensamentos" : s === "body" ? "🫀 Corpo" : s === "treatments" ? "💊 Tratamentos" : "🔍 Mitos"}
          </button>
        ))}
      </div>

      {/* Section content */}
      {section === "thoughts" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pensamentos automáticos são rápidos, involuntários e distorcem a realidade. A TCC os identifica e reestrutura.
          </p>
          {data.automaticThoughts.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">💭</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">&ldquo;{t.thought}&rdquo;</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-red-50 border border-red-100 p-2 dark:bg-red-900/20 dark:border-red-900">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">Distorção cognitiva</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{t.distortion}</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-100 p-2 dark:bg-green-900/20 dark:border-green-900">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">Pensamento alternativo</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{t.reframe}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "body" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Transtornos psicológicos produzem reações físicas reais — não é &ldquo;coisa da cabeça&rdquo;. Entender o mecanismo desmistifica e reduz o medo dos sintomas.
          </p>
          {data.physicalReactions.map((r, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${cc.border} ${cc.bg}`}>
              <h3 className={`font-bold ${cc.text}`}>{r.symptom}</h3>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.mechanism}</p>
            </div>
          ))}
        </div>
      )}

      {section === "treatments" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tratamentos baseados em evidências com nível de evidência científica.
          </p>
          {data.treatments.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t.name}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cc.bg} ${cc.text} border ${cc.border}`}>
                  {t.evidence}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t.description}</p>
            </div>
          ))}
        </div>
      )}

      {section === "myths" && (
        <div className="space-y-4">
          {data.myths.map((m, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl">❌</span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-through opacity-60">{m.myth}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✅</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.reality}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            Psicopatologia educativa — baseada no DSM-5 e em evidências científicas atuais.
          </p>
        </div>
      )}
    </div>
  );
}
