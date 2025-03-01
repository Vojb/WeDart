import { create } from "zustand";
import { PaletteMode } from "@mui/material";
import { persist } from "zustand/middleware";

interface Player {
  id: number;
  name: string;
  games: number;
  average: number;
  totalDartsThrown: number; // Track total darts thrown across all games
  totalPointsScored: number; // Track total points scored across all games
}

interface Score {
  score: number;
  darts: number;
}

interface GamePlayer extends Player {
  score: number;
  dartsThrown: number;
  scores: Score[];
  rounds100Plus: number;
  rounds140Plus: number;
  rounds180: number;
  checkoutAttempts: number;
  checkoutSuccess: number;
  avgPerDart: number;
  avgPerRound: number;
  initialScore: number; // To track the starting score for this game
}

interface GameState {
  gameType: "301" | "501" | "701";
  players: GamePlayer[];
  currentPlayerIndex: number;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  isGameFinished: boolean;
  inputMode: "numeric" | "dart";
}

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
  themeMode: PaletteMode;
  toggleTheme: () => void;
  players: Player[];
  addPlayer: (name: string) => void;
  editPlayer: (id: number, name: string) => void;
  removePlayer: (id: number) => void;

  // Game settings
  gameSettings: {
    isDoubleOut: boolean;
    isDoubleIn: boolean;
  };
  updateGameSettings: (settings: Partial<GameState>) => void;

  // Current game state
  currentGame: GameState | null;
  startGame: (gameType: GameState["gameType"], playerIds: number[]) => void;
  recordScore: (score: number, dartsUsed: number) => void;
  undoLastScore: () => void;
  endGame: () => void;
  setInputMode: (mode: "numeric" | "dart") => void;
}

// Calculate a player's game statistics
function calculatePlayerAverages(player: GamePlayer): {
  avgPerDart: number;
  avgPerRound: number;
} {
  if (player.dartsThrown === 0) {
    return { avgPerDart: 0, avgPerRound: 0 };
  }

  // Calculate total points scored in this game
  const totalScored = player.scores.reduce(
    (total, score) => total + score.score,
    0
  );

  // Average per dart for this game
  const avgPerDart = totalScored / player.dartsThrown;

  // Calculate rounds - a round is 3 darts in darts
  const rounds = Math.ceil(player.dartsThrown / 3);
  const avgPerRound = rounds > 0 ? totalScored / rounds : 0;

  return { avgPerDart, avgPerRound };
}

