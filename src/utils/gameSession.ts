import { v4 as uuidv4 } from "uuid";

/** Identity shared by every in-progress game so it can be restored from a URL. */
export interface GameSession {
  id: string;
  startedAt: number;
}

export const createGameSession = (): GameSession => ({
  id: uuidv4(),
  startedAt: Date.now(),
});

/** Game routes: each game lives at `${basePath}/:id`. */
export const GAME_PATHS = {
  x01: "/x01/game",
  cricket: "/cricket/game",
  hiddenCricket: "/hidden-cricket/game",
  halveit: "/halveit/game",
  warmup: "/warmup/game",
} as const;

export const gameUrl = (basePath: string, id: string): string =>
  `${basePath}/${id}`;

/**
 * Persist `migrate` helper: games stored before sessions existed have no id,
 * so give them one instead of throwing the game away.
 */
export const migrateGameSession = (persistedState: unknown): unknown => {
  if (!persistedState || typeof persistedState !== "object") {
    return persistedState;
  }
  const state = persistedState as { currentGame?: Record<string, unknown> | null };
  const game = state.currentGame;
  if (!game || typeof game.id === "string") return persistedState;
  return {
    ...state,
    currentGame: { ...createGameSession(), ...game },
  };
};
