/** Legs a player must win to take a "best of `totalLegs`" match (best of 2 → first to 1). */
export const legsNeededToWin = (totalLegs: number): number =>
  Math.max(1, Math.ceil(totalLegs / 2));
