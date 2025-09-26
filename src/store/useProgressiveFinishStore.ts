import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces
export interface ProgressiveFinishPlayer {
  id: number;
  name: string;
  currentScore: number;
  dartsThrown: number;
  levelsCompleted: number;
  totalDartsUsed: number;
  scores: { score: number; darts: number; level: number }[];
  avgPerDart: number;
  avgPerLevel: number;
}

export interface ProgressiveFinishGameState {
  players: ProgressiveFinishPlayer[];
  currentPlayerIndex: number;
  currentLevel: number;
  targetScore: number;
  remainingScore: number; // How much is left to reach the target
  dartLimit: number;
  remainingDarts: number; // How many darts left for current target
  isGameFinished: boolean;
  inputMode: "numeric" | "dart";
  gameStartTime: number;
  highestLevelReached: number;
  failures: number;
  maxFailures: number;
}

export interface ProgressiveFinishSettings {
  startingScore: number;
  maxFailures: number;
  dartLimit: number;
  dartLimitIncrease: number;
  dartLimitThreshold: number;
}

interface ProgressiveFinishStoreState {
  // Game settings
  gameSettings: ProgressiveFinishSettings;
  updateGameSettings: (settings: Partial<ProgressiveFinishSettings>) => void;

  // Current game state
  currentGame: ProgressiveFinishGameState | null;
  startGame: (playerIds: number[], startingPlayerIndex?: number) => void;
  recordScore: (
    score: number,
    dartsUsed: number
  ) => void;
  undoLastScore: () => void;
  endGame: () => void;
  setInputMode: (mode: "numeric" | "dart") => void;
  getPlayers: () => ProgressiveFinishPlayer[];
  setPlayers: (players: ProgressiveFinishPlayer[]) => void;
}

// Reference to main store players to avoid circular dependencies
let cachedPlayers: { id: number; name: string }[] = [];

// Calculate a player's game statistics
function calculatePlayerAverages(player: ProgressiveFinishPlayer): {
  avgPerDart: number;
  avgPerLevel: number;
} {
  if (player.dartsThrown === 0) {
    return { avgPerDart: 0, avgPerLevel: 0 };
  }

  // Calculate total points scored in this game
  const totalScored = player.scores.reduce(
    (total, score) => total + score.score,
    0
  );

  // Average per dart for this game
  const avgPerDart = totalScored / player.dartsThrown;

  // Calculate levels - each level is one target score
  const avgPerLevel =
    player.levelsCompleted > 0 ? totalScored / player.levelsCompleted : 0;

  return { avgPerDart, avgPerLevel };
}

