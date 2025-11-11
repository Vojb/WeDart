import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HalveItMode = "default" | "41";

export type RoundType = "scoring" | "number" | "double" | "treble" | "bull" | "target-score";

export interface HalveItRound {
  roundNumber: number;
  roundType: RoundType;
  target?: number | string; // For number rounds: 15-20, for bull: "Bull", for target-score: 41
  playerScores: Record<number, {
    hits?: number; // For number rounds: 0-9 hits
    points?: number; // For scoring/double/treble rounds: points scored
    totalScore?: number; // For target-score round: total of 3 darts
    score: number; // Final score for this round (after halving if needed)
  }>;
}

export interface HalveItPlayer {
  id: number;
  name: string;
  totalScore: number;
  rounds: HalveItRound[];
  orderIndex: number; // Preserve original order
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

// Reference to main store players
let cachedPlayers: { id: number; name: string }[] = [];

export const updateCachedHalveItPlayers = (
  players: { id: number; name: string }[]
) => {
  cachedPlayers = [...players];
};

// Define round sequences
const DEFAULT_ROUNDS: Array<{ type: RoundType; target?: number | string }> = [
  { type: "scoring", target: undefined },
  { type: "number", target: 15 },
  { type: "number", target: 16 },
  { type: "double", target: undefined },
  { type: "number", target: 17 },
  { type: "number", target: 18 },
  { type: "treble", target: undefined },
  { type: "number", target: 19 },
  { type: "number", target: 20 },
  { type: "bull", target: "Bull" },
];

const ROUNDS_41: Array<{ type: RoundType; target?: number | string }> = [
  { type: "number", target: 19 },
  { type: "number", target: 18 },
  { type: "double", target: undefined },
  { type: "number", target: 17 },
  { type: "target-score", target: 41 },
  { type: "treble", target: undefined },
  { type: "number", target: 20 },
  { type: "bull", target: "Bull" },
];

export const useHalveItStore = create<HalveItStoreState>()(
  persist(
    (set, get) => ({
      currentGame: null,
      
      startGame: (mode, playerIds) => {
        const rounds = mode === "default" ? DEFAULT_ROUNDS : ROUNDS_41;
        
        // CRITICAL: Maintain player order based on playerIds array order, not cachedPlayers order
        // This ensures players are displayed in the order they were selected, not sorted by score
        const halveItPlayers: HalveItPlayer[] = playerIds.map((playerId, index) => {
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
            orderIndex: index, // Preserve original order
          };
        }).filter((p): p is HalveItPlayer => p !== null);

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

          const newGame = { ...state.currentGame };
          
          // Always use the current player and round from the store state to ensure correctness
          const actualPlayerIndex = newGame.currentPlayerIndex;
          const actualRoundIndex = newGame.currentRoundIndex;
          const actualPlayer = newGame.players[actualPlayerIndex];
          
          if (!actualPlayer) return state;
          
          // Use the actual current player and round from store state
          const usePlayerId = actualPlayer.id;
          const useRoundIndex = actualRoundIndex;
          
          const players = [...newGame.players];
          const playerIndex = actualPlayerIndex;
          
          if (playerIndex === -1 || playerIndex >= players.length) return state;

          const currentPlayer = { ...players[playerIndex] };
          const currentRound = newGame.rounds[useRoundIndex];
          
          if (!currentRound) return state;

          // Calculate current total score from all previous rounds
          let currentTotalScore = 0;
          for (let i = 0; i < useRoundIndex; i++) {
            const prevRound = newGame.rounds[i];
            const prevScore = prevRound.playerScores[usePlayerId];
            if (prevScore) {
              currentTotalScore = prevScore.score;
            }
          }

          // Calculate score based on round type
          let roundScore = 0;
          const roundType = currentRound.roundType;

          if (roundType === "number" || roundType === "bull") {
            // For number/bull rounds: score = hits * target value
            const hits = data.hits || 0;
            if (hits === 0) {
              // No hits = halve score
              roundScore = Math.floor(currentTotalScore / 2);
            } else {
              const targetValue = typeof currentRound.target === "number" 
                ? currentRound.target 
                : currentRound.target === "Bull" 
                ? 25 
                : 0;
              roundScore = currentTotalScore + (hits * targetValue);
            }
          } else if (roundType === "scoring" || roundType === "double" || roundType === "treble") {
            // For scoring/double/treble rounds: score = points entered
            const points = data.points || 0;
            if (points === 0) {
              // No points = halve score
              roundScore = Math.floor(currentTotalScore / 2);
            } else {
              roundScore = currentTotalScore + points;
            }
          } else if (roundType === "target-score") {
            // For target-score round: must total exactly 41, otherwise halve
            const totalScore = data.totalScore || 0;
            if (totalScore === 41) {
              // Exact match: add 41 points
              roundScore = currentTotalScore + 41;
            } else {
              // Not exact: halve score
              roundScore = Math.floor(currentTotalScore / 2);
            }
          }

          // Update round score
          const updatedRound = {
            ...currentRound,
            playerScores: {
              ...currentRound.playerScores,
              [usePlayerId]: {
                ...data,
                score: roundScore,
              },
            },
          };

          newGame.rounds[useRoundIndex] = updatedRound;

          // Update player's total score
          currentPlayer.totalScore = roundScore;
          currentPlayer.rounds = [...currentPlayer.rounds, updatedRound];
          // Preserve orderIndex when updating player
          players[playerIndex] = {
            ...currentPlayer,
            orderIndex: currentPlayer.orderIndex, // Ensure orderIndex is preserved
          };
          
          // CRITICAL: Ensure players array maintains original order - never reorder based on score
          // The players array order must remain constant throughout the game
          newGame.players = players;

          // Track last score for undo functionality
          newGame.lastScore = {
            playerId: usePlayerId,
            roundIndex: useRoundIndex,
          };

          // Check if game is finished (all rounds completed by all players)
          const allRoundsComplete = newGame.rounds.every((round) =>
            newGame.players.every((player) => round.playerScores[player.id] !== undefined)
          );

          if (allRoundsComplete) {
            newGame.isGameFinished = true;
          }

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      finishTurn: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };
          const currentPlayerIndex = newGame.currentPlayerIndex;
          const currentRoundIndex = newGame.currentRoundIndex;

          // Check if current player has completed current round
          const currentRound = newGame.rounds[currentRoundIndex];
          const currentPlayer = newGame.players[currentPlayerIndex];
          
          if (!currentRound || !currentPlayer) return state;

          const hasScore = currentRound.playerScores[currentPlayer.id] !== undefined;

          if (!hasScore) {
            // Player hasn't scored yet, can't finish turn
            return state;
          }

          // Move to next player
          const nextPlayerIndex = (currentPlayerIndex + 1) % newGame.players.length;

          // If all players have completed this round, move to next round
          const allPlayersCompletedRound = newGame.players.every(
            (player) => currentRound.playerScores[player.id] !== undefined
          );

          if (allPlayersCompletedRound) {
            // Move to next round
            const nextRoundIndex = currentRoundIndex + 1;
            
            if (nextRoundIndex >= newGame.rounds.length) {
              // All rounds complete
              newGame.isGameFinished = true;
              newGame.currentPlayerIndex = 0;
              newGame.currentRoundIndex = newGame.rounds.length - 1;
            } else {
              newGame.currentRoundIndex = nextRoundIndex;
              newGame.currentPlayerIndex = 0; // Start with first player in new round
            }
          } else {
            // Same round, next player
            newGame.currentPlayerIndex = nextPlayerIndex;
          }

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      undoLastScore: () => {
        set((state) => {
          if (!state.currentGame || !state.currentGame.lastScore) return state;

          const newGame = { ...state.currentGame };
          const { playerId, roundIndex } = newGame.lastScore;
          
          // Find the player
          const playerIndex = newGame.players.findIndex((p) => p.id === playerId);
          if (playerIndex === -1) return state;

          const player = newGame.players[playerIndex];
          const round = newGame.rounds[roundIndex];
          
          if (!round || !round.playerScores[playerId]) return state;

          // Remove the score for this player in this round
          const updatedPlayerScores = { ...round.playerScores };
          delete updatedPlayerScores[playerId];

          newGame.rounds[roundIndex] = {
            ...round,
            playerScores: updatedPlayerScores,
          };

          // Recalculate player's total score by going through all rounds up to (but not including) this round
          let recalculatedScore = 0;
          for (let i = 0; i < roundIndex; i++) {
            const prevRound = newGame.rounds[i];
            const prevScore = prevRound.playerScores[playerId];
            if (prevScore) {
              recalculatedScore = prevScore.score;
            }
          }

          // Update player's total score
          const players = [...newGame.players];
          players[playerIndex] = {
            ...player,
            totalScore: recalculatedScore,
          };
          newGame.players = players;

          // Recalculate scores for all subsequent rounds for this player
          let accumulatedScore = recalculatedScore;
          for (let i = roundIndex + 1; i < newGame.rounds.length; i++) {
            const subsequentRound = newGame.rounds[i];
            const subsequentScore = subsequentRound.playerScores[playerId];
            
            if (subsequentScore) {
              // Use accumulated score from previous rounds
              const currentTotalScore = accumulatedScore;
              
              const roundType = subsequentRound.roundType;
              let newRoundScore = 0;

              if (roundType === "number" || roundType === "bull") {
                const hits = subsequentScore.hits || 0;
                if (hits === 0) {
                  newRoundScore = Math.floor(currentTotalScore / 2);
                } else {
                  const targetValue = typeof subsequentRound.target === "number"
                    ? subsequentRound.target
                    : subsequentRound.target === "Bull"
                    ? 25
                    : 0;
                  newRoundScore = currentTotalScore + (hits * targetValue);
                }
              } else if (roundType === "scoring" || roundType === "double" || roundType === "treble") {
                const points = subsequentScore.points || 0;
                if (points === 0) {
                  newRoundScore = Math.floor(currentTotalScore / 2);
                } else {
                  newRoundScore = currentTotalScore + points;
                }
              } else if (roundType === "target-score") {
                const totalScore = subsequentScore.totalScore || 0;
                if (totalScore === 41) {
                  newRoundScore = currentTotalScore + 41;
                } else {
                  newRoundScore = Math.floor(currentTotalScore / 2);
                }
              }

              // Update the round score
              newGame.rounds[i] = {
                ...subsequentRound,
                playerScores: {
                  ...subsequentRound.playerScores,
                  [playerId]: {
                    ...subsequentScore,
                    score: newRoundScore,
                  },
                },
              };

              // Update accumulated score for next iteration
              accumulatedScore = newRoundScore;
            }
          }
          
          // Update player's final total score
          players[playerIndex].totalScore = accumulatedScore;

          // CRITICAL: Ensure players array maintains original order - never reorder based on score
          // The players array order must remain constant throughout the game
          newGame.players = players;

          // Move back to the player and round that was undone
          newGame.currentPlayerIndex = playerIndex;
          newGame.currentRoundIndex = roundIndex;

          // Find the previous score to update lastScore, or clear it if this was the first score
          let previousScore: { playerId: number; roundIndex: number } | undefined = undefined;
          
          // Search backwards through rounds and players to find the last score
          for (let r = roundIndex; r >= 0; r--) {
            const searchRound = newGame.rounds[r];
            const startPlayerIndex = r === roundIndex ? playerIndex - 1 : newGame.players.length - 1;
            
            for (let p = startPlayerIndex; p >= 0; p--) {
              const searchPlayer = newGame.players[p];
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

          newGame.lastScore = previousScore;
          newGame.isGameFinished = false;

          return {
            ...state,
            currentGame: newGame,
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
      partialize: (state) => ({
        // Only persist settings if needed
      }),
    }
  )
);

