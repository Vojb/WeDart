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

  it("keeps prior legsWon when undoing a dart after the next leg has started", () => {
    const { startGame, recordHit, undoLastHit } = useCricketStore.getState();
    startGame("standard", "first-closed", [1, 2], 3);

    closeAllForCurrentPlayer();
    let game = useCricketStore.getState().currentGame!;
    expect(game.legsWon).toEqual({ 1: 1, 2: 0 });
    expect(game.currentLeg).toBe(2);

    // Throw (and undo) in the new leg — must not wipe leg 1
    recordHit(20, 1);
    undoLastHit();

    game = useCricketStore.getState().currentGame!;
    expect(game.legsWon).toEqual({ 1: 1, 2: 0 });
    expect(game.completedLegs).toHaveLength(1);
    expect(game.currentLeg).toBe(2);
  });

  it("preserves legsWon when the match ends 2-1", () => {
    const { startGame } = useCricketStore.getState();
    startGame("standard", "first-closed", [1, 2], 3);

    closeAllForCurrentPlayer(); // P1 wins leg 1 → 1-0
    closeAllForCurrentPlayer(); // P2 starts leg 2 and wins → 1-1

    let game = useCricketStore.getState().currentGame!;
    expect(game.legsWon).toEqual({ 1: 1, 2: 1 });
    expect(game.currentLeg).toBe(3);
    expect(game.players[game.currentPlayerIndex].id).toBe(1);

    closeAllForCurrentPlayer(); // P1 wins leg 3 → 2-1 match over
    game = useCricketStore.getState().currentGame!;
    expect(game.legsWon).toEqual({ 1: 2, 2: 1 });
    expect(game.isGameFinished).toBe(true);
  });
});

describe("useCricketStore undo", () => {
  beforeEach(() => {
    useCricketStore.getState().endGame();
    useCricketStore.getState().updateGameSettings({
      limitVisitToThreeSlots: false,
    });
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

  it("can undo through multiple completed turns without getting stuck", () => {
    const { startGame, recordHit, finishTurn, undoLastHit } =
      useCricketStore.getState();
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    recordHit(20, 1);
    finishTurn();
    recordHit(19, 1);
    finishTurn();
    recordHit(18, 1);
    finishTurn();

    for (let i = 0; i < 10; i++) {
      const before = useCricketStore.getState().currentGame!;
      const dartsBefore =
        (before.currentRound?.darts.length ?? 0) +
        before.rounds.reduce((s, r) => s + r.darts.length, 0);
      if (dartsBefore === 0) break;
      undoLastHit();
      const after = useCricketStore.getState().currentGame!;
      const dartsAfter =
        (after.currentRound?.darts.length ?? 0) +
        after.rounds.reduce((s, r) => s + r.darts.length, 0);
      expect(dartsAfter).toBe(dartsBefore - 1);
    }

    const game = useCricketStore.getState().currentGame!;
    const totalDarts =
      (game.currentRound?.darts.length ?? 0) +
      game.rounds.reduce((s, r) => s + r.darts.length, 0);
    expect(totalDarts).toBe(0);
    expect(game.players[0].targets.every((t) => t.hits === 0)).toBe(true);
    expect(game.players[1].targets.every((t) => t.hits === 0)).toBe(true);
  });

  it("does not wipe prior visits when undoing the current visit for the same player", () => {
    const { startGame, recordHit, finishTurn, undoLastHit } =
      useCricketStore.getState();
    startGame("standard", "points", [1], 1);

    recordHit(20, 1);
    finishTurn();
    recordHit(19, 1);

    undoLastHit();

    const mid = useCricketStore.getState().currentGame!;
    expect(mid.players[0].targets.find((t) => t.number === 19)?.hits).toBe(0);
    expect(
      mid.rounds.some((r) => r.darts.some((d) => d.targetNumber === 20)),
    ).toBe(true);

    undoLastHit();

    const end = useCricketStore.getState().currentGame!;
    const totalDarts =
      (end.currentRound?.darts.length ?? 0) +
      end.rounds.reduce((s, r) => s + r.darts.length, 0);
    expect(totalDarts).toBe(0);
    expect(end.players[0].targets.find((t) => t.number === 20)?.hits).toBe(0);
  });

  it("can undo the winning visit without losing earlier rounds", () => {
    const { startGame, undoLastHit } = useCricketStore.getState();
    startGame("standard", "first-closed", [1, 2], 1);

    useCricketStore.getState().recordHit(20, 1);
    useCricketStore.getState().finishTurn();
    closeAllForCurrentPlayer();

    const finished = useCricketStore.getState().currentGame!;
    expect(finished.isGameFinished).toBe(true);
    expect(finished.rounds.length).toBeGreaterThan(0);

    const roundsBeforeWinningVisit = finished.rounds.length;
    undoLastHit();

    const after = useCricketStore.getState().currentGame!;
    expect(after.rounds.length).toBe(roundsBeforeWinningVisit);
    expect(
      after.rounds.some((r) => r.darts.some((d) => d.targetNumber === 20)),
    ).toBe(true);
  });

  it("blocks a fourth visit slot when limit is enabled", () => {
    const { startGame, recordHit, updateGameSettings } =
      useCricketStore.getState();
    updateGameSettings({ limitVisitToThreeSlots: true });
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    recordHit(19, 1);
    recordHit(18, 1);
    recordHit(17, 1);

    const game = useCricketStore.getState().currentGame!;
    expect(game.limitVisitToThreeSlots).toBe(true);
    expect(game.currentRound?.darts).toHaveLength(3);
    expect(game.players[0].targets.find((t) => t.number === 17)?.hits).toBe(0);
  });

  it("still allows upgrading any earlier slot to a double/triple when limited", () => {
    const { startGame, recordHit, updateGameSettings } =
      useCricketStore.getState();
    updateGameSettings({ limitVisitToThreeSlots: true });
    startGame("standard", "points", [1, 2], 1);

    recordHit(20, 1);
    recordHit(19, 1);
    recordHit(18, 1);
    recordHit(20, 1);
    recordHit(20, 1);
    recordHit(17, 1);

    const game = useCricketStore.getState().currentGame!;
    expect(game.currentRound?.darts).toHaveLength(5);
    expect(game.players[0].targets.find((t) => t.number === 20)?.hits).toBe(3);
    expect(game.players[0].targets.find((t) => t.number === 17)?.hits).toBe(0);
  });
});
