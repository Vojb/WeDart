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

describe("useCricketStore undo", () => {
  beforeEach(() => {
    useCricketStore.getState().endGame();
    updateCachedPlayers([
      { id: 1, name: "Player 1" },
      { id: 2, name: "Player 2" },
    ]);
  });

  it("undoes through skipped empty turns to reach the previous dart", () => {
    const { startGame, recordHit, finishTurn, undoLastHit } =
      useCricketStore.getState();
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    finishTurn();
    finishTurn();

    undoLastHit();

    const game = useCricketStore.getState().currentGame;
    expect(game?.currentPlayerIndex).toBe(0);
    expect(game?.players[0].targets[0].hits).toBe(0);
    expect(game?.currentRound?.playerId).toBe(1);
    expect(game?.currentRound?.darts).toHaveLength(0);
    expect(game?.rounds).toHaveLength(0);
  });

  it("skips trailing empty rounds when finding a dart to undo", () => {
    const { startGame, recordHit, finishTurn, undoLastHit } =
      useCricketStore.getState();
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    finishTurn();

    const midGame = useCricketStore.getState().currentGame!;
    useCricketStore.setState({
      currentGame: {
        ...midGame,
        rounds: [
          ...midGame.rounds,
          { playerId: 2, darts: [], totalPoints: 0 },
        ],
        currentPlayerIndex: 0,
        currentRound: { playerId: 1, darts: [], totalPoints: 0 },
      },
    });

    undoLastHit();

    const game = useCricketStore.getState().currentGame;
    expect(game?.players[0].targets[0].hits).toBe(0);
    expect(game?.currentPlayerIndex).toBe(0);
    expect(game?.rounds).toHaveLength(0);
  });

  it("returns to the correct player when undoing the last dart of a completed turn", () => {
    const { startGame, recordHit, finishTurn, undoLastHit } =
      useCricketStore.getState();
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    finishTurn();

    undoLastHit();

    const game = useCricketStore.getState().currentGame;
    expect(game?.currentPlayerIndex).toBe(0);
    expect(game?.currentRound?.playerId).toBe(1);
    expect(game?.currentRound?.darts).toHaveLength(0);
    expect(game?.players[0].targets[0].hits).toBe(0);
    expect(game?.rounds).toHaveLength(0);
  });

  it("restores marks and score when undoing the current dart", () => {
    const { startGame, recordHit, undoLastHit } = useCricketStore.getState();
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 3);
    recordHit(19, 1);

    undoLastHit();

    const game = useCricketStore.getState().currentGame;
    expect(game?.currentRound?.darts).toHaveLength(1);
    expect(game?.players[0].targets[0].hits).toBe(3);
    expect(game?.players[0].targets[1].hits).toBe(0);
  });
});
