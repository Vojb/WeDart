import { create } from "zustand";
import { persist } from "zustand/middleware";

// Default sequence for Half It game
export const DEFAULT_HALF_IT_SEQUENCE = [
  { number: 15, description: "15s", multiplier: 1 },
  { number: 16, description: "16s", multiplier: 1 },
  { number: "Any Double", description: "Any Double", multiplier: 2 },
  { number: 17, description: "17s", multiplier: 1 },
  { number: 18, description: "18s", multiplier: 1 },
  { number: "Any Triple", description: "Any Triple", multiplier: 3 },
  { number: 19, description: "19s", multiplier: 1 },
  { number: 20, description: "20s", multiplier: 1 },
  { number: "Bull", description: "Bulls", multiplier: 1 },
];

// Interfaces for Half It Game
export interface HalfItRound {
  target: {
    number: number | string;
    description: string;
    multiplier: number;
  };
  score: number;
  dartsUsed: number;
}

export interface HalfItPlayer {
  id: number;
  name: string;
  score: number;
  rounds: HalfItRound[];
  dartsThrown: number;
  isWinner: boolean;
}

interface HalfItGameState {
  players: HalfItPlayer[];
  currentPlayerIndex: number;
  currentRoundIndex: number;
  isGameFinished: boolean;
  sequence: typeof DEFAULT_HALF_IT_SEQUENCE;
}

interface HalfItStoreState {
  // Game settings
  customSequence: typeof DEFAULT_HALF_IT_SEQUENCE;
  updateCustomSequence: (sequence: typeof DEFAULT_HALF_IT_SEQUENCE) => void;

  // Current game state
  currentGame: HalfItGameState | null;
  startGame: (
    playerIds: number[],
    customSequence?: typeof DEFAULT_HALF_IT_SEQUENCE
  ) => void;
  recordScore: (score: number, dartsUsed: number) => void;
  undoLastScore: () => void;
  endGame: () => void;

  // Get all players (for integration with main store)
  getHalfItPlayers: () => HalfItPlayer[];
  // Set players from main store
  setHalfItPlayers: (players: { id: number; name: string }[]) => void;
}

// Reference to main store players to avoid circular dependencies
let cachedPlayers: { id: number; name: string }[] = [];

// Add this at the top level, outside any function
let lastScoreTimestamp = 0;
const DEBOUNCE_DELAY = 300; // milliseconds

