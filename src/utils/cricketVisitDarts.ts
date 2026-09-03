export interface CricketVisitDart {
  targetNumber: number | string;
  multiplier: number;
  points: number;
  isBonus?: boolean;
}

const isCollapsibleMark = (dart: CricketVisitDart): boolean =>
  !dart.isBonus &&
  dart.targetNumber !== "Miss" &&
  dart.targetNumber !== "Bonus";

/** Bull has no triple — slot max is double (2). Other targets max at triple (3). */
export const maxMarksForVisitSlot = (targetNumber: number | string): number =>
  targetNumber === "Bull" ? 2 : 3;

/**
 * Collapse marks into S / D / T visit slots.
 * Same target upgrades an existing incomplete slot even if other numbers
 * were thrown in between (e.g. 20, 19, 20 → D20, 19).
 * Bull slots cap at 2; other targets at 3. A further mark starts a new slot.
 */
export const collapseMarksToVisitDarts = (
  darts: CricketVisitDart[],
): CricketVisitDart[] => {
  const unitMarks: CricketVisitDart[] = [];

  for (const dart of darts) {
    if (!isCollapsibleMark(dart)) {
      unitMarks.push({ ...dart });
      continue;
    }

    const units = Math.max(1, dart.multiplier);
    for (let i = 0; i < units; i += 1) {
      unitMarks.push({
        targetNumber: dart.targetNumber,
        multiplier: 1,
        points: i === units - 1 ? dart.points : 0,
        isBonus: false,
      });
    }
  }

  const collapsed: CricketVisitDart[] = [];
  for (const mark of unitMarks) {
    if (!isCollapsibleMark(mark)) {
      collapsed.push(mark);
      continue;
    }

    const maxMarks = maxMarksForVisitSlot(mark.targetNumber);
    const upgradable = collapsed.find(
      (slot) =>
        isCollapsibleMark(slot) &&
        slot.targetNumber === mark.targetNumber &&
        slot.multiplier < maxMarks,
    );

    if (upgradable) {
      upgradable.multiplier += 1;
      upgradable.points += mark.points;
    } else {
      collapsed.push({ ...mark });
    }
  }

  return collapsed;
};

export const VISIT_SLOT_LIMIT = 3;

/** True if adding `incoming` would produce more than 3 visit slots (bonus/miss still count as a slot). */
export const wouldExceedVisitSlotLimit = (
  existingDarts: CricketVisitDart[],
  incoming: Pick<CricketVisitDart, "targetNumber" | "multiplier" | "points" | "isBonus">,
  limit: number = VISIT_SLOT_LIMIT,
): boolean => {
  const after = collapseMarksToVisitDarts([
    ...existingDarts,
    {
      targetNumber: incoming.targetNumber,
      multiplier: incoming.multiplier,
      points: incoming.points ?? 0,
      isBonus: incoming.isBonus,
    },
  ]);
  return after.length > limit;
};

export const isVisitSlotLimitReached = (
  darts: CricketVisitDart[],
  limit: number = VISIT_SLOT_LIMIT,
): boolean => collapseMarksToVisitDarts(darts).length >= limit;
