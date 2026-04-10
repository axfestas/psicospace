"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, RotateCcw } from "lucide-react";

type ApproachId = "psicanalise" | "humanismo" | "tcc";

interface Approach {
  id: ApproachId;
  name: string;
  founder: string;
  emoji: string;
  color: string;
  tagline: string;
  focus: string;
  technique: string;
  goal: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  presenting: string;
  emoji: string;
  context: string;
}

interface DialogueLine {
  role: "patient" | "therapist";
  text: string;
}

interface ScriptEntry {
  patientStatement: string;
  responses: Record<ApproachId, string>;
}

const APPROACHES: Approach[] = [
  {
    id: "psicanalise",
    name: "Psicanálise",
    founder: "Sigmund Freud",
    emoji: "🛋️",
    color: "violet",
    tagline: "O que está no inconsciente molda o que está no consciente.",
    focus: "Inconsciente, conflitos reprimidos, infância",
    technique: "Associação livre, interpretação de sonhos, transferência",
    goal: "Trazer conteúdos inconscientes à consciência e resolver conflitos internos.",
  },
  {
    id: "humanismo",
    name: "Humanismo / ACP",
    founder: "Carl Rogers",
    emoji: "🌱",
    color: "emerald",
    tagline: "A pessoa tem em si os recursos para crescer.",
    focus: "Autorrealização, experiência subjetiva, self",
    technique: "Escuta empática, congruência, aceitação incondicional",
    goal: "Criar condições de crescimento para que o cliente encontre suas próprias respostas.",
  },
  {
    id: "tcc",
    name: "Terapia Cognitivo-Comportamental",
    founder: "Aaron Beck",
    emoji: "🧩",
    color: "blue",
    tagline: "Pensamentos moldam emoções e comportamentos.",
    focus: "Pensamentos automáticos, crenças nucleares, comportamento",
    technique: "Registro de pensamentos, reestruturação cognitiva, exposição",
    goal: "Identificar e modificar padrões de pensamento disfuncionais.",
  },
];

const PATIENTS: Patient[] = [
  {
    id: "ana",
    name: "Ana",
    age: 28,
    presenting: "Ansiedade social — Evita reuniões de trabalho com medo de julgamento.",
    emoji: "😰",
    context: "Ana foi promovida recentemente mas sente que não merece o cargo (síndrome do impostor). Evita falar em reuniões por medo de 'dizer algo idiota'.",
  },
  {
    id: "marcos",
    name: "Marcos",
    age: 35,
    presenting: "Procrastinação crônica e baixa autoestima.",
    emoji: "😔",
    context: "Marcos foi criado por um pai muito crítico. Tende a começar projetos mas abandoná-los antes de terminar, pois teme não ser 'suficientemente bom'.",
  },
  {
    id: "lucia",
    name: "Lúcia",
    age: 42,
    presenting: "Dificuldade em estabelecer limites nos relacionamentos.",
    emoji: "🌊",
    context: "Lúcia sempre coloca os outros antes de si mesma. Frequentemente se sente esgotada e ressentida, mas tem dificuldade de dizer 'não'.",
  },
  {
    id: "roberto",
    name: "Roberto",
    age: 22,
    presenting: "Ataques de pânico frequentes e medo de enlouquecer.",
    emoji: "😨",
    context: "Roberto começou a ter ataques de pânico aos 21 anos. Agora evita sair de casa sozinho por medo de ter um ataque em público. Interpreta sensações físicas normais (coração acelerado) como sinal de perigo.",
  },
];

