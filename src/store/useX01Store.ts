import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces
export interface Player {
  id: number;
  name: string;
  games: number;
  average: number;
  totalDartsThrown: number;
  totalPointsScored: number;
  dartHits: Record<string, number>; // Track the frequency of each dart hit (format: "T20", "D16", etc.)
}

interface Score {
  score: number;
  darts: number;
}

export interface GamePlayer extends Player {
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
  lastRoundScore: number; // Track the last round score for display
  dartHits: Record<string, number>; // Track the frequency of each dart hit (format: "T20", "D16", etc.)
}

interface GameState {
  gameType: string;
  players: GamePlayer[];
  playerPositions: Record<number, number>; // Maps player ID to position (1-based)
  currentPlayerIndex: number;
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  isGameFinished: boolean;
  inputMode: "numeric" | "dart";
  totalLegs: number;
  currentLeg: number;
  legsWon: Record<number, number>;
}

interface LegStats {
  legNumber: number;
  winnerId: number;
  players: Array<{
    id: number;
    name: string;
    dartsThrown: number;
    avgPerDart: number;
    avgPerRound: number;
    rounds100Plus: number;
    rounds140Plus: number;
    rounds180: number;
    checkoutAttempts: number;
    checkoutSuccess: number;
    scores: Array<{ score: number; darts: number }>;
  }>;
}

interface HistoryEntry {
  currentGame: GameState;
  lastLegStats: LegStats | null;
  lastDartNotations: string[];
}

interface X01StoreState {
  // Game settings
  gameSettings: {
    isDoubleOut: boolean;
    isDoubleIn: boolean;
    defaultLegs: number;
    defaultGameType: "301" | "501" | "701";
    lastCustomGameType?: string;
  };
  updateGameSettings: (
    settings: Partial<X01StoreState["gameSettings"]>
  ) => void;

  // Current game state
  currentGame: GameState | null;
  lastLegStats: LegStats | null;
  startGame: (
    gameType: GameState["gameType"],
    playerIds: number[],
    totalLegs: number,
    startingPlayerIndex?: number
  ) => void;
  recordScore: (
    score: number,
    dartsUsed: number,
    lastDartMultiplier?: number
  ) => void;
  undoLastScore: () => void;
  endGame: () => void;
  handleLegWin: (winnerId: number) => void;
  setInputMode: (mode: "numeric" | "dart") => void;
  getPlayerMostFrequentDarts: (playerId: number, limit?: number) => string[];
  getPlayerAllTimeMostFrequentDarts: (
    playerId: number,
    limit?: number
  ) => string[];
  lastDartNotations: string[];
  history: HistoryEntry[];
  getPlayers: () => Player[];
  setPlayers: (players: Player[]) => void;
}

const MAX_HISTORY = 20;
let lastScoreTimestamp = 0;
const DEBOUNCE_DELAY = 300; // milliseconds

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value) as T;
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const getCurrentPlayerInfo = (game: GameState) => {
  const currentPosition = game.currentPlayerIndex + 1;
  const currentPlayerId = Object.entries(game.playerPositions).find(
    ([_, pos]) => pos === currentPosition
  )?.[0];

  if (currentPlayerId) {
    const playerIndex = game.players.findIndex(
      (player) => player.id === parseInt(currentPlayerId)
    );
    if (playerIndex !== -1) {
      return { player: game.players[playerIndex], playerIndex };
    }
  }

  return {
    player: game.players[game.currentPlayerIndex],
    playerIndex: game.currentPlayerIndex,
  };
};

const calculatePlayerAverages = (player: GamePlayer) => {
  if (player.dartsThrown === 0) {
    return { avgPerDart: 0, avgPerRound: 0 };
  }

  const totalScored = player.scores.reduce(
    (total, score) => total + score.score,
    0
  );
  const rounds = Math.ceil(player.dartsThrown / 3);

  return {
    avgPerDart: totalScored / player.dartsThrown,
    avgPerRound: rounds > 0 ? totalScored / rounds : 0,
  };
};

