"use client";

import Link from "next/link";
import { Brain, FlaskConical, BookOpen, Activity, Zap, Users, Sparkles, MessageSquare, Baby, GraduationCap, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

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
    tags: ["Neurônio", "Sinapse", "Sistema Nervoso"],
    available: true,
  },
  {
    href: "/psicolab/cognitivo",
    icon: Sparkles,
    color: "amber",
    title: "Processos Cognitivos",
    subtitle: "Mente em Ação",
    description:
      "Teste sua memória com a curva de Ebbinghaus, experiencie o Efeito Stroop e descubra seus vieses cognitivos.",
    tags: ["Memória", "Efeito Stroop", "Vieses Cognitivos"],
    available: true,
  },
  {
    href: "/psicolab/neurotransmissores",
    icon: Zap,
    color: "cyan",
    title: "Neurociência Experimental",
    subtitle: "Química do Comportamento",
    description:
      "Ajuste os níveis de dopamina, serotonina e cortisol e veja como a química cerebral molda motivação, humor e comportamento.",
    tags: ["Dopamina", "Serotonina", "Noradrenalina", "Cortisol"],
    available: true,
  },
  {
    href: "/psicolab/clinico",
    icon: MessageSquare,
    color: "teal",
    title: "Simulador Clínico",
    subtitle: "Prática Terapêutica",
    description:
      "Pratique como terapeuta: escolha uma abordagem (Freud, Rogers, Beck) e conduza sessões com pacientes virtuais.",
    tags: ["Psicanálise", "Humanismo", "TCC", "Paciente Virtual"],
    available: true,
  },
  {
    href: "/psicolab/social",
    icon: Users,
    color: "indigo",
    title: "Psicologia Social",
    subtitle: "Comportamento em Grupo",
    description:
      "Vivencie os experimentos de Asch (conformidade) e Milgram (obediência) e descubra o poder da influência social.",
    tags: ["Asch", "Milgram", "Conformidade", "Obediência"],
    available: true,
  },
  {
    href: "/psicolab/desenvolvimento",
    icon: Baby,
    color: "lime",
    title: "Desenvolvimento Humano",
    subtitle: "Da Infância à Vida Adulta",
    description:
      "Explore as teorias de Piaget e Erikson em uma linha do tempo interativa e veja como o ambiente molda o desenvolvimento.",
    tags: ["Piaget", "Erikson", "Linha do Tempo", "Estágios"],
    available: true,
  },
  {
    href: "/psicolab/aprendizagem",
    icon: GraduationCap,
    color: "sky",
    title: "Lab de Aprendizagem",
    subtitle: "Pavlov, Skinner e Além",
    description:
      "Simule o condicionamento clássico de Pavlov, generalização de estímulos e aprendizagem observacional de Bandura.",
    tags: ["Pavlov", "Condicionamento Clássico", "Bandura", "Bobo Doll"],
    available: true,
  },
  {
    href: "/psicolab/linguagem",
    icon: Languages,
    color: "yellow",
    title: "Linguagem e Pensamento",
    subtitle: "Como palavras moldam a mente",
    description:
      "Investigue a hipótese de Sapir-Whorf, framing persuasivo, linguagem neutra e a relação entre fala interna e cognição.",
    tags: ["Sapir-Whorf", "Framing", "Linguagem Neutra", "Vygotsky"],
    available: true,
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
  amber: {
    card: "border-amber-200 hover:border-amber-400 dark:border-amber-800 dark:hover:border-amber-600",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    tag: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    badge: "bg-amber-600",
  },
  cyan: {
    card: "border-cyan-200 hover:border-cyan-400 dark:border-cyan-800 dark:hover:border-cyan-600",
    icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",
    tag: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    badge: "bg-cyan-600",
  },
  teal: {
    card: "border-teal-200 hover:border-teal-400 dark:border-teal-800 dark:hover:border-teal-600",
    icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
    tag: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    badge: "bg-teal-600",
  },
  indigo: {
    card: "border-indigo-200 hover:border-indigo-400 dark:border-indigo-800 dark:hover:border-indigo-600",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    tag: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    badge: "bg-indigo-600",
  },
  lime: {
    card: "border-lime-200 hover:border-lime-400 dark:border-lime-800 dark:hover:border-lime-600",
    icon: "bg-lime-100 text-lime-600 dark:bg-lime-900/40 dark:text-lime-400",
    tag: "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    badge: "bg-lime-600",
  },
  sky: {
    card: "border-sky-200 hover:border-sky-400 dark:border-sky-800 dark:hover:border-sky-600",
    icon: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",
    tag: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    badge: "bg-sky-600",
  },
  yellow: {
    card: "border-yellow-200 hover:border-yellow-400 dark:border-yellow-800 dark:hover:border-yellow-600",
    icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",
    tag: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    badge: "bg-yellow-600",
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
          Experimente a Psicologia — não só estude. 11 simulações interativas cobrindo
          neurociência, cognição, clínica, comportamento social e muito mais.
        </p>
      </div>

      {/* Lab cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {labs.map((lab) => {
          const colors = colorMap[lab.color];
          const Icon = lab.icon;
          const card = (
            <div
              className={cn(
                "group relative rounded-2xl border-2 bg-white p-6 transition-all duration-200 dark:bg-gray-900",
                colors.card,
                lab.available ? "cursor-pointer hover:shadow-lg" : "opacity-60 cursor-not-allowed"
              )}
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
