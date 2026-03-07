// ─────────────────────────────────────────────────────────────────────────────
// FSRS Public API
// Import everything you need from here — never import from internals directly.
// ─────────────────────────────────────────────────────────────────────────────

export { createNewCard, schedule } from "./fsrs";
export { CardState, Rating } from "./types";
export { DEFAULT_DESIRED_RETENTION } from "./constants";

export type { CardSchedule, FSRSConfig, ScheduleResult } from "./types";