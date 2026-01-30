import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WarmupTarget {
  number: number | "Bull";
  zone?: "T" | "D" | "S"; // Triple, Double, or Single (only for numbers, not Bull)
  order: number;
}

export interface WarmupConfig {
  id: string;
  name: string;
  targets: WarmupTarget[];
  dartCount: number;
}

export interface WarmupRound {
  roundNumber: number;
  target: number | "Bull";
  hits: number;
  attempts: number;
}

export interface WarmupPlayer {
  id: number;
  name: string;
  rounds: WarmupRound[];
  totalHits: number;
  totalAttempts: number;
  hitPercentage: number;
}

interface WarmupGameState {
  dartCount: number;
  targets: WarmupTarget[];
  players: WarmupPlayer[];
  currentPlayerIndex: number;
  currentRoundIndex: number;
  currentTargetIndex: number;
  isGameFinished: boolean;
  currentHits: number; // Hits in current round (0-3)
  currentAttempts: number; // Attempts in current round (0-3)
  lastScore?: {
    playerId: number;
    roundIndex: number;
  };
}

interface WarmupStoreState {
  currentGame: WarmupGameState | null;
  savedConfigs: WarmupConfig[];
  startGame: (
    dartCount: number,
    targets: WarmupTarget[],
    playerIds: number[],
    players?: Array<{ id: number; name: string }>
  ) => void;
  recordHit: (isHit: boolean) => void;
  undoLastScore: () => void;
  endGame: () => void;
  saveConfig: (config: Omit<WarmupConfig, "id">) => void;
  deleteConfig: (configId: string) => void;
  getPlayers: () => Array<{ id: number; name: string }>;
  setPlayers: (players: Array<{ id: number; name: string }>) => void;
}

let cachedPlayers: Array<{ id: number; name: string }> = [];

