import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces for Cricket Game
export interface CricketTarget {
  number: number | string; // 15-20 or 'Bull'
  hits: number; // 0-3 hits
  closed: boolean;
  points: number; // Points scored on this target
}

// New interfaces for round tracking
export interface CricketDart {
  targetNumber: number | string;
  multiplier: number;
  points: number;
}

export interface CricketRound {
  playerId: number;
  darts: CricketDart[];
  totalPoints: number;
}

export interface CricketPlayer {
  id: number;
  name: string;
  totalScore: number;
  dartsThrown: number;
  targets: CricketTarget[];
  isWinner: boolean;
  // Track how many darts have been used in current turn (0-2)
  currentDartIndex: number;
}

interface GameSettings {
  gameType: "standard" | "cutthroat" | "no-score";
  winCondition: "first-closed" | "points";
  isHalfIt?: boolean;
}

interface CricketGameState {
  players: CricketPlayer[];
  currentPlayerIndex: number;
  isGameFinished: boolean;
  gameType: "standard" | "cutthroat" | "no-score";
  winCondition: "first-closed" | "points"; // Win by closing all numbers first or by points
  // Add round history
  rounds: CricketRound[];
  currentRound: CricketRound | null;
}

interface CricketStoreState {
  // Game settings
  gameSettings: GameSettings;
  updateGameSettings: (settings: Partial<CricketGameState>) => void;

  // Current game state
  currentGame: CricketGameState | null;
  startGame: (
    gameType: CricketGameState["gameType"],
    winCondition: CricketGameState["winCondition"],
    playerIds: number[]
  ) => void;
  recordHit: (targetNumber: number | string, multiplier: number) => void;
  undoLastHit: () => void;
  endGame: () => void;
  // Add function to advance to next player manually
  finishTurn: () => void;

  // Get all players (for integration with main store)
  getCricketPlayers: () => CricketPlayer[];
  // Set players from main store
  setCricketPlayers: (players: { id: number; name: string }[]) => void;
}

// Default array of cricket targets
const createDefaultTargets = (): CricketTarget[] => {
  return [
    { number: 20, hits: 0, closed: false, points: 0 },
    { number: 19, hits: 0, closed: false, points: 0 },
    { number: 18, hits: 0, closed: false, points: 0 },
    { number: 17, hits: 0, closed: false, points: 0 },
    { number: 16, hits: 0, closed: false, points: 0 },
    { number: 15, hits: 0, closed: false, points: 0 },
    { number: "Bull", hits: 0, closed: false, points: 0 },
  ];
};

// Reference to main store players to avoid circular dependencies
let cachedPlayers: { id: number; name: string }[] = [];

// Function to update cached players - add this function
export const updateCachedPlayers = (
  players: { id: number; name: string }[]
) => {
  cachedPlayers = [...players];
};

// Add this at the top level, outside any function
let lastHitTimestamp = 0;
const DEBOUNCE_DELAY = 300; // milliseconds

