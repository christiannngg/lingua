/**
 * review-session.ts
 *
 * Client-side utility for persisting review session progress across navigation
 * and page re-renders.
 
 */

export interface ReviewSession {
  cardIds: string[];
  index: number;
  date: string;
  userLanguageId: string;
}

// Helpers

/**
 * Returns the sessionStorage key for a given userLanguageId.
 */
function getSessionKey(userLanguageId: string): string {
  return `review-session:${userLanguageId}`;
}

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 */
function todayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the browser's sessionStorage API is available
 */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__storage_probe__";
    sessionStorage.setItem(probe, "1");
    sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// Public API

/**
 * Reads and validates a saved review session for the given userLanguage.
 */
export function loadSession(userLanguageId: string): ReviewSession | null {
  if (!isStorageAvailable()) return null;

  try {
    const raw = sessionStorage.getItem(getSessionKey(userLanguageId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;

    // Shape validation — guard against stale or malformed payloads
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as ReviewSession).cardIds) ||
      typeof (parsed as ReviewSession).index !== "number" ||
      typeof (parsed as ReviewSession).date !== "string" ||
      typeof (parsed as ReviewSession).userLanguageId !== "string"
    ) {
      // Malformed — clear it and start fresh
      clearSession(userLanguageId);
      return null;
    }

    const session = parsed as ReviewSession;

    // Daily expiry check — discard sessions from previous days
    if (session.date !== todayString()) {
      clearSession(userLanguageId);
      return null;
    }

    // Sanity check on index bounds
    if (session.index < 0 || session.index > session.cardIds.length) {
      clearSession(userLanguageId);
      return null;
    }

    return session;
  } catch {
    // JSON.parse failed or sessionStorage threw — fail silently
    return null;
  }
}

/**
 * Persists the current review session state to sessionStorage.   
 */
export function saveSession(
  userLanguageId: string,
  cardIds: string[],
  index: number,
): void {
  if (!isStorageAvailable()) return;

  try {
    const session: ReviewSession = {
      cardIds,
      index,
      date: todayString(),
      userLanguageId,
    };
    sessionStorage.setItem(getSessionKey(userLanguageId), JSON.stringify(session));
  } catch {
    // Quota exceeded or storage unavailable — fail silently
    // Progress just won't persist across this remount; not worth crashing for
  }
}

/**
 * Removes the saved session for the given userLanguage.
 */
export function clearSession(userLanguageId: string): void {
  if (!isStorageAvailable()) return;

  try {
    sessionStorage.removeItem(getSessionKey(userLanguageId));
  } catch {
    // Fail silently
  }
}

/**
 * Given a saved session and the cards the server returned on this render,
 * computes the state needed to resume mid-session correctly.
 */
export function resolveResumedSession<T extends { id: string }>(
  session: ReviewSession,
  serverCards: T[],
): {
  remainingCards: T[];
  sessionTotal: number;
  resumeIndex: number;
} {
  // Build a lookup map from the server cards for O(1) access
  const serverCardMap = new Map<string, T>(
    serverCards.map((card) => [card.id, card]),
  );

  // Walk the saved cardIds in order, starting from the saved index.
  const remainingCards: T[] = [];

  const savedCardIds = session.cardIds;
  for (let i = session.index; i < savedCardIds.length; i++) {
    const id = savedCardIds[i];
    if (id === undefined) continue;
    const card = serverCardMap.get(id);
    if (card !== undefined) {
      remainingCards.push(card);
    }
  }

  return {
    remainingCards,
    sessionTotal: session.cardIds.length,
    resumeIndex: 0,
  };
}