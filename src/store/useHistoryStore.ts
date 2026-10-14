import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define game types enum
export type X01GameType = "301" | "501" | "701" | (string & {});
export type GameType =
  | X01GameType
  | "cricket"
  | "hidden-cricket"
  | "halveit"
  | "warmup";

// Define the base completed game interface with common properties
export interface BaseCompletedGame {
  id: string;
  gameType: GameType;
  timestamp: number;
  duration: number; // in seconds
  players: BaseCompletedGamePlayer[];
  winnerId: number | null;
}

// Common player stats that apply to all game types
export interface BaseCompletedGamePlayer {
  id: number;
  name: string;
  dartsThrown: number;
  avgPerDart?: number;
  avgPerRound?: number;
}

// X01 specific game properties
export interface X01CompletedGame extends BaseCompletedGame {
  gameType: X01GameType;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  players: X01CompletedGamePlayer[];
}

// X01 player stats
export interface X01CompletedGamePlayer extends BaseCompletedGamePlayer {
  initialScore: number;
  finalScore: number;
  rounds100Plus: number;
  rounds140Plus: number;
  rounds180: number;
  checkoutSuccess: number;
  checkoutAttempts: number;
  scores: {
    score: number;
    darts: number;
  }[];
}

// Cricket specific game properties
export interface CricketCompletedGame extends BaseCompletedGame {
  gameType: "cricket" | "hidden-cricket";
  cutThroat: boolean; // Whether the game was played in cut-throat mode
  variant?: string; // e.g. "standard", "osha"
  players: CricketCompletedGamePlayer[];
}

// Cricket player stats
export interface CricketCompletedGamePlayer extends BaseCompletedGamePlayer {
  marks: number; // Total marks scored
  closedNumbers: (number | string)[]; // Targets closed by this player (15-20, "Bull", "Triple", "Double")
  totalPoints: number;
  scores: {
    number: number | string;
    marks: number;
    points: number;
  }[];
}

// HalveIt specific game properties
export interface HalveItCompletedGame extends BaseCompletedGame {
  gameType: "halveit";
  mode: "default" | "41";
  players: HalveItCompletedGamePlayer[];
}

// HalveIt player stats
export interface HalveItCompletedGamePlayer extends BaseCompletedGamePlayer {
  finalScore: number; // Total score at the end of the game
  rounds: HalveItCompletedRound[]; // Round-by-round performance
}

// HalveIt round data for completed games
export interface HalveItCompletedRound {
  roundNumber: number;
  roundType: "scoring" | "number" | "double" | "treble" | "bull" | "target-score";
  target?: number | string;
  score: number; // Score after this round
  pointsGained: number; // Points gained (or lost) in this round
  isHalved: boolean; // Whether the score was halved this round
  hits?: number; // For number/bull rounds
  points?: number; // For scoring/double/treble rounds
  totalScore?: number; // For target-score rounds
}

// Warmup specific game properties
export interface WarmupCompletedGame extends BaseCompletedGame {
  gameType: "warmup";
  dartCount: number;
  players: WarmupCompletedGamePlayer[];
}

// Warmup player stats (finalScore = hit percentage)
export interface WarmupCompletedGamePlayer extends BaseCompletedGamePlayer {
  finalScore: number; // hit percentage
  rounds: {
    roundNumber: number;
    target: number | "Bull";
    hits: number;
    attempts: number;
  }[];
}

// Union type for all game types
export type CompletedGame =
  | X01CompletedGame
  | CricketCompletedGame
  | HalveItCompletedGame
  | WarmupCompletedGame;

// Type guard functions to check game types
const NON_X01_GAME_TYPES: readonly string[] = [
  "cricket",
  "hidden-cricket",
  "halveit",
  "warmup",
];

// X01 games store their starting score (301, 501, custom...) as the game type
export function isX01Game(game: CompletedGame): game is X01CompletedGame {
  return !NON_X01_GAME_TYPES.includes(game.gameType);
}

export function isCricketGame(
  game: CompletedGame
): game is CricketCompletedGame {
  return game.gameType === "cricket" || game.gameType === "hidden-cricket";
}

export function isHalveItGame(
  game: CompletedGame
): game is HalveItCompletedGame {
  return game.gameType === "halveit";
}

export function isWarmupGame(
  game: CompletedGame
): game is WarmupCompletedGame {
  return game.gameType === "warmup";
}

export type HistoryCategory =
  | "x01"
  | "cricket"
  | "hidden-cricket"
  | "halveit"
  | "warmup";

export const HISTORY_CATEGORY_LABELS: Record<HistoryCategory, string> = {
  x01: "X01",
  cricket: "Cricket",
  "hidden-cricket": "Hidden Cricket",
  halveit: "Halve It",
  warmup: "Warmup",
};

export function getHistoryCategory(game: CompletedGame): HistoryCategory {
  return isX01Game(game) ? "x01" : (game.gameType as HistoryCategory);
}

/** Display name for a game, e.g. "501", "Cricket", "Halve It". */
export function getGameTitle(game: CompletedGame): string {
  return isX01Game(game)
    ? game.gameType
    : HISTORY_CATEGORY_LABELS[getHistoryCategory(game)];
}

interface HistoryState {
  completedGames: CompletedGame[];
  addCompletedGame: (game: CompletedGame) => void;
  getGameById: (id: string) => CompletedGame | undefined;
  getPlayerGames: (playerId: number) => CompletedGame[];
  getGamesByType: (gameType: GameType) => CompletedGame[];
  clearHistory: () => void;
}

// Create the history store with persistence
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      completedGames: [],

      addCompletedGame: (game) =>
        set((state) => ({
          // Same id means the same match was saved again (reload or undo + re-finish), so replace it
          completedGames: [
            game,
            ...state.completedGames.filter((g) => g.id !== game.id),
          ],
        })),

      getGameById: (id) => {
        return get().completedGames.find((game) => game.id === id);
      },

      getPlayerGames: (playerId) => {
        return get().completedGames.filter((game) =>
          game.players.some((player) => player.id === playerId)
        );
      },

      getGamesByType: (gameType) => {
        return get().completedGames.filter(
          (game) => game.gameType === gameType
        );
      },

      clearHistory: () => set({ completedGames: [] }),
    }),
    {
      name: "wedart-history-storage",
      version: 1,
    }
  )
);
