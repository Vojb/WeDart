import { describe, it, expect, beforeEach } from "vitest";
import { useCricketStore, updateCachedPlayers } from "./useCricketStore";

const TARGETS = [20, 19, 18, 17, 16, 15, "Bull"] as const;

function closeAllForCurrentPlayer(multiplier = 3) {
  for (const target of TARGETS) {
    useCricketStore.getState().recordHit(target, multiplier);
  }
}

describe("useCricketStore legs", () => {
  beforeEach(() => {
    useCricketStore.getState().endGame();
    updateCachedPlayers([
      { id: 1, name: "Player 1" },
      { id: 2, name: "Player 2" },
    ]);
  });

  it("increments legsWon after winning a leg in a multi-leg match", () => {
    const { startGame } = useCricketStore.getState();
    startGame("standard", "first-closed", [1, 2], 3);

    closeAllForCurrentPlayer();

    const game = useCricketStore.getState().currentGame;
    expect(game?.isGameFinished).toBe(false);
    expect(game?.legsWon[1]).toBe(1);
    expect(game?.legsWon[2]).toBe(0);
    expect(game?.currentLeg).toBe(2);
  });

  it("increments legsWon in points win condition", () => {
    const { startGame } = useCricketStore.getState();
    startGame("standard", "points", [1, 2], 3);

    closeAllForCurrentPlayer();

    const game = useCricketStore.getState().currentGame;
    expect(game?.legsWon[1]).toBe(1);
    expect(game?.isGameFinished).toBe(false);
  });

  it("normalizes missing leg fields when recording a leg win", () => {
    const { startGame } = useCricketStore.getState();
    startGame("standard", "first-closed", [1, 2], 3);

    const broken = useCricketStore.getState().currentGame!;
    useCricketStore.setState({
      currentGame: {
        ...broken,
        legsWon: undefined as unknown as Record<number, number>,
        completedLegs: undefined as unknown as typeof broken.completedLegs,
        totalLegs: undefined as unknown as number,
      },
    });

    closeAllForCurrentPlayer();

    const game = useCricketStore.getState().currentGame;
    expect(game?.legsWon?.[1]).toBe(1);
    expect(game?.lastLegWon?.winnerId).toBe(1);
  });
});
