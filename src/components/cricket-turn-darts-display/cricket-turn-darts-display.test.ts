import { describe, expect, it } from "vitest";
import {
  collapseMarksToVisitDarts,
  wouldExceedVisitSlotLimit,
} from "../../utils/cricketVisitDarts";

describe("collapseMarksToVisitDarts", () => {
  it("turns two same marks into a double", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
      ]),
    ).toEqual([{ targetNumber: 20, multiplier: 2, points: 0, isBonus: false }]);
  });

  it("turns three same marks into a triple", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
      ]),
    ).toEqual([{ targetNumber: 20, multiplier: 3, points: 0, isBonus: false }]);
  });

  it("starts a new dart after a triple on the same number", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: 20, multiplier: 3, points: 0, isBonus: false },
      { targetNumber: 20, multiplier: 1, points: 0, isBonus: false },
    ]);
  });

  it("upgrades an earlier slot when the same number is pressed later", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 19, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: 20, multiplier: 2, points: 0, isBonus: false },
      { targetNumber: 19, multiplier: 1, points: 0, isBonus: false },
    ]);
  });

  it("can triple an earlier slot after other numbers", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 19, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 18, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: 20, multiplier: 3, points: 0, isBonus: false },
      { targetNumber: 19, multiplier: 1, points: 0, isBonus: false },
      { targetNumber: 18, multiplier: 1, points: 0, isBonus: false },
    ]);
  });

  it("builds double/triple independently for later darts", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: 19, multiplier: 1, points: 0 },
        { targetNumber: 19, multiplier: 1, points: 0 },
        { targetNumber: 19, multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: 20, multiplier: 2, points: 0, isBonus: false },
      { targetNumber: 19, multiplier: 3, points: 0, isBonus: false },
    ]);
  });

  it("caps bull at a double and starts a new slot on the third mark", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: "Bull", multiplier: 1, points: 0 },
        { targetNumber: "Bull", multiplier: 1, points: 0 },
        { targetNumber: "Bull", multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: "Bull", multiplier: 2, points: 0, isBonus: false },
      { targetNumber: "Bull", multiplier: 1, points: 0, isBonus: false },
    ]);
  });

  it("upgrades an earlier bull slot after other numbers, still capped at double", () => {
    expect(
      collapseMarksToVisitDarts([
        { targetNumber: "Bull", multiplier: 1, points: 0 },
        { targetNumber: 20, multiplier: 1, points: 0 },
        { targetNumber: "Bull", multiplier: 1, points: 0 },
        { targetNumber: "Bull", multiplier: 1, points: 0 },
      ]),
    ).toEqual([
      { targetNumber: "Bull", multiplier: 2, points: 0, isBonus: false },
      { targetNumber: 20, multiplier: 1, points: 0, isBonus: false },
      { targetNumber: "Bull", multiplier: 1, points: 0, isBonus: false },
    ]);
  });
});

describe("wouldExceedVisitSlotLimit", () => {
  it("allows upgrading an existing slot instead of opening a fourth", () => {
    const threeSlots = [
      { targetNumber: 20, multiplier: 1, points: 0 },
      { targetNumber: 19, multiplier: 1, points: 0 },
      { targetNumber: 18, multiplier: 1, points: 0 },
    ];

    expect(
      wouldExceedVisitSlotLimit(threeSlots, {
        targetNumber: 20,
        multiplier: 1,
        points: 0,
      }),
    ).toBe(false);

    expect(
      wouldExceedVisitSlotLimit(threeSlots, {
        targetNumber: 17,
        multiplier: 1,
        points: 0,
      }),
    ).toBe(true);
  });

  it("blocks a new slot once that number is already a triple", () => {
    expect(
      wouldExceedVisitSlotLimit(
        [
          { targetNumber: 20, multiplier: 1, points: 0 },
          { targetNumber: 20, multiplier: 1, points: 0 },
          { targetNumber: 20, multiplier: 1, points: 0 },
          { targetNumber: 19, multiplier: 1, points: 0 },
          { targetNumber: 18, multiplier: 1, points: 0 },
        ],
        { targetNumber: 20, multiplier: 1, points: 0 },
      ),
    ).toBe(true);
  });
});
