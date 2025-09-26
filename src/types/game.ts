export interface CompletedGame {
  id: string;
  gameType: string; // Changed from '"501" | "301" | "701"' to string to support custom values
  timestamp: number;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  duration: number;
  winnerId: number | null;
  players: {
    id: number;
    name: string;
    initialScore: number;
    score: number;
    dartsThrown: number;
    scores: {
      score: number;
      darts: number;
    }[];
  }[];
}

export interface X01CompletedPlayer {
  id: number;
  name: string;
  initialScore: number;
  score: number;
  dartsThrown: number;
  scores: {
    score: number;
    darts: number;
  }[];
  rounds100Plus: number;
  rounds140Plus: number;
  rounds180: number;
  checkoutAttempts: number;
  checkoutSuccess: number;
  avgPerDart: number;
  avgPerRound: number;
}

export interface X01CompletedGame {
  id: string;
  gameType: string; // Changed from "501" | "301" | "701" to string to allow custom types
  timestamp: number;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  duration: number;
  winnerId: number | null;
  players: X01CompletedPlayer[];
}
