/**
 * Algoritmo SM-2 para repetição espaçada (estilo Anki).
 *
 * Referência: Piotr Woźniak, "Optimization of Learning" (1990)
 *
 * Para respostas binárias usamos:
 *   correto   → qualidade 4 (bom)
 *   incorreto → qualidade 1 (errado, mas lembrado)
 */

export interface SM2State {
  interval: number;      // dias até a próxima revisão
  repetitions: number;   // número de respostas corretas consecutivas
  easeFactor: number;    // fator de facilidade (mín 1.3, padrão 2.5)
}

/** Qualidade mínima para considerar como "passou" */
const PASSING_QUALITY = 3;
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Calcula o próximo estado SM-2 com base na resposta.
 *
 * @param current  Estado atual (ou null se for a primeira revisão)
 * @param isCorrect  Se a resposta foi correta
 * @returns Novo estado SM-2
 */
export function nextSM2State(
  current: SM2State | null,
  isCorrect: boolean,
): SM2State {
  const state: SM2State = current ?? {
    interval: 0,
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
  };

  // Qualidade: 4 = correto, 1 = incorreto (escala 0-5)
  const quality = isCorrect ? 4 : 1;

  let { interval, repetitions, easeFactor } = state;

  if (quality >= PASSING_QUALITY) {
    // Correto: avança na sequência
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorreto: reinicia sequência mas mantém easeFactor degradado
    interval = 1;
    repetitions = 0;
  }

  // Atualiza easeFactor (pode ser degradado por erros)
  const newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  return { interval, repetitions, easeFactor };
}

/**
 * Calcula a data da próxima revisão com base no intervalo em dias.
 */
export function nextReviewDate(intervalDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d;
}
