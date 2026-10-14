import type { CricketCompletedGame } from "../store/useHistoryStore";
import type { CricketStatLeg, CricketStatRound } from "./cricketDartsThrownStat";

const DARTS_PER_VISIT = 3;

interface FinishedCricketGame {
  id: string;
  startedAt: number;
  gameType: "standard" | "cutthroat" | "no-score";
  cricketVariant?: string;
  players: {
    id: number;
    name: string;
    totalScore: number;
    isWinner: boolean;
    targets: { number: number | string; hits: number; closed: boolean; points: number }[];
  }[];
  completedLegs: CricketStatLeg[];
  rounds: CricketStatRound[];
}

/** Darts thrown over the whole match (every leg), 3 per completed visit. */
const countMatchDarts = (playerId: number, game: FinishedCricketGame): number => {
  const legRounds = game.completedLegs.length
    ? game.completedLegs.flatMap((leg) => leg.rounds)
    : game.rounds;
  return legRounds.filter((r) => r.playerId === playerId).length * DARTS_PER_VISIT;
};

/** History entry for a finished Cricket or Hidden Cricket match. */
export const toCricketCompletedGame = (
  game: FinishedCricketGame,
  historyGameType: CricketCompletedGame["gameType"]
): CricketCompletedGame => ({
  id: game.id,
  gameType: historyGameType,
  timestamp: Date.now(),
  duration: Math.floor((Date.now() - game.startedAt) / 1000),
  cutThroat: game.gameType === "cutthroat",
  variant: game.cricketVariant,
  winnerId: game.players.find((p) => p.isWinner)?.id ?? null,
  players: game.players.map((player) => ({
    id: player.id,
    name: player.name,
    dartsThrown: countMatchDarts(player.id, game),
    marks: player.targets.reduce((sum, t) => sum + t.hits, 0),
    closedNumbers: player.targets.filter((t) => t.closed).map((t) => t.number),
    totalPoints: player.totalScore,
    scores: player.targets.map((t) => ({
      number: t.number,
      marks: t.hits,
      points: t.points,
    })),
  })),
});