const inferDartNotationsFromScore = (score: number): string[] => {
  const commonPatterns: Record<number, string[]> = {
    180: ["T20", "T20", "T20"],
    140: ["T20", "T20", "D20"],
    100: ["T20", "D20", "D10"],
    60: ["T20", "20", "20"],
    41: ["T19", "12", "D4"],
    45: ["T15", "10", "D5"],
    50: ["BULL", "BULL", "0"],
    57: ["T19", "10", "10"],
  };

  if (commonPatterns[score]) {
    return commonPatterns[score];
  }

  const result: string[] = [];
  let remaining = score;

  const highValueTargets = [60, 57, 54, 51, 50, 45, 42, 41, 40];

  for (const target of highValueTargets) {
    if (remaining >= target) {
      const notation = commonPatterns[target]?.[0];
      if (notation) {
        result.push(notation);
        remaining -= target;
      }
      if (remaining === 0) return result;
      break;
    }
  }

  while (remaining > 0) {
    if (remaining >= 20) {
      result.push("20");
      remaining -= 20;
    } else if (remaining >= 19) {
      result.push("19");
      remaining -= 19;
    } else if (remaining >= 18) {
      result.push("18");
      remaining -= 18;
    } else if (remaining > 0) {
      result.push(remaining.toString());
      remaining = 0;
    }
  }

  return result;
};

const buildLegStats = (game: GameState, winnerId: number): LegStats => ({
  legNumber: game.currentLeg,
  winnerId,
  players: game.players.map((player) => {
    const pointsScored = player.initialScore - player.score;
    return {
      id: player.id,
      name: player.name,
      dartsThrown: player.dartsThrown,
      avgPerDart: player.dartsThrown > 0 ? pointsScored / player.dartsThrown : 0,
      avgPerRound:
        player.dartsThrown > 0
          ? pointsScored / Math.ceil(player.dartsThrown / 3)
          : 0,
      rounds100Plus: player.rounds100Plus,
      rounds140Plus: player.rounds140Plus,
      rounds180: player.rounds180,
      checkoutAttempts: player.checkoutAttempts,
      checkoutSuccess: player.checkoutSuccess,
      scores: player.scores.map((score) => ({
        score: score.score,
        darts: score.darts,
      })),
    };
  }),
});

const resetPlayersForNextLeg = (game: GameState): GamePlayer[] =>
  game.players.map((player) => ({
    ...player,
    score: parseInt(game.gameType),
    dartsThrown: 0,
    scores: [],
    rounds100Plus: 0,
    rounds140Plus: 0,
    rounds180: 0,
    checkoutAttempts: 0,
    checkoutSuccess: 0,
    avgPerDart: 0,
    avgPerRound: 0,
    initialScore: parseInt(game.gameType),
    lastRoundScore: 0,
    dartHits: {},
  }));

let cachedPlayers: Player[] = [];

