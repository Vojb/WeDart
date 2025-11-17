import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HalveItMode = "default" | "41";

export type RoundType = "scoring" | "number" | "double" | "treble" | "bull" | "target-score";

export interface HalveItRound {
  roundNumber: number;
  roundType: RoundType;
  target?: number | string;
  playerScores: Record<number, {
    hits?: number;
    points?: number;
    totalScore?: number;
    score: number;
  }>;
}

export interface HalveItPlayer {
  id: number;
  name: string;
  totalScore: number;
  rounds: HalveItRound[];
  orderIndex: number;
}

interface HalveItGameState {
  mode: HalveItMode;
  players: HalveItPlayer[];
  currentPlayerIndex: number;
  currentRoundIndex: number;
  isGameFinished: boolean;
  rounds: HalveItRound[];
  lastScore?: {
    playerId: number;
    roundIndex: number;
  };
}

interface HalveItStoreState {
  currentGame: HalveItGameState | null;
  startGame: (mode: HalveItMode, playerIds: number[]) => void;
  recordRoundScore: (playerId: number, roundIndex: number, data: {
    hits?: number;
    points?: number;
    totalScore?: number;
  }) => void;
  finishTurn: () => void;
  undoLastScore: () => void;
  endGame: () => void;
  setHalveItPlayers: (players: { id: number; name: string }[]) => void;
}

let cachedPlayers: { id: number; name: string }[] = [];

export const updateCachedHalveItPlayers = (players: { id: number; name: string }[]) => {
  cachedPlayers = [...players];
};

const DEFAULT_ROUNDS: Array<{ type: RoundType; target?: number | string }> = [
  { type: "scoring" },
  { type: "number", target: 15 },
  { type: "number", target: 16 },
  { type: "double" },
  { type: "number", target: 17 },
  { type: "number", target: 18 },
  { type: "treble" },
  { type: "number", target: 19 },
  { type: "number", target: 20 },
  { type: "bull", target: "Bull" },
];

const ROUNDS_41: Array<{ type: RoundType; target?: number | string }> = [
  { type: "number", target: 19 },
  { type: "number", target: 18 },
  { type: "double" },
  { type: "number", target: 17 },
  { type: "target-score", target: 41 },
  { type: "treble" },
  { type: "number", target: 20 },
  { type: "bull", target: "Bull" },
];

/**
 * Calculate score for a round based on round type and input data
 */
function calculateRoundScore(
  roundType: RoundType,
  target: number | string | undefined,
  currentTotalScore: number,
  data: { hits?: number; points?: number; totalScore?: number }
): number {
  if (roundType === "number" || roundType === "bull") {
    const hits = data.hits || 0;
    if (hits === 0) {
      return Math.floor(currentTotalScore / 2);
    }
    const targetValue = typeof target === "number" 
      ? target 
      : target === "Bull" 
      ? 25 
      : 0;
    return currentTotalScore + (hits * targetValue);
  }
  
  if (roundType === "scoring" || roundType === "double" || roundType === "treble") {
    const points = data.points || 0;
    if (points === 0) {
      return Math.floor(currentTotalScore / 2);
    }
    return currentTotalScore + points;
  }
  
  if (roundType === "target-score") {
    const totalScore = data.totalScore || 0;
    if (totalScore === 41) {
      return currentTotalScore + 41;
    }
    return Math.floor(currentTotalScore / 2);
  }
  
  return currentTotalScore;
}

/**
 * Get player's total score up to (but not including) a specific round
 * The score.score field already contains the cumulative total up to that round
 */
function getPlayerTotalScoreUpToRound(
  rounds: HalveItRound[],
  playerId: number,
  roundIndex: number
): number {
  if (roundIndex === 0) return 0;
  
  // Find the last round before roundIndex where the player has a score
  // The score.score field contains the cumulative total
  for (let i = roundIndex - 1; i >= 0; i--) {
    const round = rounds[i];
    const score = round.playerScores[playerId];
    if (score) {
      return score.score;
    }
  }
  return 0;
}

/**
 * Ensure players array is sorted by orderIndex
 */
function sortPlayersByOrderIndex(players: HalveItPlayer[]): HalveItPlayer[] {
  return [...players].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.id - b.id;
  });
}

