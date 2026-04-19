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

function countCompletedVisitsInLegs(
  playerId: number,
  legs: CricketStatLeg[],
): number {
  return legs.reduce(
    (sum, leg) => sum + countCompletedVisitsInRounds(playerId, leg.rounds),
    0,
  );
}

const DARTS_PER_VISIT = 3;

/**
 * Total darts: 3 for each **completed** visit (each time that player’s turn ended — round
 * pushed to history). In-progress `currentRound` does not add darts until the turn finishes
 * (player switches / Next). Matches “3 darts per turn” when players alternate.
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
    return countCompletedVisitsInLegs(playerId, completedLegs) * DARTS_PER_VISIT;
  }

  const visits =
    countCompletedVisitsInLegs(playerId, completedLegs) +
    countCompletedVisitsInRounds(playerId, rounds);
  return visits * DARTS_PER_VISIT;
}
