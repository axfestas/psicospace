"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Neurotransmitter {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  min: number;
  max: number;
  unit: string;
  lowLabel: string;
  highLabel: string;
  effects: {
    low: string[];
    normal: string[];
    high: string[];
  };
  funFact: string;
}

const NEUROTRANSMITTERS: Neurotransmitter[] = [
  {
    id: "dopamina",
    name: "Dopamina",
    emoji: "⚡",
    color: "amber",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-700 dark:text-amber-300",
    min: 0,
    max: 100,
    unit: "%",
    lowLabel: "Apática",
    highLabel: "Eufórica",
    effects: {
      low: ["Falta de motivação", "Anedonia (dificuldade de sentir prazer)", "Fadiga mental", "Procrastinação intensa"],
      normal: ["Motivação equilibrada", "Capacidade de sentir recompensa", "Foco e concentração adequados", "Planejamento eficaz"],
      high: ["Euforia e hiperatividade", "Comportamentos impulsivos", "Hiperconcentração seletiva", "Risco de comportamentos compulsivos"],
    },
    funFact: "A dopamina não é liberada pelo prazer em si, mas pela ANTECIPAÇÃO do prazer — é o neurotransmissor da motivação, não da satisfação.",
  },
  {
    id: "serotonina",
    name: "Serotonina",
    emoji: "😊",
    color: "blue",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    min: 0,
    max: 100,
    unit: "%",
    lowLabel: "Deprimida",
    highLabel: "Serena",
    effects: {
      low: ["Humor deprimido", "Ansiedade elevada", "Distúrbios do sono", "Irritabilidade"],
      normal: ["Bem-estar geral", "Sono regulado", "Controle emocional", "Sensação de satisfação"],
      high: ["Calma profunda", "Pouca reatividade emocional", "Em excesso: síndrome serotoninérgica (raro)"],
    },
    funFact: "Cerca de 95% da serotonina do corpo é produzida no intestino — não no cérebro. Por isso fala-se do 'segundo cérebro'.",
  },
  {
    id: "noradrenalina",
    name: "Noradrenalina",
    emoji: "🚨",
    color: "rose",
    bgColor: "bg-rose-50 dark:bg-rose-900/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    textColor: "text-rose-700 dark:text-rose-300",
    min: 0,
    max: 100,
    unit: "%",
    lowLabel: "Lenta",
    highLabel: "Em alerta",
    effects: {
      low: ["Lentidão mental", "Dificuldade de concentração", "Hipotensão", "Fadiga"],
      normal: ["Alerta adequado", "Atenção focada", "Resposta rápida a estímulos", "Regulação do humor"],
      high: ["Hipervigilância", "Ansiedade intensa", "Resposta luta-ou-fuga excessiva", "Insônia"],
    },
    funFact: "A noradrenalina é tanto um neurotransmissor quanto um hormônio (adrenalina = epinefrina; noradrenalina = norepinefrina). Age no coração, vasos e no cérebro.",
  },
  {
    id: "cortisol",
    name: "Cortisol",
    emoji: "😰",
    color: "orange",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-700 dark:text-orange-300",
    min: 0,
    max: 100,
    unit: "%",
    lowLabel: "Exausto",
    highLabel: "Em pânico",
    effects: {
      low: ["Fadiga crônica", "Hipoglicemia", "Baixa pressão", "Fadiga adrenal (burnout extremo)"],
      normal: ["Resposta saudável ao estresse", "Regulação imune", "Metabolismo equilibrado", "Ciclo de alerta/descanso normal"],
      high: ["Ansiedade e pânico", "Dificuldade de memória (hipocampo afetado)", "Sistema imune suprimido", "Ganho de peso abdominal"],
    },
    funFact: "O cortisol tem um pico natural pela manhã (cortisol awakening response) que aumenta ~50–100% nos primeiros 30 min após acordar — é o 'cafezinho' do corpo.",
  },
];

function getLevel(value: number): "low" | "normal" | "high" {
  if (value < 35) return "low";
  if (value > 65) return "high";
  return "normal";
}

function getLevelLabel(level: "low" | "normal" | "high") {
  return level === "low" ? "Baixo" : level === "normal" ? "Normal" : "Elevado";
}

function getLevelColor(level: "low" | "normal" | "high") {
  return level === "low"
    ? "text-rose-600 dark:text-rose-400"
    : level === "normal"
    ? "text-green-600 dark:text-green-400"
    : "text-amber-600 dark:text-amber-400";
}

const colorClasses: Record<string, { bar: string; thumb: string }> = {
  amber: { bar: "bg-amber-400", thumb: "accent-amber-500" },
  blue:  { bar: "bg-blue-400",  thumb: "accent-blue-500"  },
  rose:  { bar: "bg-rose-400",  thumb: "accent-rose-500"  },
  orange:{ bar: "bg-orange-400",thumb: "accent-orange-500"},
};

type ProfileResult = {
  mood: string;
  energy: string;
  focus: string;
  stress: string;
  overall: string;
  emoji: string;
};

