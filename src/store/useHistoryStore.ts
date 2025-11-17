import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define game types enum
export type GameType =
  | "301"
  | "501"
  | "701"
  | "cricket"
  | "halveit";

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
  gameType: "301" | "501" | "701";
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
  gameType: "cricket";
  cutThroat: boolean; // Whether the game was played in cut-throat mode
  players: CricketCompletedGamePlayer[];
}

// Cricket player stats
export interface CricketCompletedGamePlayer extends BaseCompletedGamePlayer {
  marks: number; // Total marks scored
  closedNumbers: number[]; // Numbers that were closed by this player
  totalPoints: number;
  scores: {
    number: number;
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

// Union type for all game types
export type CompletedGame =
  | X01CompletedGame
  | CricketCompletedGame
  | HalveItCompletedGame;

// Type guard functions to check game types
export function isX01Game(game: CompletedGame): game is X01CompletedGame {
  return (
    game.gameType === "301" ||
    game.gameType === "501" ||
    game.gameType === "701"
  );
}

export function isCricketGame(
  game: CompletedGame
): game is CricketCompletedGame {
  return game.gameType === "cricket";
}

export function isHalveItGame(
  game: CompletedGame
): game is HalveItCompletedGame {
  return game.gameType === "halveit";
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
          completedGames: [game, ...state.completedGames], // Add to the beginning for chronological order (newest first)
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
