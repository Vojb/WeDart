import { describe, it, expect } from "vitest";
import { countCricketDartsThrown } from "./cricketDartsThrownStat";

describe("countCricketDartsThrown", () => {
  it("counts only the current leg while the match is in progress", () => {
    const darts = countCricketDartsThrown(1, {
      isGameFinished: false,
      completedLegs: [
        {
          rounds: [
            { playerId: 1, darts: [{}, {}, {}] },
            { playerId: 2, darts: [{}, {}, {}] },
            { playerId: 1, darts: [{}, {}, {}] },
          ],
        },
      ],
      rounds: [{ playerId: 1, darts: [{}, {}, {}] }],
      currentRound: { playerId: 2, darts: [] },
    });

    // Prior leg had 2 visits for P1 (6 darts) — must not be included
    expect(darts).toBe(3);
  });

  it("is 0 at the start of a new leg", () => {
    const darts = countCricketDartsThrown(1, {
      isGameFinished: false,
      completedLegs: [
        {
          rounds: [
            { playerId: 1, darts: [{}, {}, {}] },
            { playerId: 2, darts: [{}, {}, {}] },
          ],
        },
      ],
      rounds: [],
      currentRound: { playerId: 2, darts: [] },
    });

    expect(darts).toBe(0);
  });

  it("uses only the last leg when the match is finished", () => {
    const darts = countCricketDartsThrown(1, {
      isGameFinished: true,
      completedLegs: [
        {
          rounds: [
            { playerId: 1, darts: [{}, {}, {}] },
            { playerId: 1, darts: [{}, {}, {}] },
          ],
        },
        {
          rounds: [{ playerId: 1, darts: [{}, {}, {}] }],
        },
      ],
      rounds: [],
      currentRound: null,
    });

    expect(darts).toBe(3);
  });
});