export const useWarmupStore = create<WarmupStoreState>()(
  persist(
    (set, get) => ({
      currentGame: null,
      savedConfigs: [],

      startGame: (dartCount, targets, playerIds, players) => {
        const sortedTargets = [...targets].sort((a, b) => a.order - b.order);
        const totalRounds = Math.ceil(dartCount / 3);
        
        // Use provided players or fall back to cached players
        const playerSource = players || cachedPlayers;
        
        const warmupPlayers: WarmupPlayer[] = playerIds
          .map((playerId) => {
            const player = playerSource.find((p) => p.id === playerId);
            if (!player) {
              console.error(`Player with ID ${playerId} not found`);
              return null;
            }
            return {
              id: player.id,
              name: player.name,
              rounds: [],
              totalHits: 0,
              totalAttempts: 0,
              hitPercentage: 0,
            };
          })
          .filter((p): p is WarmupPlayer => p !== null);

        if (warmupPlayers.length === 0) {
          console.error("No players found for the selected IDs", {
            playerIds,
            cachedPlayers,
            providedPlayers: players,
          });
          return;
        }

        const newGameState = {
          dartCount,
          targets: sortedTargets,
          players: warmupPlayers,
          currentPlayerIndex: 0,
          currentRoundIndex: 0,
          currentTargetIndex: 0,
          isGameFinished: false,
          currentHits: 0,
          currentAttempts: 0,
          lastScore: undefined,
        };

        console.log("Setting warmup game state", newGameState);
        
        set({
          currentGame: newGameState,
        });
        
        // Verify state was set
        const verifyState = get();
        if (!verifyState.currentGame) {
          console.error("Failed to set game state");
        } else {
          console.log("Game state set successfully", verifyState.currentGame);
        }
      },

      recordHit: (isHit: boolean) => {
        set((state) => {
          if (!state.currentGame || state.currentGame.isGameFinished) return state;

          const game = state.currentGame;
          const currentPlayer = game.players[game.currentPlayerIndex];
          if (!currentPlayer) return state;

          const currentTarget = game.targets[game.currentTargetIndex];
          if (!currentTarget) return state;

          // Increment attempts immediately
          const newAttempts = game.currentAttempts + 1;
          
          // Update hits immediately if it's a hit
          const newHits = isHit ? game.currentHits + 1 : game.currentHits;

          // Immediately update player's total stats (for display)
          const updatedPlayerForStats: WarmupPlayer = {
            ...currentPlayer,
            totalHits: currentPlayer.totalHits + (isHit ? 1 : 0),
            totalAttempts: currentPlayer.totalAttempts + 1,
            hitPercentage:
              currentPlayer.totalAttempts + 1 > 0
                ? ((currentPlayer.totalHits + (isHit ? 1 : 0)) / (currentPlayer.totalAttempts + 1)) * 100
                : 0,
          };

          // Check if we've completed 3 attempts for this round
          if (newAttempts >= 3) {
            // Create or update round
            const roundNumber = game.currentRoundIndex + 1;
            const existingRoundIndex = currentPlayer.rounds.findIndex(
              (r) => r.roundNumber === roundNumber
            );

            const round: WarmupRound = {
              roundNumber,
              target: currentTarget.number,
              hits: newHits,
              attempts: 3,
            };

            const updatedRounds = [...currentPlayer.rounds];
            if (existingRoundIndex >= 0) {
              updatedRounds[existingRoundIndex] = round;
            } else {
              updatedRounds.push(round);
            }

            // Update player stats from rounds (but keep the immediate stats we already calculated)
            const updatedPlayer: WarmupPlayer = {
              ...updatedPlayerForStats,
              rounds: updatedRounds,
            };

            // Update players array
            const updatedPlayers = game.players.map((p) =>
              p.id === currentPlayer.id ? updatedPlayer : p
            );

            // Track last score for undo
            const lastScore = {
              playerId: currentPlayer.id,
              roundIndex: game.currentRoundIndex,
            };

            // Move to next player (after 3 attempts)
            // All players complete one round each before moving to the next round
            let newTargetIndex = game.currentTargetIndex;
            let newRoundIndex = game.currentRoundIndex;
            let newPlayerIndex = (game.currentPlayerIndex + 1) % updatedPlayers.length;
            let isGameFinished = false;

            const totalRounds = Math.ceil(game.dartCount / 3);
            
            // If we've cycled through all players, move to next round
            if (newPlayerIndex === 0) {
              newRoundIndex = game.currentRoundIndex + 1;
              
              // Check if all rounds are complete
              if (newRoundIndex >= totalRounds) {
                // Check if all players have completed all rounds
                const allRoundsComplete = updatedPlayers.every(
                  (p) => p.rounds.length >= totalRounds
                );
                if (allRoundsComplete) {
                  isGameFinished = true;
                } else {
                  // Game should be finished, but if not, keep at last round
                  newRoundIndex = totalRounds - 1;
                }
              }
            }

            // Cycle through targets as rounds progress
            newTargetIndex = newRoundIndex % game.targets.length;

            return {
              currentGame: {
                ...game,
                players: updatedPlayers,
                currentPlayerIndex: newPlayerIndex,
                currentRoundIndex: newRoundIndex,
                currentTargetIndex: newTargetIndex,
                currentHits: 0,
                currentAttempts: 0,
                lastScore,
                isGameFinished,
              },
            };
          } else {
            // Still in the same round, update hits and player stats immediately
            const updatedPlayers = game.players.map((p) =>
              p.id === currentPlayer.id ? updatedPlayerForStats : p
            );

            return {
              currentGame: {
                ...game,
                players: updatedPlayers,
                currentHits: newHits,
                currentAttempts: newAttempts,
              },
            };
          }
        });
      },

      undoLastScore: () => {
        set((state) => {
          if (!state.currentGame?.lastScore) return state;

          const game = state.currentGame;
          const lastScore = game.lastScore;
          if (!lastScore) return state;

          const { playerId, roundIndex } = lastScore;
          const player = game.players.find((p) => p.id === playerId);
          if (!player) return state;

          // Remove the last round
          const updatedRounds = player.rounds.filter(
            (r) => r.roundNumber !== roundIndex + 1
          );

          // Recalculate stats
          const totalHits = updatedRounds.reduce((sum, r) => sum + r.hits, 0);
          const totalAttempts = updatedRounds.reduce(
            (sum, r) => sum + r.attempts,
            0
          );
          const hitPercentage =
            totalAttempts > 0 ? (totalHits / totalAttempts) * 100 : 0;

          const updatedPlayer: WarmupPlayer = {
            ...player,
            rounds: updatedRounds,
            totalHits,
            totalAttempts,
            hitPercentage,
          };

          const updatedPlayers = game.players.map((p) =>
            p.id === playerId ? updatedPlayer : p
          );

          // Find previous score for lastScore tracking
          let previousScore: { playerId: number; roundIndex: number } | undefined;
          for (let r = roundIndex; r >= 0; r--) {
            const searchRound = updatedPlayer.rounds.find(
              (round) => round.roundNumber === r + 1
            );
            if (searchRound) {
              previousScore = {
                playerId: playerId,
                roundIndex: r,
              };
              break;
            }
          }

          // Reset to the round we're undoing
          return {
            currentGame: {
              ...game,
              players: updatedPlayers,
              currentPlayerIndex: game.players.findIndex((p) => p.id === playerId),
              currentRoundIndex: roundIndex,
              currentTargetIndex: 0,
              currentHits: 0,
              currentAttempts: 0,
              lastScore: previousScore,
              isGameFinished: false,
            },
          };
        });
      },

      endGame: () => {
        set({ currentGame: null });
      },

      saveConfig: (config) => {
        const newConfig: WarmupConfig = {
          ...config,
          id: Date.now().toString(),
        };
        set((state) => ({
          savedConfigs: [...state.savedConfigs, newConfig],
        }));
      },

      deleteConfig: (configId) => {
        set((state) => ({
          savedConfigs: state.savedConfigs.filter((c) => c.id !== configId),
        }));
      },

      getPlayers: () => cachedPlayers,
      setPlayers: (players) => {
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-warmup-storage",
      version: 1,
      partialize: (state) => ({
        savedConfigs: state.savedConfigs,
        currentGame: state.currentGame,
      }),
    }
  )
);
