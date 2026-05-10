"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  Rocket,
} from "lucide-react";

type Tab = "produzir" | "aprender";

type ProjectField = {
  key: keyof ProjectDraft;
  label: string;
  placeholder: string;
  minChars?: number;
};

interface ProjectDraft {
  tema: string;
  problema: string;
  objetivoGeral: string;
  hipotese: string;
  variaveis: string;
  metodo: string;
  amostra: string;
  instrumentos: string;
  analise: string;
  etica: string;
  cronograma: string;
}

const STEPS = [
  {
    title: "1. Delimitação do problema",
    description:
      "Transforme interesse amplo em pergunta científica clara, específica e testável.",
    qualityRule: "Use contexto + população + recorte temporal/situacional.",
  },
  {
    title: "2. Objetivo e hipótese",
    description:
      "Defina o objetivo geral do estudo e uma hipótese verificável.",
    qualityRule: "A hipótese deve prever relação entre variáveis, não opinião.",
  },
  {
    title: "3. Desenho metodológico",
    description:
      "Escolha tipo de pesquisa, procedimento, amostra e instrumentos.",
    qualityRule: "Mostre como cada escolha responde ao problema.",
  },
  {
    title: "4. Plano de análise",
    description:
      "Explique como os dados serão organizados, comparados e interpretados.",
    qualityRule: "Descreva critérios objetivos para sustentar conclusões.",
  },
  {
    title: "5. Ética e viabilidade",
    description:
      "Considere consentimento, riscos, limites e cronograma executável.",
    qualityRule: "Sem viabilidade e ética, o estudo perde validade prática.",
  },
] as const;

const CHECKLIST = [
  "Meu problema está claro e não é genérico.",
  "Meu objetivo geral responde diretamente ao problema.",
  "Minha hipótese pode ser testada com dados.",
  "Defini variáveis e como medi-las.",
  "O método é compatível com o tipo de pergunta.",
  "A amostra está descrita com critérios.",
  "Sei quais instrumentos usarei e por quê.",
  "Tenho um plano de análise coerente.",
  "Considerei aspectos éticos essenciais.",
  "Tenho cronograma realista para executar o estudo.",
] as const;

const FIELDS: ProjectField[] = [
  {
    key: "tema",
    label: "Tema do estudo",
    placeholder: "Ex.: Efeito do uso noturno de telas na qualidade do sono em universitários",
    minChars: 8,
  },
  {
    key: "problema",
    label: "Problema de pesquisa",
    placeholder: "Qual pergunta científica você quer responder?",
    minChars: 20,
  },
  {
    key: "objetivoGeral",
    label: "Objetivo geral",
    placeholder: "Ex.: Investigar a relação entre...",
    minChars: 20,
  },
  {
    key: "hipotese",
    label: "Hipótese",
    placeholder: "Ex.: Participantes com... apresentarão...",
    minChars: 20,
  },
  {
    key: "variaveis",
    label: "Variáveis (independente/dependente/controle)",
    placeholder: "Descreva variáveis e indicadores de medida.",
    minChars: 20,
  },
  {
    key: "metodo",
    label: "Método/desenho do estudo",
    placeholder: "Ex.: estudo experimental/quase-experimental/transversal...",
    minChars: 20,
  },
  {
    key: "amostra",
    label: "Amostra e critérios",
    placeholder: "Quem participa? Quantos? Critérios de inclusão/exclusão.",
    minChars: 20,
  },
  {
    key: "instrumentos",
    label: "Instrumentos e procedimentos",
    placeholder: "Questionário, escala, protocolo, etapas de coleta...",
    minChars: 20,
  },
  {
    key: "analise",
    label: "Plano de análise",
    placeholder: "Como os dados serão tratados e comparados?",
    minChars: 20,
  },
  {
    key: "etica",
    label: "Cuidados éticos",
    placeholder: "Consentimento, sigilo, riscos e mitigação.",
    minChars: 12,
  },
  {
    key: "cronograma",
    label: "Cronograma",
    placeholder: "Ex.: revisão (semanas 1-2), coleta (3-5), análise (6-7)...",
    minChars: 12,
  },
];

const INITIAL_DRAFT: ProjectDraft = {
  tema: "",
  problema: "",
  objetivoGeral: "",
  hipotese: "",
  variaveis: "",
  metodo: "",
  amostra: "",
  instrumentos: "",
  analise: "",
  etica: "",
  cronograma: "",
};