// Create the Half It store with persistence
export const useHalfItStore = create<HalfItStoreState>()(
  persist(
    (set, get) => ({
      customSequence: DEFAULT_HALF_IT_SEQUENCE,
      updateCustomSequence: (sequence) => {
        set({ customSequence: sequence });
      },

      currentGame: null,
      startGame: (playerIds, customSequence) => {
        // Create a new game with the selected settings
        set((state) => {
          // Find the selected players from the cached players
          const selectedPlayers = cachedPlayers.filter((player) =>
            playerIds.includes(player.id)
          );

          // Use custom sequence if provided, otherwise use default
          const gameSequence = customSequence || state.customSequence;

          // Create half it players with the necessary in-game properties
          const halfItPlayers: HalfItPlayer[] = selectedPlayers.map(
            (player) => ({
              id: player.id,
              name: player.name,
              score: 0,
              rounds: [],
              dartsThrown: 0,
              isWinner: false,
            })
          );

          return {
            ...state,
            currentGame: {
              players: halfItPlayers,
              currentPlayerIndex: 0,
              currentRoundIndex: 0,
              isGameFinished: false,
              sequence: gameSequence,
            },
          };
        });
      },

      recordScore: (score, dartsUsed) => {
        try {
          // Add debounce to prevent duplicate score registrations
          const now = Date.now();
          if (now - lastScoreTimestamp < DEBOUNCE_DELAY) {
            console.log("Prevented duplicate score registration");
            return; // Ignore rapid repeated calls
          }
          lastScoreTimestamp = now;

          set((state) => {
            // Guard clauses
            if (!state.currentGame) return state;

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            const playerIndex = newGame.currentPlayerIndex;
            const currentPlayer = { ...players[playerIndex] };

            // Get the current round target
            const currentRound = newGame.sequence[newGame.currentRoundIndex];

            // Update player data
            currentPlayer.dartsThrown += dartsUsed;

            // Create the round result
            const roundResult: HalfItRound = {
              target: { ...currentRound },
              score,
              dartsUsed,
            };

            // Add round to player history
            currentPlayer.rounds = [...currentPlayer.rounds, roundResult];

            // Update player score - if they miss (score 0), their total score is halved
            if (score === 0) {
              currentPlayer.score = Math.floor(currentPlayer.score / 2);
            } else {
              currentPlayer.score += score;
            }

            // Update player in the array
            players[playerIndex] = currentPlayer;

            // Determine next player and round
            let nextPlayerIndex = playerIndex;
            let nextRoundIndex = newGame.currentRoundIndex;
            let isGameFinished = false;

            // If all players have completed the current round
            if (playerIndex === players.length - 1) {
              // Move to next round
              nextRoundIndex += 1;
              nextPlayerIndex = 0;

              // Check if game is finished
              if (nextRoundIndex >= newGame.sequence.length) {
                isGameFinished = true;

                // Find winner(s) - player(s) with highest score
                const highestScore = Math.max(...players.map((p) => p.score));
                players.forEach((player) => {
                  if (player.score === highestScore) {
                    player.isWinner = true;
                  }
                });
              }
            } else {
              // Move to next player
              nextPlayerIndex += 1;
            }

            // Update the game
            newGame.players = players;
            newGame.currentPlayerIndex = nextPlayerIndex;
            newGame.currentRoundIndex = nextRoundIndex;
            newGame.isGameFinished = isGameFinished;

            return {
              ...state,
              currentGame: newGame,
            };
          });
        } catch (error) {
          console.error("Error in recordScore:", error);
          // Don't update the state if there's an error
        }
      },

      undoLastScore: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };

          // Calculate previous player index and round
          let prevPlayerIndex = newGame.currentPlayerIndex - 1;
          let prevRoundIndex = newGame.currentRoundIndex;

          // If we're at the beginning of a round, go back to the previous round
          if (prevPlayerIndex < 0) {
            prevRoundIndex -= 1;

            // If there's no previous round, we can't undo
            if (prevRoundIndex < 0) return state;

            // Go to the last player of the previous round
            prevPlayerIndex = newGame.players.length - 1;
          }

          // Get the player who's score we're undoing
          const players = [...newGame.players];
          const player = { ...players[prevPlayerIndex] };

          // Make sure the player has rounds to undo
          if (player.rounds.length === 0) return state;

          // Get the last round and remove it
          const lastRound = player.rounds[player.rounds.length - 1];
          player.rounds = player.rounds.slice(0, -1);

          // Recalculate score based on remaining rounds
          if (player.rounds.length === 0) {
            player.score = 0;
          } else {
            // Recalculate from scratch since "halving" logic makes it complicated
            player.score = player.rounds.reduce((sum, round) => {
              if (round.score === 0) {
                return Math.floor(sum / 2);
              } else {
                return sum + round.score;
              }
            }, 0);
          }

          // Adjust darts thrown
          player.dartsThrown -= lastRound.dartsUsed;

          // Update player in the array
          players[prevPlayerIndex] = player;

          // Update the game
          newGame.players = players;
          newGame.currentPlayerIndex = prevPlayerIndex;
          newGame.currentRoundIndex = prevRoundIndex;
          newGame.isGameFinished = false; // Reset game finished status

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      endGame: () => {
        // End the current game
        set({ currentGame: null });
      },

      getHalfItPlayers: () => {
        return get().currentGame?.players || [];
      },

      setHalfItPlayers: (players) => {
        cachedPlayers = [...players]; // Update the cached players
      },
    }),
    {
      name: "wedart-halfit-storage",
      version: 1,
      partialize: (state) => ({
        // Only persist these items from the state
        customSequence: state.customSequence,
        currentGame: state.currentGame,
      }),
    }
  )
);
