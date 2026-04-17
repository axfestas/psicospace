export const XP_PER_LEVEL = 100;

// ─── Psiquê rewards ──────────────────────────────────────────────────────────

// Exercícios
export const REWARD_EXERCISE_CORRECT = 15;       // responder corretamente
export const REWARD_EXERCISE_ACCURACY_BONUS = 10; // bônus: taxa de acerto ≥ 80 % na sessão

// Sessão de estudo
export const REWARD_SESSION_COMPLETED = 10;      // concluir sessão
export const REWARD_SESSION_LONG_BONUS = 5;      // bônus: sessão ≥ 25 min (1 500 s)
export const REWARD_MICROTASK_DONE = 5;

// Sequência diária (streak)
export const REWARD_DAILY_STREAK = 5;            // +5 por dia de sequência
export const REWARD_STREAK_MILESTONE = 20;       // +20 a cada 5 dias consecutivos

// Leitura (métrica: páginas lidas)
export const REWARD_READING_PAGE_BATCH = 5;      // +5 a cada 5 páginas lidas
export const REWARD_READING_COMPLETED = 15;      // +15 ao finalizar leitura

// Missões semanais
export const REWARD_WEEKLY_MISSION_MIN = 50;     // mínimo por missão semanal
export const REWARD_WEEKLY_MISSION_MAX = 100;    // máximo por missão semanal

// ─── XP earned per action ────────────────────────────────────────────────────
export const XP_EXERCISE_CORRECT = 20;
export const XP_SESSION_COMPLETED = 30;
export const XP_MICROTASK_DONE = 10;

// ─── Thresholds ──────────────────────────────────────────────────────────────
export const STREAK_MILESTONE_INTERVAL = 5;          // dias para acionar bônus de streak
export const SESSION_LONG_THRESHOLD_SECONDS = 1500;  // 25 min
export const READING_BATCH_PAGES = 5;                // páginas por lote de recompensa
