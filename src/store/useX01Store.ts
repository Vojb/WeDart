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
  lastRoundScore: number; // Track the last round score for display
  dartHits: Record<string, number>; // Track the frequency of each dart hit (format: "T20", "D16", etc.)
}

interface GameState {
  gameType: "301" | "501" | "701";
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

interface GameSettings {
  isDoubleOut: boolean;
  isDoubleIn: boolean;
  defaultLegs: number;
  defaultGameType: "301" | "501" | "701";
  legsWon?: Record<number, number>;
}

interface X01StoreState {
  // Game settings
  gameSettings: {
    isDoubleOut: boolean;
    isDoubleIn: boolean;
    defaultLegs: number;
    defaultGameType: "301" | "501" | "701";
  };
  updateGameSettings: (
    settings: Partial<X01StoreState["gameSettings"]>
  ) => void;

  // Current game state
  currentGame: GameState | null;
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
  getPlayers: () => Player[];
  setPlayers: (players: Player[]) => void;
}

// Add this at the top level, outside any function
let lastScoreTimestamp = 0;
const DEBOUNCE_DELAY = 300; // milliseconds

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

// Add this function before the useStore declaration
function inferDartNotationsFromScore(score: number): string[] {
  // Common patterns for specific scores
  const commonPatterns: Record<number, string[]> = {
    60: ["T20"],
    57: ["T19"],
    54: ["T18"],
    51: ["T17"],
    48: ["T16"],
    45: ["T15"],
    42: ["T14"],
    40: ["D20"],
    38: ["D19"],
    36: ["D18"],
    34: ["D17"],
    32: ["D16"],
    30: ["D15"],
    26: ["D13"],
    24: ["D12"],
    22: ["D11"],
    20: ["20", "D10"],
    19: ["19"],
    18: ["18", "D9"],
    17: ["17"],
    16: ["16", "D8"],
    15: ["15"],
    14: ["14", "D7"],
    13: ["13"],
    12: ["12", "D6"],
    11: ["11"],
    10: ["10", "D5"],
    9: ["9"],
    8: ["8", "D4"],
    7: ["7"],
    6: ["6", "D3"],
    5: ["5"],
    4: ["4", "D2"],
    3: ["3"],
    2: ["2", "D1"],
    1: ["1"],
    0: [],
    25: ["25"],
    50: ["D25"],
  };

  // For scores we have defined patterns for
  if (commonPatterns[score]) {
    return commonPatterns[score];
  }

  // For other scores, try to decompose into common darts
  const result: string[] = [];
  let remaining = score;

  // First try to use common high-value darts
  const highValueTargets = [
    60, 57, 54, 51, 50, 40, 38, 36, 34, 32, 30, 25, 20, 19, 18, 17, 16, 15,
  ];

  for (const target of highValueTargets) {
    if (remaining >= target) {
      const notation = commonPatterns[target][0]; // Get the first notation for this value
      result.push(notation);
      remaining -= target;

      // If we've fully accounted for the score, return the result
      if (remaining === 0) return result;

      // Otherwise continue with next high value
      break;
    }
  }

  // If there's still a remainder, use single numbers as fallback
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
      // For the remainder, just add the number itself
      result.push(remaining.toString());
      remaining = 0;
    }
  }

  return result;
}

// Reference to main store players to avoid circular dependencies
let cachedPlayers: Player[] = [];