// Create the Progressive Finish store with persistence
export const useProgressiveFinishStore = create<ProgressiveFinishStoreState>()(
  persist(
    (set) => ({
      gameSettings: {
        startingScore: 40,
        maxFailures: 3,
        dartLimit: 6,
        dartLimitIncrease: 3,
        dartLimitThreshold: 100,
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (playerIds, startingPlayerIndex = 0) => {
        set((state) => {
          // Find the selected players from the cached players
          const selectedPlayers = cachedPlayers.filter((player) =>
            playerIds.includes(player.id)
          );

          // Create game players with the necessary in-game properties
          const gamePlayers: ProgressiveFinishPlayer[] = selectedPlayers.map(
            (player) => ({
              id: player.id,
              name: player.name,
              currentScore: state.gameSettings.startingScore,
              dartsThrown: 0,
              levelsCompleted: 0,
              totalDartsUsed: 0,
              scores: [],
              avgPerDart: 0,
              avgPerLevel: 0,
            })
          );

          const newGame: ProgressiveFinishGameState = {
            players: gamePlayers,
            currentPlayerIndex: startingPlayerIndex,
            currentLevel: 1,
            targetScore: state.gameSettings.startingScore,
            remainingScore: state.gameSettings.startingScore,
            dartLimit: state.gameSettings.dartLimit,
            remainingDarts: state.gameSettings.dartLimit,
            isGameFinished: false,
            inputMode: "numeric",
            gameStartTime: Date.now(),
            highestLevelReached: 0,
            failures: 0,
            maxFailures: state.gameSettings.maxFailures,
          };

          return { currentGame: newGame };
        });
      },

      setInputMode: (mode) => {
        set((state) => {
          if (!state.currentGame) return state;
          return {
            currentGame: {
              ...state.currentGame,
              inputMode: mode,
            },
          };
        });
      },

      recordScore: (score, dartsUsed) => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };
          const players = [...newGame.players];
          const currentPlayer = { ...players[newGame.currentPlayerIndex] };

          // Determine actual darts used based on input mode
          // Voice, numeric, and dart input all use 3 darts
          const actualDartsUsed = dartsUsed;

          // Record the player's contribution
          currentPlayer.dartsThrown += actualDartsUsed;
          currentPlayer.scores = [
            ...currentPlayer.scores,
            { score, darts: actualDartsUsed, level: newGame.currentLevel },
          ];

          // Update averages
          const averages = calculatePlayerAverages(currentPlayer);
          currentPlayer.avgPerDart = averages.avgPerDart;
          currentPlayer.avgPerLevel = averages.avgPerLevel;

          // Update the player in the array
          players[newGame.currentPlayerIndex] = currentPlayer;

          // Reduce remaining darts for this target
          newGame.remainingDarts -= actualDartsUsed;

          // Check if darts have run out (failure condition)
          if (newGame.remainingDarts <= 0) {
            // Out of darts - this is a failure
            newGame.failures += 1;

            // Check if game should end due to too many failures
            if (newGame.failures >= newGame.maxFailures) {
              newGame.isGameFinished = true;
            } else {
              // Go back to start (level 1) but with target score reduced by 1
              newGame.currentLevel = 1;
              newGame.targetScore = Math.max(1, newGame.targetScore - 1);
              newGame.remainingScore = newGame.targetScore;
              // Reset remaining darts for new target
              newGame.remainingDarts = newGame.dartLimit;
            }
          }
          // Check if the player's score contributes to reaching the target
          else if (score <= newGame.remainingScore) {
            // Player's score is valid and contributes to the target
            newGame.remainingScore -= score;

            // Check if the team has successfully completed the level
            if (newGame.remainingScore === 0) {
              // Team successfully completed the level
              // All players get credit for the level completion
              players.forEach((player) => {
                player.levelsCompleted += 1;
                player.totalDartsUsed += actualDartsUsed; // Add actual darts used for completion
              });

              // Move to next level
              newGame.currentLevel += 1;
              newGame.targetScore += 10; // Increase target by 10
              newGame.remainingScore = newGame.targetScore; // Reset remaining score
              newGame.highestLevelReached = Math.max(
                newGame.highestLevelReached,
                newGame.currentLevel - 1
              );

              // Check if dart limit should increase
              if (
                newGame.targetScore >= state.gameSettings.dartLimitThreshold
              ) {
                newGame.dartLimit =
                  state.gameSettings.dartLimit +
                  state.gameSettings.dartLimitIncrease;
              }

              // Reset remaining darts for new target
              newGame.remainingDarts = newGame.dartLimit;

              // Reset failures on success
              newGame.failures = 0;
            }
          } else {
            // Player's score exceeds what's needed - this is a failure
            newGame.failures += 1;

            // Check if game should end due to too many failures
            if (newGame.failures >= newGame.maxFailures) {
              newGame.isGameFinished = true;
            } else {
              // Go back to start (level 1) but with target score reduced by 1
              newGame.currentLevel = 1;
              newGame.targetScore = Math.max(1, newGame.targetScore - 1);
              newGame.remainingScore = newGame.targetScore;
              // Reset remaining darts for new target
              newGame.remainingDarts = newGame.dartLimit;
            }
          }

          // Move to next player
          newGame.currentPlayerIndex =
            (newGame.currentPlayerIndex + 1) % players.length;

          // Update the game
          newGame.players = players;

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      undoLastScore: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };
          const players = [...newGame.players];

          // Calculate previous player index
          const prevPlayerIndex =
            newGame.currentPlayerIndex === 0
              ? players.length - 1
              : newGame.currentPlayerIndex - 1;

          const player = { ...players[prevPlayerIndex] };

          // Check if there are scores to undo
          if (player.scores.length === 0) return state;

          // Get the last score
          const lastScore = player.scores[player.scores.length - 1];

          // Update player
          player.dartsThrown -= lastScore.darts;
          player.scores = player.scores.slice(0, -1);

          // Recalculate averages
          const averages = calculatePlayerAverages(player);
          player.avgPerDart = averages.avgPerDart;
          player.avgPerLevel = averages.avgPerLevel;

          // Update the player in the array
          players[prevPlayerIndex] = player;

          // Update the game
          newGame.players = players;
          newGame.currentPlayerIndex = prevPlayerIndex;
          newGame.isGameFinished = false; // Reset game finished status

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      endGame: () => {
        set((state) => {
          if (!state.currentGame) return state;

          return {
            ...state,
            currentGame: null,
          };
        });
      },

      getPlayers: () => {
        return cachedPlayers.map((player) => ({
          id: player.id,
          name: player.name,
          currentScore: 0,
          dartsThrown: 0,
          levelsCompleted: 0,
          totalDartsUsed: 0,
          scores: [],
          avgPerDart: 0,
          avgPerLevel: 0,
        }));
      },

      setPlayers: (players) => {
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-progressive-finish-storage",
      version: 1,
      partialize: (state) => ({
        gameSettings: state.gameSettings,
        currentGame: state.currentGame,
      }),
    }
  )
);