export const useX01Store = create<X01StoreState>()(
  persist(
    (set, get) => ({
      gameSettings: {
        isDoubleOut: true,
        isDoubleIn: false,
        defaultLegs: 3,
        defaultGameType: "501",
        lastCustomGameType: undefined,
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      lastLegStats: null,
      lastDartNotations: [],
      history: [],

      startGame: (gameType, playerIds, totalLegs, startingPlayerIndex = 0) => {
        set((state) => {
          const selectedPlayers = playerIds
            .map((id) => cachedPlayers.find((player) => player.id === id))
            .filter((player): player is Player => Boolean(player));

          const gamePlayers: GamePlayer[] = selectedPlayers.map((player) => ({
            ...player,
            score: parseInt(gameType),
            dartsThrown: 0,
            scores: [],
            rounds100Plus: 0,
            rounds140Plus: 0,
            rounds180: 0,
            checkoutAttempts: 0,
            checkoutSuccess: 0,
            avgPerDart: 0,
            avgPerRound: 0,
            initialScore: parseInt(gameType),
            lastRoundScore: 0,
            dartHits: {},
          }));

          const playerPositions: Record<number, number> = {};
          playerIds.forEach((id, index) => {
            playerPositions[id] = index + 1;
          });

          const newGame: GameState = {
            gameType,
            players: gamePlayers,
            playerPositions,
            currentPlayerIndex: startingPlayerIndex,
            isDoubleOut: state.gameSettings.isDoubleOut,
            isDoubleIn: state.gameSettings.isDoubleIn,
            isGameFinished: false,
            inputMode: "numeric",
            totalLegs,
            currentLeg: 1,
            legsWon: playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
          };

          return {
            currentGame: newGame,
            lastLegStats: null,
            lastDartNotations: [],
            history: [],
          };
        });
      },

      setInputMode: (mode) =>
        set((state) => {
          if (!state.currentGame) return state;
          return {
            currentGame: { ...state.currentGame, inputMode: mode },
          };
        }),

      recordScore: (score, dartsUsed, lastDartMultiplier) => {
        try {
          const now = Date.now();
          if (now - lastScoreTimestamp < DEBOUNCE_DELAY) {
            console.log("Prevented duplicate score registration");
            return;
          }
          lastScoreTimestamp = now;

          const currentNotations = get().lastDartNotations;

          set((state) => {
            if (!state.currentGame) return state;

            const previousEntry: HistoryEntry = {
              currentGame: clone(state.currentGame),
              lastLegStats: clone(state.lastLegStats),
              lastDartNotations: [...state.lastDartNotations],
            };

            const newGame = clone(state.currentGame);
            const { player, playerIndex } = getCurrentPlayerInfo(newGame);
            if (!player) return state;

            const newPlayerScore = player.score - score;
            const isFirstScore = player.scores.length === 0;
            const isDoubleInBlocked =
              isFirstScore && newGame.isDoubleIn && lastDartMultiplier !== 2;

            const isBust =
              newPlayerScore < 0 ||
              (newGame.isDoubleOut && newPlayerScore === 1) ||
              (newGame.isDoubleOut && newPlayerScore === 0 &&
                lastDartMultiplier !== 2) ||
              isDoubleInBlocked;

            // Record dart hits
            if (currentNotations.length > 0) {
              currentNotations.forEach((notation) => {
                player.dartHits[notation] = (player.dartHits[notation] || 0) + 1;
                const baseNumber = notation.replace(/[DT]/g, "");
                if (notation === baseNumber) {
                  if (baseNumber.length === 1) {
                    player.dartHits[baseNumber] += 0.5;
                  }
                } else {
                  player.dartHits[baseNumber] =
                    (player.dartHits[baseNumber] || 0) + 0.5;
                }
              });
            } else if (newGame.inputMode === "dart" && score > 0) {
              const inferredNotations = inferDartNotationsFromScore(score);
              inferredNotations.forEach((notation) => {
                player.dartHits[notation] = (player.dartHits[notation] || 0) + 1;
                const baseNumber = notation.replace(/[DT]/g, "");
                if (notation !== baseNumber) {
                  player.dartHits[baseNumber] =
                    (player.dartHits[baseNumber] || 0) + 0.5;
                }
              });
            }

            if (isBust) {
              player.scores = [...player.scores, { score: 0, darts: dartsUsed }];
              player.dartsThrown += dartsUsed;
              player.lastRoundScore = 0;
              newGame.players[playerIndex] = player;

              const nextPosition = (newGame.currentPlayerIndex + 1) %
                newGame.players.length;
              newGame.currentPlayerIndex = nextPosition;

              return {
                ...state,
                currentGame: newGame,
                lastDartNotations: [],
                history: [...state.history, previousEntry].slice(-MAX_HISTORY),
              };
            }

            player.score = newPlayerScore;
            player.scores = [...player.scores, { score, darts: dartsUsed }];
            player.dartsThrown += dartsUsed;
            player.lastRoundScore = score;

            if (score >= 100 && score < 140) {
              player.rounds100Plus += 1;
            } else if (score >= 140 && score < 180) {
              player.rounds140Plus += 1;
            } else if (score === 180) {
              player.rounds180 += 1;
            }

            const averages = calculatePlayerAverages(player);
            player.avgPerDart = averages.avgPerDart;
            player.avgPerRound = averages.avgPerRound;
            newGame.players[playerIndex] = player;

            const hasWon =
              newPlayerScore === 0 &&
              (!newGame.isDoubleOut || lastDartMultiplier === 2);

            if (hasWon) {
              const legStats = buildLegStats(newGame, player.id);
              const updatedLegsWon = { ...newGame.legsWon };
              updatedLegsWon[player.id] =
                (updatedLegsWon[player.id] || 0) + 1;

              const isMatchWinner =
                updatedLegsWon[player.id] > newGame.totalLegs / 2;

              if (isMatchWinner) {
                newGame.legsWon = updatedLegsWon;
                newGame.isGameFinished = true;
                return {
                  ...state,
                  currentGame: newGame,
                  lastLegStats: legStats,
                  lastDartNotations: [],
                  history: [...state.history, previousEntry].slice(-MAX_HISTORY),
                };
              }

              const nextLeg = newGame.currentLeg + 1;
              const nextStartingPlayerIndex =
                newGame.currentLeg % newGame.players.length;

              newGame.players = resetPlayersForNextLeg(newGame);
              newGame.currentLeg = nextLeg;
              newGame.currentPlayerIndex = nextStartingPlayerIndex;
              newGame.legsWon = updatedLegsWon;

              return {
                ...state,
                currentGame: newGame,
                lastLegStats: legStats,
                lastDartNotations: [],
                history: [...state.history, previousEntry].slice(-MAX_HISTORY),
              };
            }

            const nextPosition = (newGame.currentPlayerIndex + 1) %
              newGame.players.length;
            newGame.currentPlayerIndex = nextPosition;

            return {
              ...state,
              currentGame: newGame,
              lastDartNotations: [],
              history: [...state.history, previousEntry].slice(-MAX_HISTORY),
            };
          });
        } catch (error) {
          console.error("Error in recordScore:", error);
        }
      },

      handleLegWin: (winnerId) => {
        set((state) => {
          if (!state.currentGame) return state;

          const previousEntry: HistoryEntry = {
            currentGame: clone(state.currentGame),
            lastLegStats: clone(state.lastLegStats),
            lastDartNotations: [...state.lastDartNotations],
          };

          const newGame = clone(state.currentGame);
          const legStats = buildLegStats(newGame, winnerId);
          const updatedLegsWon = { ...newGame.legsWon };
          updatedLegsWon[winnerId] = (updatedLegsWon[winnerId] || 0) + 1;

          const isMatchWinner =
            updatedLegsWon[winnerId] > newGame.totalLegs / 2;

          if (isMatchWinner) {
            newGame.legsWon = updatedLegsWon;
            newGame.isGameFinished = true;
            return {
              ...state,
              currentGame: newGame,
              lastLegStats: legStats,
              history: [...state.history, previousEntry].slice(-MAX_HISTORY),
            };
          }

          const nextLeg = newGame.currentLeg + 1;
          const nextStartingPlayerIndex =
            newGame.currentLeg % newGame.players.length;

          newGame.players = resetPlayersForNextLeg(newGame);
          newGame.currentLeg = nextLeg;
          newGame.currentPlayerIndex = nextStartingPlayerIndex;
          newGame.legsWon = updatedLegsWon;

          return {
            ...state,
            currentGame: newGame,
            lastLegStats: legStats,
            history: [...state.history, previousEntry].slice(-MAX_HISTORY),
          };
        });
      },

      undoLastScore: () => {
        set((state) => {
          if (state.history.length === 0) return state;
          const previousEntry = state.history[state.history.length - 1];
          return {
            ...state,
            currentGame: clone(previousEntry.currentGame),
            lastLegStats: clone(previousEntry.lastLegStats),
            lastDartNotations: [...previousEntry.lastDartNotations],
            history: state.history.slice(0, -1),
          };
        });
      },

      endGame: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const updatedPlayers = new Array(...cachedPlayers);

          state.currentGame.players.forEach((gamePlayer) => {
            const playerIndex = updatedPlayers.findIndex(
              (p) => p.id === gamePlayer.id
            );
            if (playerIndex === -1 || gamePlayer.dartsThrown === 0) return;

            const player = updatedPlayers[playerIndex];
            const totalPointsThisGame = gamePlayer.scores.reduce(
              (total, score) => total + score.score,
              0
            );

            const newTotalDartsThrown =
              (player.totalDartsThrown || 0) + gamePlayer.dartsThrown;
            const newTotalPointsScored =
              (player.totalPointsScored || 0) + totalPointsThisGame;

            const newAverage =
              newTotalDartsThrown > 0
                ? newTotalPointsScored / newTotalDartsThrown
                : 0;

            const updatedDartHits = { ...player.dartHits };
            Object.entries(gamePlayer.dartHits).forEach(([notation, count]) => {
              updatedDartHits[notation] = (updatedDartHits[notation] || 0) + count;
            });

            updatedPlayers[playerIndex] = {
              ...player,
              games: player.games + 1,
              average: newAverage,
              totalDartsThrown: newTotalDartsThrown,
              totalPointsScored: newTotalPointsScored,
              dartHits: updatedDartHits,
            };
          });

          cachedPlayers = updatedPlayers;

          return {
            ...state,
            currentGame: null,
            lastLegStats: null,
            lastDartNotations: [],
            history: [],
          };
        });
      },

      getPlayerMostFrequentDarts: (playerId, limit = 5) => {
        const state = get();
        const currentGame = state.currentGame;

        if (currentGame) {
          const gamePlayer = currentGame.players.find((p) => p.id === playerId);
          if (gamePlayer) {
            const currentGameHits = gamePlayer.dartHits || {};
            const recentNotations = [...(state.lastDartNotations || [])];
            const allThrown = new Set<string>();

            Object.entries(currentGameHits).forEach(([notation, count]) => {
              if (count > 0) {
                allThrown.add(notation);
              }
            });

            recentNotations.forEach((notation) => {
              allThrown.add(notation);
            });

            const sortedDarts = Array.from(allThrown).sort((a, b) => {
              const countA = currentGameHits[a] || 0;
              const countB = currentGameHits[b] || 0;
              return countB - countA;
            });

            if (sortedDarts.length >= 3) {
              return sortedDarts.slice(0, limit);
            }

            const defaults = ["T20", "20", "T19", "19", "D16"];
            const result = [...sortedDarts];

            for (const dart of defaults) {
              if (!result.includes(dart) && result.length < limit) {
                result.push(dart);
              }
            }

            return result;
          }
        }

        const player = cachedPlayers.find((p) => p.id === playerId);
        if (player && player.dartHits && Object.keys(player.dartHits).length > 0) {
          const hitsArray = Object.entries(player.dartHits);
          hitsArray.sort((a, b) => b[1] - a[1]);
          return hitsArray.slice(0, limit).map(([notation]) => notation);
        }

        return ["T20", "20", "T19", "19", "D16"];
      },

      getPlayerAllTimeMostFrequentDarts: (playerId, limit = 5) => {
        const player = cachedPlayers.find((p) => p.id === playerId);
        if (player && player.dartHits && Object.keys(player.dartHits).length > 0) {
          const hitsArray = Object.entries(player.dartHits)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
          return hitsArray.slice(0, limit).map(([notation]) => notation);
        }

        if (get().currentGame) {
          const gamePlayer = get().currentGame!.players.find(
            (p) => p.id === playerId
          );
          if (gamePlayer && gamePlayer.dartHits &&
            Object.keys(gamePlayer.dartHits).length > 0) {
            const hitsArray = Object.entries(gamePlayer.dartHits)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1]);
            return hitsArray.slice(0, limit).map(([notation]) => notation);
          }
        }

        return ["T20", "T19", "D16", "20", "19"];
      },

      getPlayers: () => cachedPlayers,
      setPlayers: (players) => {
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-x01-storage",
      version: 1,
      partialize: (state) => ({
        gameSettings: state.gameSettings,
        currentGame: state.currentGame,
        lastDartNotations: state.lastDartNotations,
      }),
    }
  )
);