// Create the X01 store with persistence
export const useX01Store = create<X01StoreState>()(
  persist(
    (set, get) => ({
      gameSettings: {
        isDoubleOut: true,
        isDoubleIn: false,
        defaultLegs: 3,
        defaultGameType: "501",
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (gameType, playerIds, totalLegs, startingPlayerIndex = 0) => {
        // Create a new game with the selected settings
        set((state) => {
          // Find the selected players from the cached players
          const selectedPlayers = cachedPlayers.filter((player) =>
            playerIds.includes(player.id)
          );

          // Create game players with the necessary in-game properties
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

          // Create positions map based on selection order
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

          return { currentGame: newGame };
        });
      },

      handleLegWin: (winnerId: number) => {
        set((state) => {
          if (!state.currentGame) return state;

          const currentGame = state.currentGame;
          const updatedLegsWon = { ...currentGame.legsWon };
          updatedLegsWon[winnerId] = (updatedLegsWon[winnerId] || 0) + 1;

          // Check if the player has won enough legs to win the match
          const isMatchWinner =
            updatedLegsWon[winnerId] > currentGame.totalLegs / 2;

          if (isMatchWinner) {
            return {
              currentGame: {
                ...currentGame,
                isGameFinished: true,
                legsWon: updatedLegsWon,
              },
            };
          }

          // Reset players for the next leg
          const resetPlayers = currentGame.players.map((player) => ({
            ...player,
            score: parseInt(currentGame.gameType),
            dartsThrown: 0,
            scores: [],
            rounds100Plus: 0,
            rounds140Plus: 0,
            rounds180: 0,
            checkoutAttempts: 0,
            checkoutSuccess: 0,
            avgPerDart: 0,
            avgPerRound: 0,
            initialScore: parseInt(currentGame.gameType),
            lastRoundScore: 0,
            dartHits: {},
          }));

          // Determine the starting player for the next leg
          const nextLeg = currentGame.currentLeg + 1;
          const nextStartingPlayerIndex = nextLeg % currentGame.players.length;

          return {
            currentGame: {
              ...currentGame,
              players: resetPlayers,
              currentPlayerIndex: nextStartingPlayerIndex,
              currentLeg: nextLeg,
              legsWon: updatedLegsWon,
            },
          };
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

      // Improved recordScore function with correct average calculations
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

            const newGame = { ...state.currentGame };
            const players = [...newGame.players];

            // Find current player by position
            const currentPosition = newGame.currentPlayerIndex + 1;
            const currentPlayerId = Object.entries(
              newGame.playerPositions
            ).find(([_, pos]) => pos === currentPosition)?.[0];
            if (!currentPlayerId) return state;

            const playerIndex = players.findIndex(
              (p) => p.id === parseInt(currentPlayerId)
            );
            if (playerIndex === -1) return state;

            const player = { ...players[playerIndex] };

            // Clone dartHits object to avoid reference issues
            player.dartHits = { ...player.dartHits };

            // Simple score calculation
            const newPlayerScore = player.score - score;

            // Check if this is the player's first score and double-in is required
            const isFirstScore = player.scores.length === 0;
            if (
              isFirstScore &&
              newGame.isDoubleIn &&
              lastDartMultiplier !== 2
            ) {
              // If double-in is required but the last dart wasn't a double, count as bust
              player.scores = [
                ...player.scores,
                { score: 0, darts: dartsUsed },
              ];
              player.dartsThrown += dartsUsed;
              player.lastRoundScore = 0;

              // Update the player in the array
              players[playerIndex] = player;

              // Move to the next player using position
              const nextPosition = (currentPosition % players.length) + 1;
              newGame.currentPlayerIndex = nextPosition - 1;

              return {
                ...state,
                currentGame: newGame,
                lastDartNotations: [], // Reset last dart notations after processing
              };
            }

            // Check if using dart input and there are notations
            const isDartInput = newGame.inputMode === "dart";

            // IMPROVED: Record dart hits even when using numeric input
            if (currentNotations.length > 0) {
              console.log(
                "Recording dart notations for player:",
                player.name,
                currentNotations
              );
              console.log("Player dartHits BEFORE:", { ...player.dartHits });

              // Track both notations and base numbers
              currentNotations.forEach((notation) => {
                // Create if doesn't exist, increment if it does
                player.dartHits[notation] =
                  (player.dartHits[notation] || 0) + 1;
                console.log(
                  `Added hit for ${notation}, now at ${player.dartHits[notation]}`
                );

                // Also track the base number separately (extract from notation)
                const baseNumber = notation.replace(/[DT]/g, "");

                // Single digit darts (like "1") get tracked directly
                if (notation === baseNumber) {
                  // If this is a single-digit number that's being hit repeatedly, give it a boost
                  if (baseNumber.length === 1) {
                    // Give single digits a boost to make them more likely to appear in favorites
                    player.dartHits[baseNumber] += 0.5; // Extra half-point for frequently used single digits
                  }
                }
                // For D and T notations, also track the base number
                else {
                  player.dartHits[baseNumber] =
                    (player.dartHits[baseNumber] || 0) + 0.5;
                }

                console.log(
                  `Recording hit for ${notation}, now at ${
                    player.dartHits[notation]
                  }, base ${baseNumber}: ${player.dartHits[baseNumber] || 0}`
                );
              });

              console.log("Player dartHits AFTER:", { ...player.dartHits });
            } else if (isDartInput && score > 0) {
              // If we're using the dart input mode but don't have notations (fallback)
              // Try to infer what darts might have been thrown based on the score
              console.log(
                "No notations available, inferring from score:",
                score
              );

              // Most common dart combinations for common scores
              const inferredNotations = inferDartNotationsFromScore(score);
              if (inferredNotations.length > 0) {
                console.log("Inferred notations:", inferredNotations);

                // Record these inferred notations
                inferredNotations.forEach((notation) => {
                  player.dartHits[notation] =
                    (player.dartHits[notation] || 0) + 1;

                  // Also track base number
                  const baseNumber = notation.replace(/[DT]/g, "");
                  if (notation !== baseNumber) {
                    player.dartHits[baseNumber] =
                      (player.dartHits[baseNumber] || 0) + 0.5;
                  }
                });
              }
            }

            // Check if bust (score below 0 or score is 1 with double out rule)
            const isBust =
              newPlayerScore < 0 ||
              (newGame.isDoubleOut && newPlayerScore === 1) ||
              // Add double-out validation - if player reaches 0 but last dart wasn't a double
              (newGame.isDoubleOut &&
                newPlayerScore === 0 &&
                lastDartMultiplier !== 2);

            // Check if player has won (score exactly 0 and if double-out is required, last dart was a double)
            const hasWon =
              newPlayerScore === 0 &&
              (!newGame.isDoubleOut ||
                (newGame.isDoubleOut && lastDartMultiplier === 2));

            if (isBust) {
              // If bust, keep the player's current turn but don't update the score
              // Still track the score attempt for statistics
              player.scores = [
                ...player.scores,
                { score: 0, darts: dartsUsed },
              ];
              player.dartsThrown += dartsUsed;
              player.lastRoundScore = 0; // Show 0 for the round where they busted

              // Update the player in the array
              players[playerIndex] = player;

              // Move to the next player using position
              const nextPosition = (currentPosition % players.length) + 1;
              newGame.currentPlayerIndex = nextPosition - 1;

              return {
                ...state,
                currentGame: newGame,
                lastDartNotations: [], // Reset last dart notations after processing
              };
            }

            // Update player
            player.score = newPlayerScore;
            player.scores = [...player.scores, { score, darts: dartsUsed }];
            player.dartsThrown += dartsUsed;
            player.lastRoundScore = score;

            // Update high round counters
            if (score >= 100 && score < 140) {
              player.rounds100Plus += 1;
            } else if (score >= 140 && score < 180) {
              player.rounds140Plus += 1;
            } else if (score === 180) {
              player.rounds180 += 1;
            }

            // Stats updates
            const averages = calculatePlayerAverages(player);
            player.avgPerDart = averages.avgPerDart;
            player.avgPerRound = averages.avgPerRound;

            // Update the player in the array
            players[playerIndex] = player;

            // Move to the next player using position
            const nextPosition = (currentPosition % players.length) + 1;
            newGame.currentPlayerIndex = nextPosition - 1;

            // Update the game
            newGame.players = players;

            // Instead of setting isGameFinished directly, call handleLegWin if the player has won the leg
            if (hasWon) {
              // Return the updated state first
              const updatedState = {
                ...state,
                currentGame: newGame,
                lastDartNotations: [], // Reset last dart notations after processing
              };

              // Then call handleLegWin after this state update is complete
              setTimeout(() => {
                get().handleLegWin(player.id);
              }, 0);

              return updatedState;
            }

            return {
              ...state,
              currentGame: newGame,
              lastDartNotations: [], // Reset last dart notations after processing
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
            if (!state.currentGame) return state;

            const newGame = { ...state.currentGame };
            const players = [...newGame.players];

            // Calculate previous player position
            const currentPosition = newGame.currentPlayerIndex + 1;
            const prevPosition =
              currentPosition === 1 ? players.length : currentPosition - 1;

            // Find previous player by position
            const prevPlayerId = Object.entries(newGame.playerPositions).find(
              ([_, pos]) => pos === prevPosition
            )?.[0];
            if (!prevPlayerId) return state;

            const prevPlayerIndex = players.findIndex(
              (p) => p.id === parseInt(prevPlayerId)
            );
            if (prevPlayerIndex === -1) return state;

            const player = { ...players[prevPlayerIndex] };

            // Check if there are scores to undo
            if (player.scores.length === 0) return state;

            // Get the last score
            const lastScore = player.scores[player.scores.length - 1];

            // Update player
            player.score += lastScore.score;
            player.lastRoundScore =
              player.scores.length > 1
                ? player.scores[player.scores.length - 2].score
                : 0; // Update to previous round score or 0 if none

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
            newGame.currentPlayerIndex = prevPosition - 1;
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

          const updatedPlayers = new Array(...cachedPlayers);

          state.currentGame.players.forEach((gamePlayer) => {
            const playerIndex = updatedPlayers.findIndex(
              (p) => p.id === gamePlayer.id
            );
            if (playerIndex === -1 || gamePlayer.dartsThrown === 0) return;

            const player = updatedPlayers[playerIndex];

            // Calculate points scored in this game
            const totalPointsThisGame = gamePlayer.scores.reduce(
              (total, score) => total + score.score,
              0
            );

            // Update total stats
            const newTotalDartsThrown =
              (player.totalDartsThrown || 0) + gamePlayer.dartsThrown;
            const newTotalPointsScored =
              (player.totalPointsScored || 0) + totalPointsThisGame;

            // Calculate new career average
            const newAverage =
              newTotalDartsThrown > 0
                ? newTotalPointsScored / newTotalDartsThrown
                : 0;

            // Merge dart hits from this game with the player's overall dart hits
            const updatedDartHits = { ...player.dartHits };

            // Iterate through game player's dart hits and add them to the overall stats
            Object.entries(gamePlayer.dartHits).forEach(([notation, count]) => {
              updatedDartHits[notation] =
                (updatedDartHits[notation] || 0) + count;
            });

            // Update the player in the array
            updatedPlayers[playerIndex] = {
              ...player,
              games: player.games + 1,
              average: newAverage,
              totalDartsThrown: newTotalDartsThrown,
              totalPointsScored: newTotalPointsScored,
              dartHits: updatedDartHits, // Update with merged dart hits
            };
          });

          // Update the cached players
          cachedPlayers = updatedPlayers;

          return {
            ...state,
            currentGame: null,
          };
        });
      },

      lastDartNotations: [], // Initialize the lastDartNotations array

      // Helper to get a player's most frequently hit darts
      getPlayerMostFrequentDarts: (playerId, limit = 5) => {
        const state = get();
        const currentGame = state.currentGame;

        console.log("Getting most frequent darts for player:", playerId);

        // First, check if there's a current game with this player
        if (currentGame) {
          const gamePlayer = currentGame.players.find((p) => p.id === playerId);

          if (gamePlayer) {
            // Get the player's dart hits from the current game
            const currentGameHits = gamePlayer.dartHits || {};

            // Get any recent dart notations from the last throw
            const recentNotations = [...(state.lastDartNotations || [])];

            // Create a set of all unique notations the player has thrown in this game
            const allThrown = new Set<string>();

            // Add all darts that have been hit at least once in this game
            Object.entries(currentGameHits).forEach(([notation, count]) => {
              if (count > 0) {
                allThrown.add(notation);
              }
            });

            // Add recent notations that might not be in the hits yet
            recentNotations.forEach((notation) => {
              allThrown.add(notation);
            });

            // Convert to array and sort by hit count (highest first)
            const sortedDarts = Array.from(allThrown).sort((a, b) => {
              const countA = currentGameHits[a] || 0;
              const countB = currentGameHits[b] || 0;
              return countB - countA;
            });

            console.log("All thrown darts sorted by count:", sortedDarts);

            // If we have enough darts thrown in this game, return them
            if (sortedDarts.length >= 3) {
              return sortedDarts.slice(0, limit);
            }

            // If we don't have enough, fill with common defaults
            const defaults = ["T20", "20", "T19", "19", "D16"];
            const result = [...sortedDarts];

            // Add defaults that aren't already in our list
            for (const dart of defaults) {
              if (!result.includes(dart) && result.length < limit) {
                result.push(dart);
              }
            }

            return result;
          }
        }

        // Fallback to the player's overall record if no game data
        const player = cachedPlayers.find((p) => p.id === playerId);
        if (
          player &&
          player.dartHits &&
          Object.keys(player.dartHits).length > 0
        ) {
          const hitsArray = Object.entries(player.dartHits);
          hitsArray.sort((a, b) => b[1] - a[1]);
          const result = hitsArray
            .slice(0, limit)
            .map(([notation]) => notation);
          console.log("Found dart hits in player record:", result);
          return result;
        }

        // If no data at all, return common starter darts for new players
        return ["T20", "20", "T19", "19", "D16"];
      },

      // Helper to get a player's all-time most hit darts
      getPlayerAllTimeMostFrequentDarts: (playerId: number, limit = 5) => {
        // Find the player in the cached players array
        const player = cachedPlayers.find((p) => p.id === playerId);
        if (!player) return [];

        // Check if they have any recorded dart hits
        if (player.dartHits && Object.keys(player.dartHits).length > 0) {
          console.log(
            `Getting all-time most frequent darts for ${player.name}:`,
            { ...player.dartHits }
          );

          // Convert to array and sort by hit count
          const hitsArray = Object.entries(player.dartHits);

          // Remove entries with count 0 or very low
          const validHits = hitsArray.filter(([notation, count]) => {
            // Only include real notations (exclude system-tracked values)
            if (count <= 0) return false;

            // Exclude notations that are just used for bookkeeping
            if (notation.includes("_") || notation.includes(":")) return false;

            return true;
          });

          // Sort by count (highest first)
          validHits.sort((a, b) => b[1] - a[1]);

          // Filter to focus on more meaningful notations
          // Prioritize multipliers and key numbers
          const prioritizedHits = validHits.sort((a, b) => {
            const [notationA, countA] = a;
            const [notationB, countB] = b;

            // First sort by count
            if (countA !== countB) return countB - countA;

            // Then prioritize by notation type
            const isMultiplierA =
              notationA.startsWith("T") || notationA.startsWith("D");
            const isMultiplierB =
              notationB.startsWith("T") || notationB.startsWith("D");

            if (isMultiplierA && !isMultiplierB) return -1;
            if (!isMultiplierA && isMultiplierB) return 1;

            // Prioritize by value for same type
            const valueA = parseInt(notationA.replace(/[DT]/g, ""));
            const valueB = parseInt(notationB.replace(/[DT]/g, ""));

            if (!isNaN(valueA) && !isNaN(valueB)) {
              return valueB - valueA; // Higher values first
            }

            return 0;
          });

          // Return just the notation names
          const result = prioritizedHits
            .slice(0, limit)
            .map(([notation]) => notation);

          console.log(`${player.name}'s all-time favorites:`, result);
          return result;
        }

        // If current game exists, try to get info from there
        if (get().currentGame) {
          const gamePlayer = get().currentGame!.players.find(
            (p) => p.id === playerId
          );
          if (
            gamePlayer &&
            gamePlayer.dartHits &&
            Object.keys(gamePlayer.dartHits).length > 0
          ) {
            // Using same logic as above but from game player
            const hitsArray = Object.entries(gamePlayer.dartHits)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1]);

            const result = hitsArray
              .slice(0, limit)
              .map(([notation]) => notation);
            return result;
          }
        }

        // If no data, return standard favorites
        return ["T20", "T19", "D16", "20", "19"];
      },

      // Get all players from cache
      getPlayers: () => {
        return cachedPlayers;
      },

      // Set players from main store
      setPlayers: (players: Player[]) => {
        cachedPlayers = [...players]; // Update the cached players
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