export const useHalveItStore = create<HalveItStoreState>()(
  persist(
    (set) => ({
      currentGame: null,

      startGame: (mode, playerIds) => {
        const rounds = mode === "default" ? DEFAULT_ROUNDS : ROUNDS_41;
        
        const halveItPlayers: HalveItPlayer[] = playerIds
          .map((playerId, index): HalveItPlayer | null => {
            const player = cachedPlayers.find((p) => p.id === playerId);
            if (!player) {
              console.error(`Player with ID ${playerId} not found`);
              return null;
            }
            return {
              id: player.id,
              name: player.name,
              totalScore: 0,
              rounds: [],
              orderIndex: index,
            };
          })
          .filter((p): p is HalveItPlayer => p !== null);

        if (halveItPlayers.length === 0) {
          console.error("No players found for the selected IDs");
          return;
        }

        const gameRounds: HalveItRound[] = rounds.map((round, index) => ({
          roundNumber: index + 1,
          roundType: round.type,
          target: round.target,
          playerScores: {},
        }));

        set({
          currentGame: {
            mode,
            players: halveItPlayers,
            currentPlayerIndex: 0,
            currentRoundIndex: 0,
            isGameFinished: false,
            rounds: gameRounds,
            lastScore: undefined,
          },
        });
      },

      recordRoundScore: (playerId, roundIndex, data) => {
        set((state) => {
          if (!state.currentGame) return state;

          const game = state.currentGame;
          
          // Sort players first to ensure consistent order
          const sortedPlayers = sortPlayersByOrderIndex(game.players);
          
          // Use the passed playerId to find the current player
          // This ensures we're recording the score for the correct player
          const currentPlayer = sortedPlayers.find(p => p.id === playerId);
          if (!currentPlayer) return state;
          
          // Find the index of current player in sorted array
          const currentPlayerIndexInSorted = sortedPlayers.findIndex(p => p.id === playerId);
          if (currentPlayerIndexInSorted === -1) return state;
          
          // Use the passed roundIndex to get the current round
          const currentRound = game.rounds[roundIndex];
          if (!currentRound) return state;

          // Calculate current total score from previous rounds
          const currentTotalScore = getPlayerTotalScoreUpToRound(
            game.rounds,
            currentPlayer.id,
            roundIndex
          );

          // Calculate new score for this round
          const roundScore = calculateRoundScore(
            currentRound.roundType,
            currentRound.target,
            currentTotalScore,
            data
          );

          // Update round with player's score
          const updatedRound: HalveItRound = {
            ...currentRound,
            playerScores: {
              ...currentRound.playerScores,
              [currentPlayer.id]: {
                ...data,
                score: roundScore,
              },
            },
          };

          // Update rounds array
          const updatedRounds = [...game.rounds];
          updatedRounds[roundIndex] = updatedRound;

          // Update player's total score and rounds
          const updatedPlayer: HalveItPlayer = {
            ...currentPlayer,
            totalScore: roundScore,
            rounds: [...currentPlayer.rounds, updatedRound],
          };

          // Update players array - update the player in the sorted array
          const updatedPlayers = sortedPlayers.map(p => 
            p.id === currentPlayer.id ? updatedPlayer : p
          );
          
          // Players are already sorted, but sort again to ensure consistency
          let finalPlayers = sortPlayersByOrderIndex(updatedPlayers);

          // Find current player index in the sorted array (should be same as before)
          const currentPlayerIndexAfterSort = finalPlayers.findIndex(p => p.id === currentPlayer.id);
          if (currentPlayerIndexAfterSort === -1) return state;

          // Track last score for undo
          const lastScore = {
            playerId: currentPlayer.id,
            roundIndex: roundIndex,
          };

          // Check if game is finished
          const allRoundsComplete = updatedRounds.every(round =>
            finalPlayers.every(player => round.playerScores[player.id] !== undefined)
          );

          let newCurrentPlayerIndex: number;
          let newCurrentRoundIndex: number;
          let isGameFinished = false;

          if (allRoundsComplete) {
            isGameFinished = true;
            newCurrentPlayerIndex = currentPlayerIndexAfterSort;
            newCurrentRoundIndex = roundIndex;
          } else {
            // Calculate next player index in sorted array
            const nextPlayerIndex = (currentPlayerIndexAfterSort + 1) % finalPlayers.length;
            
            if (nextPlayerIndex === 0) {
              // Wrapped around - move to next round
              const nextRoundIndex = roundIndex + 1;
              
              if (nextRoundIndex >= updatedRounds.length) {
                isGameFinished = true;
                // Find player with orderIndex 0 to ensure correct first player
                const firstPlayerIndex = finalPlayers.findIndex(p => p.orderIndex === 0);
                newCurrentPlayerIndex = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
                newCurrentRoundIndex = updatedRounds.length - 1;
              } else {
                newCurrentRoundIndex = nextRoundIndex;
                // Find player with orderIndex 0 to ensure correct first player for new round
                const firstPlayerIndex = finalPlayers.findIndex(p => p.orderIndex === 0);
                newCurrentPlayerIndex = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
              }
            } else {
              // Same round, next player
              newCurrentRoundIndex = roundIndex;
              newCurrentPlayerIndex = nextPlayerIndex;
            }
          }

          return {
            currentGame: {
              ...game,
              players: finalPlayers,
              rounds: updatedRounds,
              currentPlayerIndex: newCurrentPlayerIndex,
              currentRoundIndex: newCurrentRoundIndex,
              isGameFinished,
              lastScore,
            },
          };
        });
      },

      finishTurn: () => {
        // This function is kept for compatibility but player advancement
        // now happens automatically in recordRoundScore
        set((state) => state);
      },

      undoLastScore: () => {
        set((state) => {
          if (!state.currentGame?.lastScore) return state;

          const game = state.currentGame;
          const lastScore = game.lastScore;
          if (!lastScore) return state;
          const { playerId, roundIndex } = lastScore;

          // Find player
          const playerIndex = game.players.findIndex(p => p.id === playerId);
          if (playerIndex === -1) return state;

          const player = game.players[playerIndex];
          const round = game.rounds[roundIndex];
          
          if (!round?.playerScores[playerId]) return state;

          // Remove score from round
          const updatedRound: HalveItRound = {
            ...round,
            playerScores: { ...round.playerScores },
          };
          delete updatedRound.playerScores[playerId];

          const updatedRounds = [...game.rounds];
          updatedRounds[roundIndex] = updatedRound;

          // Recalculate player's total score
          const recalculatedScore = getPlayerTotalScoreUpToRound(updatedRounds, playerId, roundIndex);

          // Recalculate all subsequent rounds for this player
          let accumulatedScore = recalculatedScore;
          for (let i = roundIndex + 1; i < updatedRounds.length; i++) {
            const subsequentRound = updatedRounds[i];
            const subsequentScore = subsequentRound.playerScores[playerId];
            
            if (subsequentScore) {
              const newRoundScore = calculateRoundScore(
                subsequentRound.roundType,
                subsequentRound.target,
                accumulatedScore,
                subsequentScore
              );

              updatedRounds[i] = {
                ...subsequentRound,
                playerScores: {
                  ...subsequentRound.playerScores,
                  [playerId]: {
                    ...subsequentScore,
                    score: newRoundScore,
                  },
                },
              };

              accumulatedScore = newRoundScore;
            }
          }

          // Update player
          const updatedPlayer: HalveItPlayer = {
            ...player,
            totalScore: accumulatedScore,
            rounds: player.rounds.filter(r => r.roundNumber !== round.roundNumber),
          };

          const updatedPlayers = game.players.map(p => 
            p.id === playerId ? updatedPlayer : p
          );
          // Always sort players by orderIndex to ensure consistent order
          const finalPlayers = sortPlayersByOrderIndex(updatedPlayers);

          // Find previous score for lastScore tracking
          let previousScore: { playerId: number; roundIndex: number } | undefined;
          for (let r = roundIndex; r >= 0; r--) {
            const searchRound = updatedRounds[r];
            // Find player index in sorted array
            const playerIndexInSorted = finalPlayers.findIndex(p => p.id === playerId);
            const startPlayerIndex = r === roundIndex ? playerIndexInSorted - 1 : finalPlayers.length - 1;
            
            for (let p = startPlayerIndex; p >= 0; p--) {
              const searchPlayer = finalPlayers[p];
              if (searchRound.playerScores[searchPlayer.id]) {
                previousScore = {
                  playerId: searchPlayer.id,
                  roundIndex: r,
                };
                break;
              }
            }
            if (previousScore) break;
          }

          // Find player index in sorted array
          const updatedPlayerIndex = finalPlayers.findIndex(p => p.id === playerId);
          const newCurrentPlayerIndex = updatedPlayerIndex >= 0 ? updatedPlayerIndex : 0;

          return {
            currentGame: {
              ...game,
              players: finalPlayers,
              rounds: updatedRounds,
              currentPlayerIndex: newCurrentPlayerIndex,
              currentRoundIndex: roundIndex,
              isGameFinished: false,
              lastScore: previousScore,
            },
          };
        });
      },

      endGame: () => {
        set({ currentGame: null });
      },

      setHalveItPlayers: (players) => {
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-halveit-storage",
      version: 1,
    }
  )
);

