"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Brain, FlaskConical, BookOpen, Activity, Zap, Users, Sparkles,
  Baby, GraduationCap, Languages, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const labs = [
  {
    href: "/psicolab/neurolab",
    icon: Brain,
    emoji: "🧠",
    color: "from-blue-400 to-blue-600",
    glow: "shadow-blue-500/30",
    badge: "bg-blue-500",
    title: "NeuroLab",
    subtitle: "Cérebro & Neurônios",
    description:
      "Explore o cérebro humano interativamente. Clique nas regiões para descobrir funções, comportamentos e conexões neurais.",
    tags: ["Lobo Frontal", "Amígdala", "Hipocampo"],
    available: true,
  },
  {
    href: "/psicolab/condicionamento",
    icon: FlaskConical,
    emoji: "🐀",
    color: "from-emerald-400 to-emerald-600",
    glow: "shadow-emerald-500/30",
    badge: "bg-emerald-500",
    title: "Lab de Condicionamento",
    subtitle: "Caixa de Skinner",
    description:
      "Simule a Caixa de Skinner! Aplique reforços e punições a um rato virtual e observe como o comportamento muda em tempo real.",
    tags: ["Reforço Positivo", "Extinção"],
    available: true,
  },
  {
    href: "/psicolab/exercicios",
    icon: BookOpen,
    emoji: "📝",
    color: "from-fuchsia-400 to-fuchsia-600",
    glow: "shadow-fuchsia-500/30",
    badge: "bg-fuchsia-500",
    title: "Desafios de Exercícios",
    subtitle: "Validação + Psiquê",
    description:
      "Resolva exercícios aprovados da Área Docente e ganhe Psiquê apenas quando sua resposta for validada.",
    tags: ["Aprovados", "Validação", "Recompensas"],
    available: true,
  },
  {
    href: "/psicolab/abordagens",
    icon: BookOpen,
    emoji: "📚",
    color: "from-violet-400 to-violet-600",
    glow: "shadow-violet-500/30",
    badge: "bg-violet-500",
    title: "Lab de Abordagens",
    subtitle: "Teorias Psicológicas",
    description:
      "Explore as principais abordagens da Psicologia: Behaviorismo, Psicanálise, Humanismo e Cognitivismo com casos interativos.",
    tags: ["Behaviorismo", "Psicanálise", "Humanismo"],
    available: true,
  },
  {
    href: "/psicolab/anatomia",
    icon: Activity,
    emoji: "⚡",
    color: "from-rose-400 to-rose-600",
    glow: "shadow-rose-500/30",
    badge: "bg-rose-500",
    title: "Anatomofisiologia",
    subtitle: "Sistema Nervoso",
    description:
      "Do neurônio à sinapse: explore o sistema nervoso completo com interações em múltiplos níveis de zoom e detalhes.",
    tags: ["Neurônio", "Sinapse", "SNC"],
    available: true,
  },
  {
    href: "/psicolab/cognitivo",
    icon: Sparkles,
    emoji: "💡",
    color: "from-amber-400 to-amber-600",
    glow: "shadow-amber-500/30",
    badge: "bg-amber-500",
    title: "Processos Cognitivos",
    subtitle: "Mente em Ação",
    description:
      "Teste sua memória com a curva de Ebbinghaus, experiencie o Efeito Stroop e descubra seus vieses cognitivos.",
    tags: ["Memória", "Stroop", "Vieses"],
    available: true,
  },
  {
    href: "/psicolab/neurotransmissores",
    icon: Zap,
    emoji: "🔬",
    color: "from-cyan-400 to-cyan-600",
    glow: "shadow-cyan-500/30",
    badge: "bg-cyan-500",
    title: "Neurociência Experimental",
    subtitle: "Química do Comportamento",
    description:
      "Ajuste os níveis de dopamina, serotonina e cortisol e veja como a química cerebral molda motivação, humor e comportamento.",
    tags: ["Dopamina", "Serotonina", "Cortisol"],
    available: true,
  },
  {
    href: "/psicolab/clinico",
    icon: GraduationCap,
    emoji: "🔬",
    color: "from-teal-400 to-teal-600",
    glow: "shadow-teal-500/30",
    badge: "bg-teal-500",
    title: "Metodologia Científica",
    subtitle: "Pesquisa em Psicologia",
    description:
      "Desenvolva raciocínio científico: analise cenários de pesquisa, identifique hipóteses, variáveis e erros metodológicos.",
    tags: ["Hipótese", "Variáveis", "Metodologia"],
    available: true,
  },
  {
    href: "/psicolab/social",
    icon: Users,
    emoji: "👥",
    color: "from-indigo-400 to-indigo-600",
    glow: "shadow-indigo-500/30",
    badge: "bg-indigo-500",
    title: "Psicologia Social",
    subtitle: "Comportamento em Grupo",
    description:
      "Vivencie os experimentos de Asch (conformidade) e Milgram (obediência) e descubra o poder da influência social.",
    tags: ["Asch", "Milgram", "Conformidade"],
    available: true,
  },
  {
    href: "/psicolab/desenvolvimento",
    icon: Baby,
    emoji: "🌱",
    color: "from-lime-400 to-lime-600",
    glow: "shadow-lime-500/30",
    badge: "bg-lime-500",
    title: "Desenvolvimento Humano",
    subtitle: "Da Infância à Vida Adulta",
    description:
      "Explore as teorias de Piaget e Erikson em uma linha do tempo interativa e veja como o ambiente molda o desenvolvimento.",
    tags: ["Piaget", "Erikson", "Estágios"],
    available: true,
  },
  {
    href: "/psicolab/aprendizagem",
    icon: GraduationCap,
    emoji: "🎓",
    color: "from-sky-400 to-sky-600",
    glow: "shadow-sky-500/30",
    badge: "bg-sky-500",
    title: "Lab de Aprendizagem",
    subtitle: "Pavlov, Skinner e Além",
    description:
      "Simule o condicionamento clássico de Pavlov, generalização de estímulos e aprendizagem observacional de Bandura.",
    tags: ["Pavlov", "Bandura", "Bobo Doll"],
    available: true,
  },
  {
    href: "/psicolab/linguagem",
    icon: Languages,
    emoji: "💬",
    color: "from-yellow-400 to-yellow-600",
    glow: "shadow-yellow-500/30",
    badge: "bg-yellow-500",
    title: "Linguagem e Pensamento",
    subtitle: "Como palavras moldam a mente",
    description:
      "Investigue a hipótese de Sapir-Whorf, framing persuasivo, linguagem neutra e a relação entre fala interna e cognição.",
    tags: ["Sapir-Whorf", "Framing", "Vygotsky"],
    available: true,
  },
];