const SCRIPTS: Record<string, ScriptEntry[]> = {
  ana: [
    {
      patientStatement: "Eu simplesmente não consigo falar nas reuniões. Fico com a mente em branco e tenho medo que todos percebam que não sei o que estou fazendo.",
      responses: {
        psicanalise: "É interessante que você menciona 'não saber o que está fazendo'. Quando você era criança, havia situações em que sentia que estava sendo observada e julgada? Quero entender de onde vem esse medo de ser 'descoberta'.",
        humanismo: "Você está descrevendo uma experiência muito angustiante — estar em um lugar que você conquistou, mas sentir que qualquer momento isso pode desabar. Parece que há uma parte de você que duvida de seu próprio valor. O que você sente quando está fora dessas reuniões?",
        tcc: "Vamos olhar de perto esse pensamento: 'todos percebem que não sei o que estou fazendo'. Numa escala de 0 a 100, o quanto você acredita nisso agora? E quais evidências reais você tem de que isso é verdade — e quais evidências contradizem?",
      },
    },
    {
      patientStatement: "Minha chefe me elogiou na semana passada, mas acho que ela só está sendo educada. No fundo, ela deve achar que foi um erro me promover.",
      responses: {
        psicanalise: "Você transforma o elogio em algo sem valor — isso me parece uma defesa psíquica. Que sentimento surgiu quando sua chefe te elogiou? Será que aceitar esse elogio traria consigo algo que você prefere não sentir?",
        humanismo: "É doloroso não conseguir receber algo bom quando ele acontece. Parece que sua autoimagem está tão comprometida que o elogio não consegue entrar. O que você precisaria sentir sobre si mesma para deixar esse reconhecimento ser real?",
        tcc: "Isso se chama 'desqualificação do positivo' — um pensamento automático muito comum. Você está interpretando o elogio como educação, não como feedback real. Vamos testar isso: o que seria necessário acontecer para que você acreditasse que o elogio foi genuíno?",
      },
    },
  ],
  marcos: [
    {
      patientStatement: "Tenho um projeto importante para entregar, mas já faz três semanas que não começo. Toda vez que abro o computador, fico vendo vídeos em vez de trabalhar.",
      responses: {
        psicanalise: "A procrastinação frequentemente tem uma função protetora. Se você não começa, não termina — e se não termina, não pode ser julgado. Isso ressoa com algo em você? Há alguma voz interna que diz o que aconteceria se você terminasse esse projeto e ele fosse criticado?",
        humanismo: "Parece que há um conflito entre o que você quer fazer e o que está conseguindo fazer. Não é preguiça — geralmente há algo mais profundo por baixo disso. O que você sente quando pensa em abrir esse projeto e realmente começar?",
        tcc: "A procrastinação aqui pode estar ligada a uma crença núcleo como 'Se eu tentar de verdade e falhar, provo que sou incompetente.' Vamos fazer um experimento: e se você se comprometesse a trabalhar apenas 10 minutos no projeto hoje — sem pressão de terminar? O que aconteceria?",
      },
    },
  ],
  lucia: [
    {
      patientStatement: "Minha amiga me pediu para ficar com os filhos dela no fim de semana, e eu disse sim mesmo estando exausta. Simplesmente não consigo dizer não.",
      responses: {
        psicanalise: "É como se dizer 'não' fosse perigoso. Quero entender o que 'não' representa para você internamente. O que você imagina que aconteceria — no outro, em você — se você dissesse não? Que imagem ou memória surge quando pensa nisso?",
        humanismo: "Você está me dizendo algo muito importante sobre si mesma: que suas próprias necessidades ficam constantemente em segundo plano. Parece que dizer 'sim' é uma forma de você se sentir valiosa ou segura nas relações. O que você acha que perderia se começasse a colocar seus limites?",
        tcc: "Parece que há uma crença por baixo disso: talvez 'Se eu disser não, serei rejeitada' ou 'Pessoas boas não recusam ajuda.' Essas crenças nos ajudam a ver por que o comportamento faz sentido — mesmo que custe caro. Vamos examinar: qual foi o custo real, hoje, de ter dito sim?",
      },
    },
  ],
  roberto: [
    {
      patientStatement: "Na semana passada fui ao mercado e meu coração começou a bater forte. Achei que ia morrer. Tive que sair correndo.",
      responses: {
        psicanalise: "Esse medo de 'morrer' num espaço público tem me interessado. Há algo nesse ambiente — o mercado, a multidão — que ressoa com algo mais antigo? Com frequência, o pânico é o retorno de algo que foi reprimido. O que vem à mente quando pensa em estar sozinho num lugar cheio de pessoas?",
        humanismo: "Que experiência assustadora deve ter sido essa. Seu corpo sinalizou perigo intenso e você respondeu buscando segurança. Quero entender melhor: o que você sentiu além do coração acelerado? E o que aconteceu depois que saiu — você se sentiu aliviado, envergonhado, assustado?",
        tcc: "Ataques de pânico envolvem uma interpretação catastrófica de sensações físicas normais. Você interpretou o coração acelerado como 'vou morrer' — o que é um pensamento automático clássico. Vamos examinar a evidência: coração acelerado por ansiedade já causou algum dano físico real antes?",
      },
    },
    {
      patientStatement: "Agora tenho medo de sair sozinho. E se acontecer de novo e eu não conseguir ajuda?",
      responses: {
        psicanalise: "A evitação é uma solução que cria outro problema — ela confirma para sua mente que o mundo externo é perigoso. Isso me lembra a questão da dependência: de quem você precisava quando era criança e sentia medo? Que figura cuidava de você?",
        humanismo: "Faz todo sentido que você queira se proteger — seu organismo está tentando te manter seguro. Mas percebo que essa proteção está te custando muito, está limitando sua vida. O que você perdeu desde que começou a evitar sair?",
        tcc: "Essa é a 'evitação' — ela alivia a ansiedade no curto prazo mas a mantém (e aumenta) no longo prazo. Cada vez que você evita, sua mente aprende: 'o perigo era real'. A exposição gradual — começar com saídas curtas acompanhado — é a abordagem mais eficaz. O que seria um primeiro passo pequeno, mas possível?",
      },
    },
  ],
};