function computeProfile(
  dopamina: number,
  serotonina: number,
  noradrenalina: number,
  cortisol: number
): ProfileResult {
  const energy = dopamina > 65 ? "Alta energia" : dopamina < 35 ? "Baixa energia" : "Energia equilibrada";
  const mood = serotonina > 65 ? "Humor sereno" : serotonina < 35 ? "Humor rebaixado" : "Humor estável";
  const focus = noradrenalina > 65 ? "Hipervigilante" : noradrenalina < 35 ? "Disperso" : "Foco adequado";
  const stress = cortisol > 65 ? "Estresse elevado" : cortisol < 35 ? "Exaustão" : "Estresse controlado";

  const highCortisol = cortisol > 65;
  const lowSerotonin = serotonina < 35;
  const highDopamine = dopamina > 65;

  let overall: string;
  let emoji: string;

  if (highCortisol && lowSerotonin) {
    overall = "Burnout/Ansiedade — O corpo está em estado de alarme prolongado. Sinais de esgotamento são comuns.";
    emoji = "😰";
  } else if (highDopamine && highCortisol) {
    overall = "Agitação produtiva — Alta motivação mas também alta pressão. Sustentável no curto prazo, arriscado cronicamente.";
    emoji = "⚡";
  } else if (serotonina > 55 && dopamina > 45 && cortisol < 55) {
    overall = "Equilíbrio funcional — Boa combinação para bem-estar, produtividade e saúde mental.";
    emoji = "✨";
  } else if (lowSerotonin && dopamina < 35) {
    overall = "Depressão — Baixa motivação e humor rebaixado. Procure apoio profissional se persistir.";
    emoji = "😔";
  } else {
    overall = "Perfil misto — O organismo está em transição ou adaptação. Atenção a padrões recorrentes.";
    emoji = "🔄";
  }

  return { mood, energy, focus, stress, overall, emoji };
}

export default function NeurotransmissoresPage() {
  const [values, setValues] = useState<Record<string, number>>({
    dopamina: 50,
    serotonina: 50,
    noradrenalina: 50,
    cortisol: 50,
  });
  const [showProfile, setShowProfile] = useState(false);

  const handleChange = (id: string, val: number) => {
    setValues((v) => ({ ...v, [id]: val }));
    setShowProfile(false);
  };

  const profile = computeProfile(
    values.dopamina,
    values.serotonina,
    values.noradrenalina,
    values.cortisol
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Neurociência Experimental</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Química do Comportamento — Ajuste os neurotransmissores</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-800 dark:bg-cyan-900/20">
        <p className="text-sm text-cyan-700 dark:text-cyan-300">
          🧪 Ajuste os controles abaixo para simular diferentes estados neuroquímicos e ver como eles afetam motivação, humor, atenção e estresse. Este é um modelo <strong>simplificado</strong> para fins educativos.
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {NEUROTRANSMITTERS.map((nt) => {
          const val = values[nt.id];
          const level = getLevel(val);
          const cc = colorClasses[nt.color];

          return (
            <div key={nt.id} className={`rounded-2xl border-2 p-5 ${nt.bgColor} ${nt.borderColor}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{nt.emoji}</span>
                  <div>
                    <h3 className={`font-bold ${nt.textColor}`}>{nt.name}</h3>
                    <span className={`text-xs font-semibold ${getLevelColor(level)}`}>
                      {getLevelLabel(level)}
                    </span>
                  </div>
                </div>
                <span className={`text-2xl font-black ${nt.textColor}`}>{val}%</span>
              </div>

              {/* Slider */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{nt.lowLabel}</span>
                  <span>{nt.highLabel}</span>
                </div>
                <input
                  type="range"
                  min={nt.min}
                  max={nt.max}
                  value={val}
                  onChange={(e) => handleChange(nt.id, Number(e.target.value))}
                  className={`w-full h-2 rounded-full appearance-none cursor-pointer ${cc.thumb}`}
                  style={{
                    background: `linear-gradient(to right, currentColor ${val}%, #e5e7eb ${val}%)`,
                  }}
                />
              </div>

              {/* Effects */}
              <div className="mt-3 rounded-xl bg-white/70 p-3 dark:bg-gray-900/40">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Efeitos atuais ({getLevelLabel(level)})</p>
                <ul className="space-y-0.5">
                  {nt.effects[level].map((e) => (
                    <li key={e} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 text-gray-400">•</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fun fact */}
              <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
                💡 {nt.funFact}
              </p>
            </div>
          );
        })}
      </div>

      {/* Generate profile */}
      <div className="text-center">
        <button
          onClick={() => setShowProfile(true)}
          className="rounded-xl bg-cyan-600 px-8 py-3 font-semibold text-white hover:bg-cyan-700 transition-colors"
        >
          Gerar Perfil Neuroquímico
        </button>
      </div>

      {showProfile && (
        <div className="rounded-2xl border-2 border-cyan-300 bg-cyan-50 p-6 dark:border-cyan-700 dark:bg-cyan-900/20">
          <div className="text-center mb-4">
            <span className="text-4xl">{profile.emoji}</span>
            <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{profile.overall}</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["⚡ Energia", profile.energy],
              ["😊 Humor", profile.mood],
              ["🎯 Foco", profile.focus],
              ["😰 Estresse", profile.stress],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-3 dark:bg-gray-900">
                <span className="text-xs font-semibold text-gray-500">{label}</span>
                <p className="font-medium text-gray-800 dark:text-gray-200">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            ⚠️ Este é um modelo educativo simplificado. Na realidade, centenas de neurotransmissores interagem de forma complexa.
          </p>
        </div>
      )}
    </div>
  );
}