// Create the Cricket store with persistence
export const useCricketStore = create<CricketStoreState>()(
  persist(
    (set, get) => ({
      gameSettings: {
        gameType: "standard",
        winCondition: "points",
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (gameType, winCondition, playerIds) => {
        console.log("Starting game with player IDs:", playerIds);
        console.log("Cached players:", cachedPlayers);

        // Create a new game with the selected settings
        set((state) => {
          // Find the selected players from the cached players
          const selectedPlayers = cachedPlayers.filter((player) =>
            playerIds.includes(player.id)
          );

          console.log("Selected players:", selectedPlayers);

          // If no players were found, log error and return unchanged state
          if (selectedPlayers.length === 0) {
            console.error(
              "No players found for the selected IDs. Check if player IDs match.",
              {
                playerIds,
                cachedPlayers,
              }
            );
            return state;
          }

          // Create cricket players with the necessary in-game properties
          const cricketPlayers: CricketPlayer[] = selectedPlayers.map(
            (player) => ({
              id: player.id,
              name: player.name,
              totalScore: 0,
              dartsThrown: 0,
              targets: createDefaultTargets(),
              isWinner: false,
              currentDartIndex: 0,
            })
          );

          // Initialize first round
          const initialRound: CricketRound = {
            playerId: cricketPlayers[0].id,
            darts: [],
            totalPoints: 0,
          };

          return {
            ...state,
            currentGame: {
              players: cricketPlayers,
              currentPlayerIndex: 0,
              isGameFinished: false,
              gameType,
              winCondition,
              rounds: [],
              currentRound: initialRound,
            },
          };
        });
      },

      recordHit: (targetNumber, multiplier) => {
        try {
          // Add debounce to prevent duplicate hit registrations
          const now = Date.now();
          if (now - lastHitTimestamp < DEBOUNCE_DELAY) {
            console.log("Prevented duplicate hit registration");
            return; // Ignore rapid repeated calls
          }
          lastHitTimestamp = now;

          set((state) => {
            // Guard clauses
            if (!state.currentGame) return state;

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            const playerIndex = newGame.currentPlayerIndex;
            const currentPlayer = { ...players[playerIndex] };

            // Create or update the current round
            let currentRound = newGame.currentRound
              ? { ...newGame.currentRound }
              : { playerId: currentPlayer.id, darts: [], totalPoints: 0 };

            // Check if we've already used 3 darts
            if (currentPlayer.currentDartIndex >= 3) {
              console.log("Player has already used 3 darts");
              return state;
            }

            // Track the dart
            const newDart: CricketDart = {
              targetNumber,
              multiplier,
              points: 0, // Will be updated with actual points
            };

            // Add darts thrown count
            currentPlayer.dartsThrown += 1;
            currentPlayer.currentDartIndex += 1;

            // Find the target in the player's targets
            const targetIndex = currentPlayer.targets.findIndex(
              (t) => t.number === targetNumber
            );

            let pointsEarned = 0;

            if (targetIndex !== -1) {
              const targets = [...currentPlayer.targets];
              const target = { ...targets[targetIndex] };

              // Apply the hit(s) and check if it closes the number
              const newHits = Math.min(target.hits + multiplier, 3);
              const wasClosed = target.closed;
              const isClosed = newHits >= 3;

              // Calculate extra hits that would go toward scoring
              const extraHits = target.hits + multiplier - 3;
              const hasExtraHits = !wasClosed && isClosed && extraHits > 0;

              // Update target hits and closed status
              target.hits = newHits;
              target.closed = isClosed;

              // Handle scoring based on game type
              if (newGame.gameType !== "no-score") {
                // Check if any opponent hasn't closed this number
                const someOpponentNotClosed = players.some(
                  (p) =>
                    p.id !== currentPlayer.id && !p.targets[targetIndex].closed
                );

                if (someOpponentNotClosed) {
                  // Calculate point value
                  const pointValue =
                    targetNumber === "Bull" ? 25 : Number(targetNumber);

                  // For standard cricket, add points if target was already closed OR if this throw closes it with extra hits
                  if (
                    newGame.gameType === "standard" &&
                    (wasClosed || hasExtraHits)
                  ) {
                    // Calculate points to add (all hits if already closed, only extra hits if just closing)
                    const pointsToAdd = wasClosed
                      ? multiplier * pointValue
                      : extraHits * pointValue;

                    // Update player score
                    target.points += pointsToAdd;
                    currentPlayer.totalScore += pointsToAdd;
                    pointsEarned = pointsToAdd;
                  }
                  // For cutthroat, add points to opponents if target was already closed OR if this throw closes it with extra hits
                  else if (
                    newGame.gameType === "cutthroat" &&
                    (wasClosed || hasExtraHits)
                  ) {
                    // Calculate points to add (all hits if already closed, only extra hits if just closing)
                    const pointsToAdd = wasClosed
                      ? multiplier * pointValue
                      : extraHits * pointValue;

                    players.forEach((player, idx) => {
                      if (
                        idx !== playerIndex &&
                        !player.targets[targetIndex].closed
                      ) {
                        players[idx] = {
                          ...player,
                          totalScore: player.totalScore + pointsToAdd,
                        };
                      }
                    });

                    // Track points for the round history
                    pointsEarned = pointsToAdd;
                  }
                }
              }

              // Update the target in the targets array
              targets[targetIndex] = target;
              currentPlayer.targets = targets;
            }

            // Update the dart's points
            newDart.points = pointsEarned;
            currentRound.darts.push(newDart);
            currentRound.totalPoints += pointsEarned;

            // Update the player
            players[playerIndex] = currentPlayer;

            // Check if the game is finished
            let isGameFinished = false;
            let winnerId = null;

            // Win condition: first to close all numbers
            if (newGame.winCondition === "first-closed") {
              const playerClosedAll = currentPlayer.targets.every(
                (t) => t.closed
              );

              if (playerClosedAll) {
                isGameFinished = true;
                winnerId = currentPlayer.id;
              }
            }
            // Win condition: highest points after all numbers closed
            else if (newGame.winCondition === "points") {
              // Check if current player has closed all numbers
              const currentPlayerClosedAll = currentPlayer.targets.every(
                (t) => t.closed
              );

              if (currentPlayerClosedAll) {
                // In standard mode: player needs highest score to win
                // In cutthroat mode: player needs lowest score to win
                if (newGame.gameType === "cutthroat") {
                  // Check if current player has lowest score
                  const playerScores = players.map((p) => ({
                    id: p.id,
                    score: p.totalScore,
                  }));
                  const lowestScore = Math.min(
                    ...playerScores.map((p) => p.score)
                  );
                  const playersWithLowestScore = playerScores.filter(
                    (p) => p.score === lowestScore
                  );

                  // Only win if this player has the lowest score
                  if (
                    playersWithLowestScore.some(
                      (p) => p.id === currentPlayer.id
                    )
                  ) {
                    isGameFinished = true;
                    winnerId = currentPlayer.id;
                  }
                } else {
                  // Standard cricket: check if current player has highest score
                  const playerScores = players.map((p) => ({
                    id: p.id,
                    score: p.totalScore,
                  }));
                  const highestScore = Math.max(
                    ...playerScores.map((p) => p.score)
                  );
                  const playersWithHighestScore = playerScores.filter(
                    (p) => p.score === highestScore
                  );

                  // Only win if this player has the highest score
                  if (
                    playersWithHighestScore.some(
                      (p) => p.id === currentPlayer.id
                    )
                  ) {
                    isGameFinished = true;
                    winnerId = currentPlayer.id;
                  }
                }
              }
            }

            // Mark the winner
            if (isGameFinished && winnerId) {
              players.forEach((player) => {
                if (player.id === winnerId) {
                  player.isWinner = true;
                }
              });
            }

            // If game is finished or player has used 3 darts, end the turn
            if (isGameFinished || currentPlayer.currentDartIndex >= 3) {
              // Save the current round
              newGame.rounds.push({ ...currentRound });

              if (!isGameFinished) {
                // Move to the next player
                const nextPlayerIndex = (playerIndex + 1) % players.length;
                newGame.currentPlayerIndex = nextPlayerIndex;

                // Reset current player's dart index
                players[playerIndex].currentDartIndex = 0;

                // Create a new round for the next player
                newGame.currentRound = {
                  playerId: players[nextPlayerIndex].id,
                  darts: [],
                  totalPoints: 0,
                };
              } else {
                // If game is finished, keep the last round
                newGame.currentRound = currentRound;
              }
            } else {
              // If turn continues, update the current round
              newGame.currentRound = currentRound;
            }

            // Update the game state
            newGame.players = players;
            newGame.isGameFinished = isGameFinished;

            return {
              ...state,
              currentGame: newGame,
            };
          });
        } catch (error) {
          console.error("Error in recordHit:", error);
          // Don't update the state if there's an error
        }
      },

      undoLastHit: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };

          // If there are darts in the current round, remove the last one
          if (newGame.currentRound && newGame.currentRound.darts.length > 0) {
            const currentRound = { ...newGame.currentRound };
            const players = [...newGame.players];
            const playerIndex = newGame.currentPlayerIndex;
            const currentPlayer = { ...players[playerIndex] };

            // Remove last dart
            const lastDart = currentRound.darts.pop();
            currentRound.totalPoints -= lastDart?.points || 0;

            // Decrease darts thrown and current dart index
            currentPlayer.dartsThrown = Math.max(
              0,
              currentPlayer.dartsThrown - 1
            );
            currentPlayer.currentDartIndex = Math.max(
              0,
              currentPlayer.currentDartIndex - 1
            );

            // Update targets if needed
            if (lastDart) {
              const targetIndex = currentPlayer.targets.findIndex(
                (t) => t.number === lastDart.targetNumber
              );

              if (targetIndex !== -1) {
                const targets = [...currentPlayer.targets];
                const target = { ...targets[targetIndex] };

                // Revert hits
                target.hits = Math.max(0, target.hits - lastDart.multiplier);
                target.closed = target.hits >= 3;

                // Revert points if any were scored
                if (lastDart.points > 0) {
                  // For standard cricket, remove points from the current player
                  if (newGame.gameType === "standard") {
                    target.points = Math.max(
                      0,
                      target.points - lastDart.points
                    );
                    currentPlayer.totalScore = Math.max(
                      0,
                      currentPlayer.totalScore - lastDart.points
                    );
                  }
                  // For cutthroat cricket, remove points from opponents
                  else if (newGame.gameType === "cutthroat") {
                    players.forEach((player, idx) => {
                      if (
                        idx !== playerIndex &&
                        !player.targets[targetIndex].closed
                      ) {
                        players[idx] = {
                          ...player,
                          totalScore: Math.max(
                            0,
                            player.totalScore - lastDart.points
                          ),
                        };
                      }
                    });
                  }
                }

                targets[targetIndex] = target;
                currentPlayer.targets = targets;
              }
            }

            // Update player
            players[playerIndex] = currentPlayer;
            newGame.players = players;
            newGame.currentRound = currentRound;

            return {
              ...state,
              currentGame: newGame,
            };
          }
          // If there are no darts in the current round but there are previous rounds
          else if (newGame.rounds.length > 0) {
            // Get the last completed round
            const lastRound = newGame.rounds.pop();

            if (lastRound) {
              const players = [...newGame.players];

              // Find the player from the last round
              const lastPlayerIndex = players.findIndex(
                (p) => p.id === lastRound.playerId
              );

              if (lastPlayerIndex !== -1) {
                // Set current player to the player from the last round
                newGame.currentPlayerIndex = lastPlayerIndex;
                newGame.currentRound = { ...lastRound };

                // Set dart index to 3 (turn completed)
                players[lastPlayerIndex].currentDartIndex = 3;

                newGame.players = players;
              }
            }

            return {
              ...state,
              currentGame: newGame,
            };
          }

          // Default case: just move to previous player
          const prevPlayerIndex =
            (newGame.currentPlayerIndex - 1 + newGame.players.length) %
            newGame.players.length;
          newGame.currentPlayerIndex = prevPlayerIndex;

          return {
            ...state,
            currentGame: newGame,
          };
        });
      },

      // Add function to manually end a player's turn
      finishTurn: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };
          const players = [...newGame.players];
          const playerIndex = newGame.currentPlayerIndex;

          // Save the current round
          if (newGame.currentRound) {
            newGame.rounds.push({ ...newGame.currentRound });
          }

          // Move to the next player
          const nextPlayerIndex = (playerIndex + 1) % players.length;
          newGame.currentPlayerIndex = nextPlayerIndex;

          // Reset current player's dart index
          if (playerIndex >= 0 && playerIndex < players.length) {
            players[playerIndex].currentDartIndex = 0;
          }

          // Create a new round for the next player
          newGame.currentRound = {
            playerId: players[nextPlayerIndex].id,
            darts: [],
            totalPoints: 0,
          };

          newGame.players = players;

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

      getCricketPlayers: () => {
        // Return an empty array or transformed cached players
        return (get().currentGame?.players || []) as CricketPlayer[];
      },

      setCricketPlayers: (players) => {
        console.log("Setting cricket players:", players);
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-cricket-storage",
      version: 1,
      partialize: (state) => ({
        gameSettings: state.gameSettings,
      }),
    }
  )
);