const colorMap: Record<string, { border: string; bg: string; text: string; btn: string; active: string }> = {
  violet:  { border: "border-violet-200 dark:border-violet-800", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-300", btn: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300", active: "bg-violet-600 text-white" },
  emerald: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", btn: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300", active: "bg-emerald-600 text-white" },
  blue:    { border: "border-blue-200 dark:border-blue-800", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", btn: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300", active: "bg-blue-600 text-white" },
};

export default function ClinicoPage() {
  const [selectedApproach, setSelectedApproach] = useState<ApproachId | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [revealResponse, setRevealResponse] = useState(false);

  const currentApproach = APPROACHES.find((a) => a.id === selectedApproach);
  const currentScript = selectedPatient ? SCRIPTS[selectedPatient.id] ?? [] : [];
  const currentEntry = currentScript[scriptIndex];

  const startSession = () => {
    if (!selectedPatient || !selectedApproach) return;
    setDialogue([{ role: "patient", text: currentScript[0].patientStatement }]);
    setScriptIndex(0);
    setRevealResponse(false);
    setSessionStarted(true);
  };

  const handleReveal = () => setRevealResponse(true);

  const handleNext = () => {
    if (!selectedApproach || !currentEntry) return;
    const therapistReply = currentEntry.responses[selectedApproach];
    const newDialogue: DialogueLine[] = [
      ...dialogue,
      { role: "therapist", text: therapistReply },
    ];
    const nextIndex = scriptIndex + 1;
    if (nextIndex < currentScript.length) {
      newDialogue.push({ role: "patient", text: currentScript[nextIndex].patientStatement });
      setScriptIndex(nextIndex);
      setRevealResponse(false);
    } else {
      newDialogue.push({ role: "patient", text: "..." });
      setScriptIndex(nextIndex);
    }
    setDialogue(newDialogue);
  };

  const reset = () => {
    setSessionStarted(false);
    setDialogue([]);
    setScriptIndex(0);
    setRevealResponse(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Simulador Clínico</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Prática Terapêutica — Escolha uma abordagem e conduza uma sessão</p>
        </div>
      </div>

      {!sessionStarted && (
        <>
          {/* Approach selection */}
          <div>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">1. Escolha sua abordagem terapêutica</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {APPROACHES.map((a) => {
                const cc = colorMap[a.color];
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedApproach(a.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selectedApproach === a.id
                        ? `${cc.border} ${cc.bg}`
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                    }`}
                  >
                    <div className="text-3xl mb-2">{a.emoji}</div>
                    <h3 className={`font-bold ${selectedApproach === a.id ? cc.text : "text-gray-900 dark:text-gray-100"}`}>{a.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.founder}</p>
                    <p className="mt-2 text-xs italic text-gray-600 dark:text-gray-400">&ldquo;{a.tagline}&rdquo;</p>
                    {selectedApproach === a.id && (
                      <div className="mt-3 space-y-1 border-t pt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Foco:</strong> {a.focus}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Técnicas:</strong> {a.technique}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient selection */}
          <div>
            <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">2. Escolha o paciente virtual</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {PATIENTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    selectedPatient?.id === p.id
                      ? "border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <div className="text-3xl mb-2">{p.emoji}</div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{p.name}, {p.age} anos</h3>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{p.presenting}</p>
                  {selectedPatient?.id === p.id && (
                    <p className="mt-2 text-xs italic text-teal-700 dark:text-teal-300 border-t pt-2">{p.context}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={!selectedApproach || !selectedPatient}
            className="w-full rounded-xl bg-teal-600 py-3 font-semibold text-white transition-all hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="inline h-4 w-4 mr-2" />
            Iniciar Sessão
          </button>
        </>
      )}

      {sessionStarted && (
        <div className="space-y-4">
          {/* Session header */}
          <div className={`rounded-xl border p-3 flex items-center justify-between ${colorMap[currentApproach!.color].bg} ${colorMap[currentApproach!.color].border}`}>
            <span className={`text-sm font-semibold ${colorMap[currentApproach!.color].text}`}>
              {currentApproach!.emoji} {currentApproach!.name} — Paciente: {selectedPatient!.name}
            </span>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Dialogue */}
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900 max-h-[400px] overflow-y-auto">
            {dialogue.map((line, i) => (
              <div key={i} className={`flex ${line.role === "therapist" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    line.role === "therapist"
                      ? `${colorMap[currentApproach!.color].active} rounded-br-sm`
                      : "bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 rounded-bl-sm"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {line.role === "therapist" ? `Você (${currentApproach!.name})` : selectedPatient!.name}
                  </p>
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          {/* Action area */}
          {currentEntry && scriptIndex < currentScript.length && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              {!revealResponse ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Como você, como terapeuta {currentApproach!.name}, responderia a essa fala?
                  </p>
                  <button
                    onClick={handleReveal}
                    className={`rounded-xl px-6 py-2 text-sm font-semibold ${colorMap[currentApproach!.color].btn}`}
                  >
                    Ver resposta ({currentApproach!.name})
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500">Resposta sugerida — {currentApproach!.name}:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">&ldquo;{currentEntry.responses[selectedApproach!]}&rdquo;</p>
                  <button
                    onClick={handleNext}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 ${colorMap[currentApproach!.color].active}`}
                  >
                    Continuar sessão <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}

          {scriptIndex >= currentScript.length && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
              <div className="text-2xl mb-1">✅</div>
              <h3 className="font-bold text-green-800 dark:text-green-300">Sessão concluída</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Observe como a mesma fala do paciente recebe respostas muito diferentes de acordo com a abordagem.
                Experimente a mesma sessão com uma abordagem diferente!
              </p>
              <button onClick={reset} className="mt-3 rounded-xl border border-green-400 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 dark:text-green-300">
                Nova sessão
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
