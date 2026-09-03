/** Round shape shared by cricket and hidden-cricket stores */
export interface CricketStatRound {
  playerId: number;
  darts: unknown[];
}

export interface CricketStatLeg {
  rounds: CricketStatRound[];
}

/** One visit to the oche = 3 darts (count completed turns only — when play switches away). */
function countCompletedVisitsInRounds(
  playerId: number,
  rounds: CricketStatRound[],
): number {
  return rounds.filter((r) => r.playerId === playerId).length;
}

const DARTS_PER_VISIT = 3;

/**
 * Darts thrown for the **current leg only** (resets when a new leg starts).
 *
 * Counts 3 darts per completed visit (round pushed to history). In-progress
 * `currentRound` does not add darts until the turn finishes (Next / player switch).
 *
 * When the match is finished, uses the last completed leg’s rounds.
 */
export function countCricketDartsThrown(
  playerId: number,
  args: {
    isGameFinished: boolean;
    completedLegs: CricketStatLeg[];
    rounds: CricketStatRound[];
    currentRound: CricketStatRound | null;
  },
): number {
  const { isGameFinished, completedLegs, rounds } = args;

  if (isGameFinished && completedLegs.length > 0) {
    const lastLeg = completedLegs[completedLegs.length - 1];
    return (
      countCompletedVisitsInRounds(playerId, lastLeg.rounds) * DARTS_PER_VISIT
    );
  }

  return countCompletedVisitsInRounds(playerId, rounds) * DARTS_PER_VISIT;
}