const FLOATING = [
  { emoji: "🧠", top: "8%",  left: "3%",  size: "text-4xl", delay: "0s",    dur: "4s"  },
  { emoji: "⚗️", top: "15%", left: "88%", size: "text-3xl", delay: "0.5s",  dur: "5s"  },
  { emoji: "🔬", top: "60%", left: "92%", size: "text-2xl", delay: "1s",    dur: "6s"  },
  { emoji: "🧬", top: "75%", left: "2%",  size: "text-3xl", delay: "1.5s",  dur: "4.5s"},
  { emoji: "💊", top: "40%", left: "95%", size: "text-xl",  delay: "2s",    dur: "7s"  },
  { emoji: "🫀", top: "88%", left: "50%", size: "text-2xl", delay: "0.8s",  dur: "5.5s"},
  { emoji: "⚡", top: "30%", left: "1%",  size: "text-xl",  delay: "1.2s",  dur: "3.5s"},
  { emoji: "✨", top: "55%", left: "5%",  size: "text-lg",  delay: "2.5s",  dur: "4s"  },
];

export default function PsicoLabPage() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 min-h-full bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Floating decorative emojis */}
      {FLOATING.map((f, i) => (
        <span
          key={i}
          className={cn(
            "absolute select-none pointer-events-none opacity-20",
            f.size,
            i % 2 === 0 ? "animate-bounce" : "animate-pulse"
          )}
          style={{
            top: f.top,
            left: f.left,
            animationDuration: f.dur,
            animationDelay: f.delay,
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-sm font-medium text-blue-100 mb-6">
          <span className="text-lg">🧪</span>
          Laboratório Virtual de Psicologia
          <span className="text-lg">✨</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white leading-tight mb-4 drop-shadow-lg">
          Psico<span className="text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.5)]">Lab</span>
          <span className="ml-3 text-4xl sm:text-5xl">🚀</span>
        </h1>


      </div>

      {/* Wave separator */}
      <div className="relative -mt-2 pointer-events-none select-none">
        <svg viewBox="0 0 1440 40" className="w-full h-8 fill-white/5">
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
        </svg>
      </div>

      {/* ── Lab Cards Grid ── */}
      <div className="relative max-w-5xl mx-auto px-4 pb-16 grid gap-4 sm:grid-cols-2">
        {labs.map((lab) => {
          const Icon = lab.icon;
          const isHovered = hovered === lab.href;

          const card = (
            <div
              onMouseEnter={() => setHovered(lab.href)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl p-5 transition-all duration-300",
                lab.available
                  ? cn("cursor-pointer hover:-translate-y-1", isHovered && `shadow-xl ${lab.glow}`)
                  : "opacity-50 cursor-not-allowed",
                "border border-white/30"
              )}
            >
              {/* Not available badge */}
              {!lab.available && (
                <span className="absolute right-4 top-4 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                  Em breve
                </span>
              )}

              {/* Icon row */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn("rounded-xl p-2.5 bg-gradient-to-br text-white shadow-md", lab.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl">{lab.emoji}</span>
              </div>

              {/* Text */}
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {lab.title}
              </h2>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {lab.subtitle}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {lab.description}
              </p>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lab.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium text-white", lab.badge)}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              {lab.available && (
                <div className={cn(
                  "mt-4 flex items-center gap-1 text-sm font-semibold transition-all",
                  isHovered ? "text-blue-600 dark:text-blue-400 translate-x-0.5" : "text-gray-400 dark:text-gray-500"
                )}>
                  Entrar no lab
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

      {/* Footer */}
      <div className="relative pb-10 text-center text-blue-300 text-sm px-4">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2">
          🧬 PsicoLab está em constante expansão — novos módulos são adicionados regularmente!
        </div>
      </div>
    </div>
  );
}
