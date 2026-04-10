"use client";

import Link from "next/link";
import { Brain, FlaskConical, BookOpen, Activity } from "lucide-react";

const labs = [
  {
    href: "/psicolab/neurolab",
    icon: Brain,
    color: "blue",
    title: "NeuroLab",
    subtitle: "Cérebro & Neurônios",
    description:
      "Explore o cérebro humano interativamente. Clique nas regiões para descobrir funções, comportamentos e conexões neurais.",
    tags: ["Lobo Frontal", "Amígdala", "Hipocampo", "Modo Ativação"],
    available: true,
  },
  {
    href: "/psicolab/condicionamento",
    icon: FlaskConical,
    color: "emerald",
    title: "Lab de Condicionamento",
    subtitle: "Caixa de Skinner",
    description:
      "Simule a Caixa de Skinner! Aplique reforços e punições a um rato virtual e observe como o comportamento muda em tempo real.",
    tags: ["Reforço Positivo", "Reforço Negativo", "Punição", "Extinção"],
    available: true,
  },
  {
    href: "/psicolab/abordagens",
    icon: BookOpen,
    color: "violet",
    title: "Lab de Abordagens",
    subtitle: "Teorias Psicológicas",
    description:
      "Explore as principais abordagens da Psicologia: Behaviorismo, Psicanálise, Humanismo e Cognitivismo com casos interativos.",
    tags: ["Behaviorismo", "Psicanálise", "Humanismo", "Cognitivismo"],
    available: true,
  },
  {
    href: "/psicolab/anatomia",
    icon: Activity,
    color: "rose",
    title: "Anatomofisiologia",
    subtitle: "Sistema Nervoso",
    description:
      "Do neurônio à sinapse: explore o sistema nervoso completo com interações em múltiplos níveis de zoom e detalhes.",
    tags: ["Neurônio", "Sinapse", "Sistema Nervoso", "Em breve"],
    available: false,
  },
];

const colorMap: Record<string, { card: string; icon: string; tag: string; badge: string }> = {
  blue: {
    card: "border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    tag: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    badge: "bg-blue-600",
  },
  emerald: {
    card: "border-emerald-200 hover:border-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-600",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    tag: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    badge: "bg-emerald-600",
  },
  violet: {
    card: "border-violet-200 hover:border-violet-400 dark:border-violet-800 dark:hover:border-violet-600",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    tag: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    badge: "bg-violet-600",
  },
  rose: {
    card: "border-rose-200 hover:border-rose-400 dark:border-rose-800 dark:hover:border-rose-600",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    tag: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    badge: "bg-rose-600",
  },
};

export default function PsicoLabPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <span className="text-lg">🧪</span>
          Laboratório Virtual de Psicologia
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Psico<span className="text-blue-600">Lab</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
          Experimente a Psicologia — não só estude. Simulações interativas para aprender
          neurociência, condicionamento e abordagens psicológicas na prática.
        </p>
      </div>

      {/* Lab cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {labs.map((lab) => {
          const colors = colorMap[lab.color];
          const Icon = lab.icon;
          const card = (
            <div
              className={`group relative rounded-2xl border-2 bg-white p-6 transition-all duration-200 dark:bg-gray-900 ${colors.card} ${lab.available ? "cursor-pointer hover:shadow-lg" : "opacity-60 cursor-not-allowed"}`}
            >
              {!lab.available && (
                <span className="absolute right-4 top-4 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Em breve
                </span>
              )}
              <div className={`mb-4 inline-flex rounded-xl p-3 ${colors.icon}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {lab.title}
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {lab.subtitle}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {lab.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {lab.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.tag}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {lab.available && (
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors">
                  Entrar no lab
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              )}
            </div>
          );

          return lab.available ? (
            <Link key={lab.href} href={lab.href}>
              {card}
            </Link>
          ) : (
            <div key={lab.href}>{card}</div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        🧬 PsicoLab é um laboratório em constante expansão. Novos módulos são adicionados
        regularmente.
      </p>
    </div>
  );
}
