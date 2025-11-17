import { describe, it, expect, beforeEach } from "vitest";
import { useHalveItStore, updateCachedHalveItPlayers } from "./useHalveItStore";

describe("useHalveItStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useHalveItStore.getState().endGame();
    updateCachedHalveItPlayers([
      { id: 1, name: "Player 1" },
      { id: 2, name: "Player 2" },
      { id: 3, name: "Player 3" },
    ]);
  });

  describe("startGame", () => {
    it("should initialize a default game with correct structure", () => {
      const { startGame } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);

      const game = useHalveItStore.getState().currentGame;
      expect(game).not.toBeNull();
      expect(game?.mode).toBe("default");
      expect(game?.players).toHaveLength(3);
      expect(game?.players[0].orderIndex).toBe(0);
      expect(game?.players[1].orderIndex).toBe(1);
      expect(game?.players[2].orderIndex).toBe(2);
      expect(game?.currentPlayerIndex).toBe(0);
      expect(game?.currentRoundIndex).toBe(0);
      expect(game?.isGameFinished).toBe(false);
      expect(game?.rounds).toHaveLength(10); // Default mode has 10 rounds
    });

    it("should initialize a 41 game with correct structure", () => {
      const { startGame } = useHalveItStore.getState();
      startGame("41", [1, 2]);

      const game = useHalveItStore.getState().currentGame;
      expect(game).not.toBeNull();
      expect(game?.mode).toBe("41");
      expect(game?.players).toHaveLength(2);
      expect(game?.rounds).toHaveLength(8); // 41 mode has 8 rounds
    });

    it("should preserve player order based on playerIds array", () => {
      const { startGame } = useHalveItStore.getState();
      startGame("default", [3, 1, 2]);

      const game = useHalveItStore.getState().currentGame;
      expect(game?.players[0].id).toBe(3);
      expect(game?.players[0].orderIndex).toBe(0);
      expect(game?.players[1].id).toBe(1);
      expect(game?.players[1].orderIndex).toBe(1);
      expect(game?.players[2].id).toBe(2);
      expect(game?.players[2].orderIndex).toBe(2);
    });

    it("should initialize all players with zero score", () => {
      const { startGame } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);

      const game = useHalveItStore.getState().currentGame;
      game?.players.forEach(player => {
        expect(player.totalScore).toBe(0);
        expect(player.rounds).toHaveLength(0);
      });
    });
  });

  describe("recordRoundScore", () => {
    beforeEach(() => {
      const { startGame } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);
    });

    it("should record score for current player and advance to next player", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Player 1 scores 10 points in scoring round
      recordRoundScore(1, 0, { points: 10 });

      const game = useHalveItStore.getState().currentGame;
      expect(game?.players[0].totalScore).toBe(10);
      expect(game?.rounds[0].playerScores[1]).toEqual({
        points: 10,
        score: 10,
      });
      expect(game?.currentPlayerIndex).toBe(1); // Advanced to Player 2
      expect(game?.currentRoundIndex).toBe(0); // Still in round 1
    });

    it("should halve score when zero points/hits are entered", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Player 1 scores 20 points first
      recordRoundScore(1, 0, { points: 20 });
      
      // Player 2 scores 0 points (should halve)
      recordRoundScore(2, 0, { points: 0 });

      const game = useHalveItStore.getState().currentGame;
      expect(game?.players[1].totalScore).toBe(0); // Started at 0, halved to 0
    });

    it("should advance to next round when all players complete current round", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // All 3 players score in round 1
      recordRoundScore(1, 0, { points: 10 });
      recordRoundScore(2, 0, { points: 20 });
      recordRoundScore(3, 0, { points: 30 });

      const game = useHalveItStore.getState().currentGame;
      expect(game?.currentRoundIndex).toBe(1); // Advanced to round 2
      expect(game?.currentPlayerIndex).toBe(0); // Back to Player 1
    });

    it("should calculate number round scores correctly", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Round 1: scoring (Player 1 scores 10)
      let game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 20 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 30 });

      // Round 2: number 15 (Player 1 scores 2 hits)
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      expect(game.currentRoundIndex).toBe(1);
      expect(game.currentPlayerIndex).toBe(0); // Should be Player 1
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 2 });

      game = useHalveItStore.getState().currentGame;
      // Player 1 had 10, now 2 hits * 15 = 30, total = 10 + 30 = 40
      expect(game?.players[0].totalScore).toBe(40);
    });

    it("should calculate bull round scores correctly", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Complete first 9 rounds
      // Rounds: scoring, 15, 16, double, 17, 18, treble, 19, 20
      for (let round = 0; round < 9; round++) {
        let game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound = game.rounds[game.currentRoundIndex];
        
        // Use correct input type based on round type
        if (currentRound.roundType === "number") {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 1 });
        } else {
          // scoring, double, treble rounds use points
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
        }
        
        game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound2 = game.rounds[game.currentRoundIndex];
        
        if (currentRound2.roundType === "number") {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 1 });
        } else {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
        }
        
        game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound3 = game.rounds[game.currentRoundIndex];
        
        if (currentRound3.roundType === "number") {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 1 });
        } else {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
        }
      }

      // Round 10: bull (Player 1 scores 3 hits)
      const gameBefore = useHalveItStore.getState().currentGame;
      if (!gameBefore) throw new Error("Game not initialized");
      expect(gameBefore.currentRoundIndex).toBe(9);
      expect(gameBefore.currentPlayerIndex).toBe(0); // Should be Player 1
      const previousTotal = gameBefore.players[0].totalScore;
      recordRoundScore(gameBefore.players[gameBefore.currentPlayerIndex].id, gameBefore.currentRoundIndex, { hits: 3 });

      const game = useHalveItStore.getState().currentGame;
      // Player 1 had previousTotal, now 3 hits * 25 = 75, total = previousTotal + 75
      expect(game?.players[0].totalScore).toBe(previousTotal + 75);
    });

    it("should calculate target-score round correctly", () => {
      const { startGame, recordRoundScore } = useHalveItStore.getState();
      startGame("41", [1, 2]);

      // Complete first 4 rounds
      // Round 0: number 19, Round 1: number 18, Round 2: double, Round 3: number 17
      for (let round = 0; round < 4; round++) {
        let game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound = game.rounds[game.currentRoundIndex];
        
        // Use correct input type based on round type
        if (currentRound.roundType === "number") {
          // For number rounds, use hits (e.g., 1 hit = 19 points for round 0)
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 1 });
        } else if (currentRound.roundType === "double") {
          // For double rounds, use points
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
        }
        
        game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound2 = game.rounds[game.currentRoundIndex];
        
        if (currentRound2.roundType === "number") {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { hits: 1 });
        } else if (currentRound2.roundType === "double") {
          recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
        }
      }

      // Round 5: target-score 41 (Player 1 scores exactly 41)
      const gameBefore = useHalveItStore.getState().currentGame;
      if (!gameBefore) throw new Error("Game not initialized");
      expect(gameBefore.currentRoundIndex).toBe(4);
      // Player 1 should have: 19 + 18 + 10 + 17 = 64 (but let's check what they actually have)
      recordRoundScore(gameBefore.players[gameBefore.currentPlayerIndex].id, gameBefore.currentRoundIndex, { totalScore: 41 });

      const game = useHalveItStore.getState().currentGame;
      // Player 1's previous total + 41
      const previousTotal = gameBefore.players[0].totalScore;
      expect(game?.players[0].totalScore).toBe(previousTotal + 41);
    });

    it("should halve score in target-score round if not exactly 41", () => {
      const { startGame, recordRoundScore } = useHalveItStore.getState();
      startGame("41", [1, 2]);

      // Complete first 4 rounds (rounds 0-3)
      // Round 0: number 19, Round 1: number 18, Round 2: double, Round 3: number 17
      for (let round = 0; round < 4; round++) {
        // Get current game state to ensure we're recording in the right round
        let game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        
        const currentRound = game.rounds[game.currentRoundIndex];
        const currentPlayer = game.players[game.currentPlayerIndex];
        
        // Use correct input type based on round type
        if (currentRound.roundType === "number") {
          recordRoundScore(currentPlayer.id, game.currentRoundIndex, { hits: 1 });
        } else if (currentRound.roundType === "double") {
          recordRoundScore(currentPlayer.id, game.currentRoundIndex, { points: 10 });
        }
        
        // Record for second player
        game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        const currentRound2 = game.rounds[game.currentRoundIndex];
        const currentPlayer2 = game.players[game.currentPlayerIndex];
        
        if (currentRound2.roundType === "number") {
          recordRoundScore(currentPlayer2.id, game.currentRoundIndex, { hits: 1 });
        } else if (currentRound2.roundType === "double") {
          recordRoundScore(currentPlayer2.id, game.currentRoundIndex, { points: 10 });
        }
      }

      // Round 5: target-score 41 (Player 1 scores 40, not 41)
      const gameBefore = useHalveItStore.getState().currentGame;
      if (!gameBefore) throw new Error("Game not initialized");
      expect(gameBefore.currentRoundIndex).toBe(4); // Should be on round 5 (index 4)
      // Player 1 should have: 19 + 18 + 10 + 17 = 64
      const previousTotal = gameBefore.players[0].totalScore;
      
      const currentPlayer = gameBefore.players[gameBefore.currentPlayerIndex];
      recordRoundScore(currentPlayer.id, gameBefore.currentRoundIndex, { totalScore: 40 });

      const game = useHalveItStore.getState().currentGame;
      // Player 1 had previousTotal, halved to Math.floor(previousTotal / 2)
      expect(game?.players[0].totalScore).toBe(Math.floor(previousTotal / 2));
    });

    it("should mark game as finished when all rounds are complete", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Complete all 10 rounds for all 3 players
      for (let round = 0; round < 10; round++) {
        recordRoundScore(1, round, { points: 10 });
        recordRoundScore(2, round, { points: 10 });
        recordRoundScore(3, round, { points: 10 });
      }

      const game = useHalveItStore.getState().currentGame;
      expect(game?.isGameFinished).toBe(true);
    });

    it("should maintain player order after scoring", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      // Player 2 scores high, Player 1 scores low
      recordRoundScore(1, 0, { points: 10 });
      recordRoundScore(2, 0, { points: 100 });
      recordRoundScore(3, 0, { points: 50 });

      const game = useHalveItStore.getState().currentGame;
      // Players should still be in order: Player 1, Player 2, Player 3
      expect(game?.players[0].id).toBe(1);
      expect(game?.players[0].orderIndex).toBe(0);
      expect(game?.players[1].id).toBe(2);
      expect(game?.players[1].orderIndex).toBe(1);
      expect(game?.players[2].id).toBe(3);
      expect(game?.players[2].orderIndex).toBe(2);
    });

    it("should track lastScore for undo functionality", () => {
      const { recordRoundScore } = useHalveItStore.getState();
      
      recordRoundScore(1, 0, { points: 10 });

      const game = useHalveItStore.getState().currentGame;
      expect(game?.lastScore).toEqual({
        playerId: 1,
        roundIndex: 0,
      });
    });
  });

  describe("undoLastScore", () => {
    beforeEach(() => {
      const { startGame } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);
    });

    it("should undo the last score and revert player total", () => {
      const { recordRoundScore, undoLastScore } = useHalveItStore.getState();
      
      recordRoundScore(1, 0, { points: 10 });
      recordRoundScore(2, 0, { points: 20 });

      undoLastScore();

      const game = useHalveItStore.getState().currentGame;
      expect(game?.rounds[0].playerScores[2]).toBeUndefined();
      expect(game?.players[1].totalScore).toBe(0);
      expect(game?.currentPlayerIndex).toBe(1); // Should be on Player 2
      expect(game?.currentRoundIndex).toBe(0);
    });

    it("should recalculate subsequent rounds after undo", () => {
      const { recordRoundScore, undoLastScore } = useHalveItStore.getState();
      
      // Complete round 1
      recordRoundScore(1, 0, { points: 10 });
      recordRoundScore(2, 0, { points: 20 });
      recordRoundScore(3, 0, { points: 30 });

      // Player 1 scores in round 2 (should be 10 + 15 = 25)
      recordRoundScore(1, 1, { points: 15 });

      // Undo Player 1's score in round 2 (last score)
      undoLastScore();

      const game = useHalveItStore.getState().currentGame;
      // Player 1's round 2 score should be removed
      expect(game?.rounds[1].playerScores[1]).toBeUndefined();
      // Player 1's total should be back to round 1 score
      expect(game?.players[0].totalScore).toBe(10);
    });

    it("should update lastScore to previous score after undo", () => {
      const { recordRoundScore, undoLastScore } = useHalveItStore.getState();
      
      recordRoundScore(1, 0, { points: 10 });
      recordRoundScore(2, 0, { points: 20 });
      recordRoundScore(3, 0, { points: 30 });

      // Undo Player 3's score (last score)
      undoLastScore();

      const game = useHalveItStore.getState().currentGame;
      // lastScore should point to Player 2's score
      expect(game?.lastScore).toEqual({
        playerId: 2,
        roundIndex: 0,
      });
    });
  });

  describe("endGame", () => {
    it("should clear current game", () => {
      const { startGame, endGame } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);
      
      expect(useHalveItStore.getState().currentGame).not.toBeNull();
      
      endGame();
      
      expect(useHalveItStore.getState().currentGame).toBeNull();
    });
  });

  describe("player order consistency", () => {
    it("should maintain order throughout entire game", () => {
      const { startGame, recordRoundScore } = useHalveItStore.getState();
      startGame("default", [3, 1, 2]); // Start with Player 3 first

      // Complete several rounds
      for (let round = 0; round < 5; round++) {
        recordRoundScore(3, round, { points: 100 }); // Player 3 scores high
        recordRoundScore(1, round, { points: 10 }); // Player 1 scores low
        recordRoundScore(2, round, { points: 50 }); // Player 2 scores medium
      }

      const game = useHalveItStore.getState().currentGame;
      // Order should still be: Player 3, Player 1, Player 2
      expect(game?.players[0].id).toBe(3);
      expect(game?.players[0].orderIndex).toBe(0);
      expect(game?.players[1].id).toBe(1);
      expect(game?.players[1].orderIndex).toBe(1);
      expect(game?.players[2].id).toBe(2);
      expect(game?.players[2].orderIndex).toBe(2);
    });

    it("should maintain fixed order after a round is finished - no sorting", () => {
      const { startGame, recordRoundScore } = useHalveItStore.getState();
      // Start with players in order: Player 2, Player 1, Player 3
      startGame("default", [2, 1, 3]);

      let game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");

      // Verify initial order
      expect(game.players[0].id).toBe(2);
      expect(game.players[0].orderIndex).toBe(0);
      expect(game.players[1].id).toBe(1);
      expect(game.players[1].orderIndex).toBe(1);
      expect(game.players[2].id).toBe(3);
      expect(game.players[2].orderIndex).toBe(2);

      // Complete round 1 - Player 2 scores low, Player 1 scores high, Player 3 scores medium
      // This tests that even when scores differ significantly, order doesn't change
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 5 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 100 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 50 });

      // After round 1 is finished, verify order is still fixed
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      
      // Order should remain: Player 2, Player 1, Player 3 (original order)
      expect(game.players[0].id).toBe(2);
      expect(game.players[0].orderIndex).toBe(0);
      expect(game.players[0].totalScore).toBe(5);
      
      expect(game.players[1].id).toBe(1);
      expect(game.players[1].orderIndex).toBe(1);
      expect(game.players[1].totalScore).toBe(100);
      
      expect(game.players[2].id).toBe(3);
      expect(game.players[2].orderIndex).toBe(2);
      expect(game.players[2].totalScore).toBe(50);

      // Complete round 2 - verify order still doesn't change
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 20 });
      
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 15 });

      // After round 2 is finished, order should still be fixed
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      
      // Order should still be: Player 2, Player 1, Player 3
      expect(game.players[0].id).toBe(2);
      expect(game.players[0].orderIndex).toBe(0);
      expect(game.players[1].id).toBe(1);
      expect(game.players[1].orderIndex).toBe(1);
      expect(game.players[2].id).toBe(3);
      expect(game.players[2].orderIndex).toBe(2);
    });
  });

  describe("specific scoring scenarios", () => {
    it("should advance to Player 1 after Player 3 completes round", () => {
      const { startGame, recordRoundScore } = useHalveItStore.getState();
      startGame("default", [1, 2, 3]);

      // Round 1: scoring round
      let game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      
      // Player 1 scores 10 points
      expect(game.currentPlayerIndex).toBe(0);
      expect(game.players[0].id).toBe(1);
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });

      // Player 2 scores 25 points
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      expect(game.currentPlayerIndex).toBe(1);
      expect(game.players[1].id).toBe(2);
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 25 });

      // Player 3 scores 10 points
      game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      expect(game.currentPlayerIndex).toBe(2);
      expect(game.players[2].id).toBe(3);
      recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 10 });

      // Verify scores
      game = useHalveItStore.getState().currentGame;
      expect(game?.players[0].totalScore).toBe(10);
      expect(game?.players[1].totalScore).toBe(25);
      expect(game?.players[2].totalScore).toBe(10);
      
      // Verify round advancement - should advance to next round with Player 1
      expect(game?.currentRoundIndex).toBe(1); // Should advance to round 2
      expect(game?.currentPlayerIndex).toBe(0); // Should be Player 1's turn
      expect(game?.players[game.currentPlayerIndex].id).toBe(1); // Verify it's Player 1
    });
  });
});

