"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: number;
  topic: string;
  difficulty: "Fácil" | "Média" | "Difícil";
  text: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    topic: "Hipótese",
    difficulty: "Fácil",
    text: "Uma equipe quer investigar se pausas curtas durante uma tarefa longa de atenção reduzem erros. Eles propõem: 'Participantes que fazem uma pausa de 5 minutos a cada 25 minutos cometerão menos erros do que participantes sem pausas'.\n\nQual alternativa expressa corretamente a hipótese de pesquisa?",
    options: [
      "Participantes com pausas podem achar a tarefa mais interessante.",
      "Pausas de 5 minutos a cada 25 minutos reduzem o número de erros em comparação com ausência de pausas.",
      "A tarefa de atenção é difícil para estudantes de graduação.",
      "O laboratório precisa de mais participantes para concluir o estudo.",
    ],
    correct: 1,
    explanation:
      "A hipótese deve ser uma previsão clara e testável sobre a relação entre variáveis. A alternativa B prevê diretamente o efeito da condição experimental (pausas) no resultado (erros), cumprindo esse requisito. As outras alternativas são observações vagas ou questões operacionais sem valor preditivo.",
  },
  {
    id: 2,
    topic: "Variáveis",
    difficulty: "Fácil",
    text: "Em um estudo, pesquisadoras comparam dois formatos de questionário online sobre hábitos de estudo: versão curta (10 itens) e versão longa (30 itens). Depois, medem o tempo que cada participante leva para concluir o questionário.\n\nQual é a variável dependente?",
    options: [
      "Formato do questionário (curto ou longo)",
      "Plataforma usada para aplicar o questionário",
      "Tempo para concluir o questionário",
      "Número total de participantes",
    ],
    correct: 2,
    explanation:
      "A variável dependente é o resultado que se mede, ou seja, o que se espera ser afetado pela manipulação. Aqui, o que é medido é o tempo de conclusão. O formato do questionário (curto ou longo) é a variável independente — o fator manipulado pelas pesquisadoras.",
  },
  {
    id: 3,
    topic: "Análise de resultado",
    difficulty: "Média",
    text: "Um estudo observou a participação em fóruns de discussão de uma disciplina. O Grupo 1 recebeu lembretes semanais por e-mail; o Grupo 2 não recebeu. Ao final de 4 semanas, o Grupo 1 teve média de 18 postagens por aluno e o Grupo 2, média de 11.\n\nQual interpretação é a mais adequada?",
    options: [
      "Os lembretes causam, com certeza absoluta, maior participação em qualquer contexto.",
      "Os lembretes estão associados a maior participação nesse estudo, mas o resultado deve ser interpretado no contexto do desenho e da amostra.",
      "O Grupo 2 participou menos porque não se interessava pela disciplina.",
      "O estudo prova que e-mails são o melhor método para todos os cursos.",
    ],
    correct: 1,
    explanation:
      "A interpretação correta reconhece o achado sem generalizações exageradas. O estudo sugere uma associação relevante naquele contexto, mas conclusões universais exigem replicações e amostras mais diversas. Afirmar 'certeza absoluta' ou que o resultado se aplica a 'todos os cursos' extrapola o que os dados permitem concluir.",
  },
  {
    id: 4,
    topic: "Erro metodológico",
    difficulty: "Média",
    text: "Uma pesquisadora quer comparar o engajamento em aula entre turmas com e sem atividade interativa. Ela escolhe para o grupo 'com atividade' a turma da manhã e, para o grupo 'sem atividade', a turma da noite, sem qualquer sorteio.\n\nQual é o principal erro metodológico nesse desenho?",
    options: [
      "O número de aulas observado foi baixo.",
      "A falta de randomização aumenta o risco de viés entre os grupos.",
      "Usar atividade interativa em ambiente educacional é inadequado.",
      "Medir engajamento por observação em sala não é confiável.",
    ],
    correct: 1,
    explanation:
      "Sem randomização, os grupos podem diferir em características importantes que não foram controladas — como rotina, cansaço, perfil dos estudantes e motivação — simplesmente por pertencerem a períodos diferentes do dia. Isso cria um viés de seleção que compromete a validade interna do estudo.",
  },
  {
    id: 5,
    topic: "Validade e confiabilidade",
    difficulty: "Média",
    text: "Um grupo criou um questionário de 8 itens sobre hábitos de organização acadêmica. Ao aplicar o instrumento em dois momentos com os mesmos participantes, com intervalo de 7 dias, os resultados foram muito parecidos.\n\nEsse achado indica principalmente:",
    options: [
      "Alta validade de conteúdo.",
      "Alta confiabilidade teste-reteste.",
      "Alta validade externa.",
      "Ausência total de viés de resposta.",
    ],
    correct: 1,
    explanation:
      "Quando os resultados se mantêm estáveis em aplicações repetidas (com curto intervalo de tempo), o foco é a confiabilidade — especificamente a confiabilidade teste-reteste. Isso indica consistência das medidas ao longo do tempo, mas não garante, por si só, validade de conteúdo, validade externa ou ausência de viés.",
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Fácil: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Média: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Difícil: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function MetodologiaPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const question = QUESTIONS[currentIndex];
  const isCorrect = selected === question.correct;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === question.correct) setScore((s) => s + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 < QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelected(null);
    setShowExplanation(false);
    setScore(0);
    setDone(false);
  };

  const progress = ((currentIndex + (done ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/psicolab" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Lab de Metodologia Científica
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pesquisa em Psicologia — Desenvolva raciocínio científico
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Questão {Math.min(currentIndex + 1, QUESTIONS.length)} de {QUESTIONS.length}</span>
          <span>{score} acerto{score !== 1 ? "s" : ""}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!done ? (
        <div className="space-y-4">
          {/* Question card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                {question.topic}
              </span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${DIFFICULTY_COLOR[question.difficulty]}`}>
                {question.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
              {question.text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((opt, idx) => {
              const letter = ["A", "B", "C", "D"][idx];
              const isSelected = selected === idx;
              const isRight = idx === question.correct;

              let cls =
                "w-full rounded-xl border-2 p-3 text-left text-sm transition-all flex items-start gap-3 ";

              if (selected === null) {
                cls += "border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-teal-500 dark:hover:bg-teal-900/20 cursor-pointer";
              } else if (isRight) {
                cls += "border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20";
              } else if (isSelected) {
                cls += "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-900/20";
              } else {
                cls += "border-gray-200 bg-white opacity-50 dark:border-gray-700 dark:bg-gray-900";
              }

              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  disabled={selected !== null}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      selected !== null && isRight
                        ? "bg-emerald-500 text-white"
                        : selected !== null && isSelected
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                  {selected !== null && isRight && (
                    <CheckCircle className="ml-auto flex-shrink-0 h-4 w-4 text-emerald-500" />
                  )}
                  {selected !== null && isSelected && !isRight && (
                    <XCircle className="ml-auto flex-shrink-0 h-4 w-4 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isCorrect
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {isCorrect ? "✅ Correto!" : "❌ Resposta incorreta"}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{question.explanation}</p>
              <button
                onClick={handleNext}
                className="mt-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                {currentIndex + 1 < QUESTIONS.length ? "Próxima questão →" : "Ver resultado →"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results screen */
        <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 text-center dark:border-teal-800 dark:bg-teal-900/20 space-y-4">
          <div className="text-4xl">
            {score === QUESTIONS.length ? "🏆" : score >= 3 ? "🎉" : "📚"}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Você acertou {score} de {QUESTIONS.length} questões
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {score === QUESTIONS.length
              ? "Excelente! Você dominou os conceitos de metodologia científica."
              : score >= 3
              ? "Bom resultado! Revise as questões que errou para consolidar o aprendizado."
              : "Continue praticando! A metodologia científica se aprende com repetição e análise."}
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-400 px-5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900/40 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