// Restore persist middleware for saving data in localStorage
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      themeMode: "dark",
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "dark" ? "light" : "dark",
        })),
      players: [],
      addPlayer: (name: string) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              id: Date.now(),
              name,
              games: 0,
              average: 0,
              totalDartsThrown: 0,
              totalPointsScored: 0,
            },
          ],
        })),
      editPlayer: (id: number, name: string) =>
        set((state) => ({
          players: state.players.map((player) =>
            player.id === id ? { ...player, name } : player
          ),
        })),
      removePlayer: (id: number) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        })),

      gameSettings: {
        isDoubleOut: true,
        isDoubleIn: false,
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (gameType, playerIds) => {
        const { players } = get();
        const gamePlayers = playerIds
          .map((id) => {
            const player = players.find((p) => p.id === id);
            if (!player) return null;

            const initialScore = parseInt(gameType);

            return {
              ...player,
              score: initialScore,
              initialScore: initialScore, // Store initial score
              scores: [],
              dartsThrown: 0,
              rounds100Plus: 0,
              rounds140Plus: 0,
              rounds180: 0,
              checkoutAttempts: 0,
              checkoutSuccess: 0,
              avgPerDart: 0,
              avgPerRound: 0,
            };
          })
          .filter((p): p is GamePlayer => p !== null);

        set((state) => ({
          currentGame: {
            gameType,
            players: gamePlayers,
            currentPlayerIndex: 0,
            isDoubleOut: state.gameSettings.isDoubleOut,
            isDoubleIn: state.gameSettings.isDoubleIn,
            isGameFinished: false,
            inputMode: "numeric",
          },
        }));
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

      // Improved recordScore function with correct average calculations
      recordScore: (score, dartsUsed) => {
        try {
          set((state) => {
            // Guard clauses
            if (!state.currentGame) return state;

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            const playerIndex = newGame.currentPlayerIndex;
            const player = { ...players[playerIndex] };

            // Simple score calculation
            const newPlayerScore = player.score - score;

            // Check if bust
            if (
              newPlayerScore < 0 ||
              (newGame.isDoubleOut && newPlayerScore === 1)
            ) {
              return state; // No change
            }

            // Update player
            player.score = newPlayerScore;
            player.scores = [...player.scores, { score, darts: dartsUsed }];
            player.dartsThrown += dartsUsed;

            // Stats updates
            if (score >= 100) player.rounds100Plus++;
            if (score >= 140) player.rounds140Plus++;
            if (score === 180) player.rounds180++;

            // Calculate in-game averages
            const averages = calculatePlayerAverages(player);
            player.avgPerDart = averages.avgPerDart;
            player.avgPerRound = averages.avgPerRound;

            // Update the player in the array
            players[playerIndex] = player;

            // Move to the next player
            const nextPlayerIndex = (playerIndex + 1) % players.length;

            // Update the game
            newGame.players = players;
            newGame.currentPlayerIndex = nextPlayerIndex;
            newGame.isGameFinished = players.some((p) => p.score === 0);

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

      // Enhanced undo function with correct average calculations
      undoLastScore: () => {
        try {
          set((state) => {
            // Guard clauses
            if (!state.currentGame) return state;

            // Calculate previous player index
            const prevPlayerIndex =
              state.currentGame.currentPlayerIndex === 0
                ? state.currentGame.players.length - 1
                : state.currentGame.currentPlayerIndex - 1;

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            const player = { ...players[prevPlayerIndex] };

            // Check if there are scores to undo
            if (player.scores.length === 0) return state;

            // Get the last score
            const lastScore = player.scores[player.scores.length - 1];

            // Update player
            player.score += lastScore.score;

            // Handle different input modes
            if (newGame.inputMode === "numeric" || lastScore.darts === 1) {
              // For numeric input or a single dart, remove the entire score
              player.scores = player.scores.slice(0, -1);
              player.dartsThrown -= lastScore.darts;

              // Update stats
              if (lastScore.score >= 100) player.rounds100Plus--;
              if (lastScore.score >= 140) player.rounds140Plus--;
              if (lastScore.score === 180) player.rounds180--;
            } else {
              // For dart input with multiple darts, remove just one dart
              const dartValue = Math.round(lastScore.score / lastScore.darts);

              // Update the last score
              const updatedScores = [...player.scores];
              updatedScores[updatedScores.length - 1] = {
                score: lastScore.score - dartValue,
                darts: lastScore.darts - 1,
              };

              player.scores = updatedScores;
              player.dartsThrown -= 1;
            }

            // Recalculate in-game averages
            const averages = calculatePlayerAverages(player);
            player.avgPerDart = averages.avgPerDart;
            player.avgPerRound = averages.avgPerRound;

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
        } catch (error) {
          console.error("Error in undoLastScore:", error);
          // Don't update the state if there's an error
        }
      },

      endGame: () => {
        // Update player statistics and clear current game
        set((state) => {
          if (!state.currentGame) return state;

          const updatedPlayers = state.players.map((player) => {
            const gamePlayer = state.currentGame?.players.find(
              (p) => p.id === player.id
            );
            if (!gamePlayer || gamePlayer.dartsThrown === 0) return player;

            // Calculate points scored in this game
            const totalPointsThisGame = gamePlayer.scores.reduce(
              (total, score) => total + score.score,
              0
            );

            // Update total stats
            const newTotalDartsThrown =
              player.totalDartsThrown + gamePlayer.dartsThrown;
            const newTotalPointsScored =
              player.totalPointsScored + totalPointsThisGame;

            // Calculate new career average
            const newAverage =
              newTotalDartsThrown > 0
                ? newTotalPointsScored / newTotalDartsThrown
                : 0;

            return {
              ...player,
              games: player.games + 1,
              average: newAverage,
              totalDartsThrown: newTotalDartsThrown,
              totalPointsScored: newTotalPointsScored,
            };
          });

          return {
            players: updatedPlayers,
            currentGame: null,
          };
        });
      },
    }),
    {
      name: "wedart-storage",
      version: 2, // Increment version due to schema changes
      partialize: (state) => ({
        // Only persist these items from the state
        themeMode: state.themeMode,
        players: state.players,
        gameSettings: state.gameSettings,
        currentGame: state.currentGame,
      }),
    }
  )
);
