import { create } from "zustand";
import { PaletteMode } from "@mui/material";
import { persist } from "zustand/middleware";

interface Player {
  id: number;
  name: string;
  games: number;
  average: number;
}

interface GamePlayer extends Player {
  score: number;
  dartsThrown: number;
  rounds100Plus: number;
  rounds140Plus: number;
  rounds180: number;
  checkoutAttempts: number;
  checkoutSuccess: number;
  avgPerDart: number;
  avgPerRound: number;
}

interface GameState {
  gameType: "301" | "501" | "701";
  players: GamePlayer[];
  currentPlayerIndex: number;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  isGameFinished: boolean;
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
}

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
            { id: Date.now(), name, games: 0, average: 0 },
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
            return {
              ...player,
              score: parseInt(gameType),
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
          },
        }));
      },

      recordScore: (score, dartsUsed) => {
        set((state) => {
          if (!state.currentGame) return state;

          const currentPlayer =
            state.currentGame.players[state.currentGame.currentPlayerIndex];
          const newScore = currentPlayer.score - score;

          // Check if bust (below 0 or 1 with double out)
          if (
            newScore < 0 ||
            (state.currentGame.isDoubleOut && newScore === 1)
          ) {
            return state;
          }

          const updatedPlayers = state.currentGame.players.map(
            (player, index) => {
              if (index !== state.currentGame.currentPlayerIndex) return player;

              return {
                ...player,
                score: newScore,
                dartsThrown: player.dartsThrown + dartsUsed,
                rounds100Plus: player.rounds100Plus + (score >= 100 ? 1 : 0),
                rounds140Plus: player.rounds140Plus + (score >= 140 ? 1 : 0),
                rounds180: player.rounds180 + (score === 180 ? 1 : 0),
                checkoutAttempts:
                  player.checkoutAttempts + (newScore <= 50 ? 1 : 0),
                checkoutSuccess:
                  player.checkoutSuccess + (newScore === 0 ? 1 : 0),
                avgPerDart:
                  (player.avgPerDart * player.dartsThrown +
                    (newScore > 0 ? newScore / dartsUsed : 0)) /
                  (player.dartsThrown + 1),
                avgPerRound:
                  (player.avgPerRound * player.rounds100Plus +
                    (score >= 100 ? 1 : 0)) /
                  (player.rounds100Plus + 1),
              };
            }
          );

          const nextPlayerIndex =
            (state.currentGame.currentPlayerIndex + 1) %
            state.currentGame.players.length;

          return {
            currentGame: {
              ...state.currentGame,
              players: updatedPlayers,
              currentPlayerIndex: nextPlayerIndex,
              isGameFinished: updatedPlayers.some((p) => p.score === 0),
            },
          };
        });
      },

      undoLastScore: () => {
        // TODO: Implement undo functionality
        set((state) => state);
      },

      endGame: () => {
        // Update player statistics and clear current game
        set((state) => {
          if (!state.currentGame) return state;

          const updatedPlayers = state.players.map((player) => {
            const gamePlayer = state.currentGame?.players.find(
              (p) => p.id === player.id
            );
            if (!gamePlayer) return player;

            const newGames = player.games + 1;
            const newAverage =
              (player.average * player.games +
                (gamePlayer.dartsThrown > 0
                  ? (gamePlayer.score / gamePlayer.dartsThrown) * 3
                  : 0)) /
              newGames;

            return {
              ...player,
              games: newGames,
              average: newAverage,
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
    }
  )
);