export default function MetodologiaPage() {
  const [tab, setTab] = useState<Tab>("produzir");
  const [draft, setDraft] = useState<ProjectDraft>(INITIAL_DRAFT);
  const [checked, setChecked] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<"success" | "error" | null>(null);

  const completion = useMemo(() => {
    const filled = FIELDS.filter((field) => {
      const text = draft[field.key].trim();
      return field.minChars ? text.length >= field.minChars : text.length > 0;
    }).length;

    return Math.round((filled / FIELDS.length) * 100);
  }, [draft]);

  const readyChecklist = useMemo(() => {
    return checked.length;
  }, [checked]);

  const projectPreview = useMemo(() => {
    return `# Pré-projeto de metodologia científica\n\nTema: ${draft.tema || "-"}\n\nProblema: ${draft.problema || "-"}\n\nObjetivo geral: ${draft.objetivoGeral || "-"}\n\nHipótese: ${draft.hipotese || "-"}\n\nVariáveis: ${draft.variaveis || "-"}\n\nMétodo: ${draft.metodo || "-"}\n\nAmostra: ${draft.amostra || "-"}\n\nInstrumentos: ${draft.instrumentos || "-"}\n\nAnálise: ${draft.analise || "-"}\n\nÉtica: ${draft.etica || "-"}\n\nCronograma: ${draft.cronograma || "-"}`;
  }, [draft]);

  const updateField = (key: keyof ProjectDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleChecklist = (item: string) => {
    setChecked((prev) =>
      prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item]
    );
  };

  const resetDraft = () => {
    setDraft(INITIAL_DRAFT);
    setChecked([]);
  };

  const handleCopyProject = async () => {
    try {
      await navigator.clipboard.writeText(projectPreview);
      setCopyFeedback("success");
    } catch {
      setCopyFeedback("error");
    } finally {
      window.setTimeout(() => setCopyFeedback(null), 2200);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/psicolab"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Lab de Metodologia Científica
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ambiente para produzir projetos e aprender metodologia científica (sem quiz).
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">Projeto preenchido</p>
          <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{completion}%</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Checklist de qualidade</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {readyChecklist}/{CHECKLIST.length}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/20">
          <p className="text-xs text-violet-700 dark:text-violet-300">Foco do lab</p>
          <p className="mt-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
            Produção + Aprendizado aplicado
          </p>
        </div>
      </section>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setTab("produzir")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "produzir"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          ✍️ Produzir projeto
        </button>
        <button
          onClick={() => setTab("aprender")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "aprender"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          📚 Aprender metodologia
        </button>
      </div>

      {tab === "produzir" && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Builder de projeto científico
              </h2>
            </div>

            <div className="space-y-3">
              {FIELDS.map((field) => (
                <label key={field.key} className="block space-y-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </span>
                  <textarea
                    value={draft[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    rows={field.key === "tema" ? 2 : 3}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-teal-900"
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={resetDraft}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Limpar rascunho
              </button>
              <button
                onClick={handleCopyProject}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Copiar pré-projeto
              </button>
            </div>
            {copyFeedback === "success" && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Pré-projeto copiado para a área de transferência.
              </p>
            )}
            {copyFeedback === "error" && (
              <p className="text-sm text-red-700 dark:text-red-300">
                Não foi possível copiar automaticamente. Tente novamente.
              </p>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Checklist de qualidade
                </h3>
              </div>

              <div className="mt-3 space-y-2">
                {CHECKLIST.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleChecklist(item)}
                    className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      checked.includes(item)
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        checked.includes(item) ? "text-emerald-600 dark:text-emerald-300" : "text-gray-400"
                      }`}
                    />
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-violet-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Próximo passo</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Quando atingir ~80% de preenchimento e checklist completo, transforme este rascunho em
                um plano formal (introdução, método e referências).
              </p>
            </div>
          </aside>
        </div>
      )}

      {tab === "aprender" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                Trilha de aprendizagem aplicada
              </h2>
            </div>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              A lógica é: aprender um passo e imediatamente aplicar no seu pré-projeto.
            </p>
          </section>

          <div className="grid gap-3">
            {STEPS.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <strong>Critério de qualidade:</strong> {step.qualityRule}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
