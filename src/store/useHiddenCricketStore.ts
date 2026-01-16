import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interfaces for Hidden Cricket Game
export interface HiddenCricketTarget {
  number: number | string; // 15-20 or 'Bull' (but hidden from players)
  hits: number; // 0-3 hits
  closed: boolean;
  points: number; // Points scored on this target
}

// New interfaces for round tracking
export interface HiddenCricketDart {
  targetNumber: number | string | "Miss"; // "Miss" for missed darts
  multiplier: number;
  points: number;
  // Store previous state for easy undo
  previousHits?: number;
  previousTargetPoints?: number;
  previousPlayerScore?: number;
  previousOpponentScores?: Record<number, number>; // For cutthroat mode
}

export interface HiddenCricketRound {
  playerId: number;
  darts: HiddenCricketDart[];
  totalPoints: number;
}

export interface HiddenCricketPlayer {
  id: number;
  name: string;
  totalScore: number;
  dartsThrown: number;
  targets: HiddenCricketTarget[];
  isWinner: boolean;
  // Track how many darts have been used in current turn (0-2)
  currentDartIndex: number;
}

interface HiddenCricketGameSettings {
  gameType: "standard" | "cutthroat" | "no-score";
  winCondition: "first-closed" | "points";
  lastBull: boolean;
  defaultLegs: number;
}

interface HiddenCricketGameState {
  players: HiddenCricketPlayer[];
  currentPlayerIndex: number;
  isGameFinished: boolean;
  gameType: "standard" | "cutthroat" | "no-score";
  winCondition: "first-closed" | "points";
  lastBull: boolean;
  // Hidden numbers that are valid targets (randomly selected)
  hiddenNumbers: (number | string)[];
  // Round history
  rounds: HiddenCricketRound[];
  currentRound: HiddenCricketRound | null;
  totalLegs: number;
  currentLeg: number;
  legsWon: Record<number, number>;
  completedLegs: HiddenCricketLeg[];
}

export interface HiddenCricketLeg {
  legNumber: number;
  winnerId: number;
  rounds: HiddenCricketRound[];
  hiddenNumbers: (number | string)[];
}

interface HiddenCricketStoreState {
  // Game settings
  gameSettings: HiddenCricketGameSettings;
  updateGameSettings: (settings: Partial<HiddenCricketGameSettings>) => void;

  // Current game state
  currentGame: HiddenCricketGameState | null;
  startGame: (
    gameType: HiddenCricketGameState["gameType"],
    winCondition: HiddenCricketGameState["winCondition"],
    lastBull: boolean,
    playerIds: number[],
    totalLegs: number
  ) => void;
  recordHit: (targetNumber: number | string, multiplier: number) => void;
  recordMiss: () => void;
  undoLastHit: () => void;
  endGame: () => void;
  // Add function to advance to next player manually
  finishTurn: () => void;

  // Get all players (for integration with main store)
  getHiddenCricketPlayers: () => HiddenCricketPlayer[];
  // Set players from main store
  setHiddenCricketPlayers: (players: { id: number; name: string }[]) => void;
  
  // Check if a number is a valid hidden target
  isHiddenNumber: (number: number | string) => boolean;
}

// Default array of cricket targets (same as regular cricket)
const createDefaultTargets = (hiddenNumbers: (number | string)[]): HiddenCricketTarget[] => {
  return hiddenNumbers.map((num) => ({
    number: num,
    hits: 0,
    closed: false,
    points: 0,
  }));
};

// Generate random hidden numbers (7 numbers: 6 random from 1-20 + Bull)
const generateHiddenNumbers = (): (number | string)[] => {
  const numbers1to20 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  // Shuffle using Fisher-Yates algorithm for true randomness
  const shuffled = [...numbers1to20];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Take 6 random numbers from the shuffled array
  const selected = shuffled.slice(0, 6);
  // Always include Bull
  return [...selected, "Bull"];
};

// Reference to main store players to avoid circular dependencies
let cachedPlayers: { id: number; name: string }[] = [];

// Function to update cached players
export const updateHiddenCricketCachedPlayers = (
  players: { id: number; name: string }[]
) => {
  cachedPlayers = [...players];
};

// Create the Hidden Cricket store with persistence
export const useHiddenCricketStore = create<HiddenCricketStoreState>()(
  persist(
    (set, get) => ({
      gameSettings: {
        gameType: "cutthroat",
        winCondition: "points",
        lastBull: false,
        defaultLegs: 3,
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (gameType, winCondition, lastBull, playerIds, totalLegs) => {
        console.log("Starting hidden cricket game with player IDs:", playerIds);
        console.log("Cached players:", cachedPlayers);

        // Generate random hidden numbers
        const hiddenNumbers = generateHiddenNumbers();

        // Create a new game with the selected settings
        set((state) => {
          // Find the selected players from the cached players
          const selectedPlayers = cachedPlayers.filter((player) =>
            playerIds.includes(player.id)
          );

          console.log("Selected players:", selectedPlayers);
          console.log("Hidden numbers:", hiddenNumbers);

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

          // Create hidden cricket players with the necessary in-game properties
          const hiddenCricketPlayers: HiddenCricketPlayer[] = selectedPlayers.map(
            (player) => ({
              id: player.id,
              name: player.name,
              totalScore: 0,
              dartsThrown: 0,
              targets: createDefaultTargets(hiddenNumbers),
              isWinner: false,
              currentDartIndex: 0,
            })
          );

          // Initialize first round
          const initialRound: HiddenCricketRound = {
            playerId: hiddenCricketPlayers[0].id,
            darts: [],
            totalPoints: 0,
          };

          const legsWon = playerIds.reduce<Record<number, number>>(
            (acc, id) => ({ ...acc, [id]: 0 }),
            {}
          );

          return {
            ...state,
            currentGame: {
              players: hiddenCricketPlayers,
              currentPlayerIndex: 0,
              isGameFinished: false,
              gameType,
              winCondition,
              lastBull,
              hiddenNumbers,
              rounds: [],
              currentRound: initialRound,
              totalLegs,
              currentLeg: 1,
              legsWon,
              completedLegs: [],
            },
          };
        });
      },

      isHiddenNumber: (number: number | string) => {
        const game = get().currentGame;
        if (!game) return false;
        return game.hiddenNumbers.includes(number);
      },

      recordHit: (targetNumber, multiplier) => {
        try {
          set((state) => {
            // Guard clauses
            if (!state.currentGame) {
              console.warn("recordHit: No current game");
              return state;
            }

            // CRITICAL: Check if the target number is a valid hidden number
            // If not valid, do NOT record anything - return unchanged state
            if (!state.currentGame.hiddenNumbers.includes(targetNumber)) {
              console.warn(`recordHit: Number ${targetNumber} is not a valid hidden target - NOT recording dart. Hidden numbers are:`, state.currentGame.hiddenNumbers);
              return state; // Return unchanged state - no dart recorded, no state changes
            }

            // LAST BULL RULE: If lastBull is enabled and target is Bull,
            // check if all other 5 numbers are closed. If not, treat as miss.
            if (state.currentGame.lastBull && targetNumber === "Bull") {
              const currentPlayer = state.currentGame.players[state.currentGame.currentPlayerIndex];
              // Get all non-Bull targets
              const nonBullTargets = currentPlayer.targets.filter((t) => t.number !== "Bull");
              // Check if all 5 non-Bull targets are closed
              const allNonBullClosed = nonBullTargets.every((t) => t.closed);
              
              if (!allNonBullClosed) {
                console.warn(`recordHit: Last Bull rule active - Bull hit doesn't count until all other 5 numbers are closed. Closed: ${nonBullTargets.filter(t => t.closed).length}/5. Recording as miss.`);
                // Treat as miss - dart is thrown but doesn't count toward bull
                // Record it as a miss inline
                const newGame = { ...state.currentGame };
                const players = [...newGame.players];
                const playerIndex = newGame.currentPlayerIndex;
                const currentPlayerCopy = { ...players[playerIndex] };
                
                // Create or update the current round
                let currentRound = newGame.currentRound
                  ? { ...newGame.currentRound }
                  : { playerId: currentPlayerCopy.id, darts: [], totalPoints: 0 };
                
                // Track the miss dart
                const newDart: HiddenCricketDart = {
                  targetNumber: "Miss",
                  multiplier: 0,
                  points: 0,
                  previousPlayerScore: currentPlayerCopy.totalScore,
                };
                
                // Add darts thrown count
                currentPlayerCopy.dartsThrown += 1;
                currentPlayerCopy.currentDartIndex += 1;
                
                // Add miss to round
                currentRound.darts.push(newDart);
                
                // Update the player
                players[playerIndex] = currentPlayerCopy;
                
                // Update the game state
                newGame.players = players;
                newGame.currentRound = currentRound;
                
                return {
                  ...state,
                  currentGame: newGame,
                };
              }
            }

            console.log(`recordHit: Valid hidden number ${targetNumber} with multiplier ${multiplier} - proceeding to record`);

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            const playerIndex = newGame.currentPlayerIndex;
            const currentPlayer = { ...players[playerIndex] };

            // Create or update the current round
            let currentRound = newGame.currentRound
              ? { ...newGame.currentRound }
              : { playerId: currentPlayer.id, darts: [], totalPoints: 0 };

            // Find the target in the player's targets
            const targetIndex = currentPlayer.targets.findIndex(
              (t) => t.number === targetNumber
            );

            // Store previous state before making changes
            let previousHits = 0;
            let previousTargetPoints = 0;
            let previousPlayerScore = currentPlayer.totalScore;
            const previousOpponentScores: Record<number, number> = {};

            if (targetIndex !== -1) {
              const targets = [...currentPlayer.targets];
              const target = { ...targets[targetIndex] };
              
              // Store previous state
              previousHits = target.hits;
              previousTargetPoints = target.points;
              
              // Store opponent scores for cutthroat mode
              if (newGame.gameType === "cutthroat") {
                players.forEach((player, idx) => {
                  if (idx !== playerIndex) {
                    previousOpponentScores[player.id] = player.totalScore;
                  }
                });
              }
            }

            // Track the dart with previous state
            const newDart: HiddenCricketDart = {
              targetNumber,
              multiplier,
              points: 0, // Will be updated with actual points
              previousHits,
              previousTargetPoints,
              previousPlayerScore,
              previousOpponentScores: Object.keys(previousOpponentScores).length > 0 
                ? previousOpponentScores 
                : undefined,
            };

            // Add darts thrown count (for statistics only, no limit)
            currentPlayer.dartsThrown += 1;
            currentPlayer.currentDartIndex += 1;

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
                  // For cutthroat, add points to ALL opponents who haven't closed this number
                  // Points are given when target was already closed OR if this throw closes it with extra hits
                  else if (
                    newGame.gameType === "cutthroat" &&
                    (wasClosed || hasExtraHits)
                  ) {
                    // Calculate points to add (all hits if already closed, only extra hits if just closing)
                    const pointsToAdd = wasClosed
                      ? multiplier * pointValue
                      : extraHits * pointValue;

                    // Give points to all players who haven't closed this number
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

            // Always keep current round in state
            newGame.currentRound = currentRound;

            // Update the game state
            newGame.players = players;
            newGame.isGameFinished = isGameFinished;

            // Handle leg win logic
            if (isGameFinished && winnerId) {
              const updatedLegsWon = { ...newGame.legsWon };
              updatedLegsWon[winnerId] = (updatedLegsWon[winnerId] || 0) + 1;

              const legRounds = [...newGame.rounds, { ...currentRound }];
              const completedLeg: HiddenCricketLeg = {
                legNumber: newGame.currentLeg,
                winnerId,
                rounds: legRounds,
                hiddenNumbers: newGame.hiddenNumbers,
              };

              const legsToWin = Math.ceil(newGame.totalLegs / 2);
              const hasMatchWinner = updatedLegsWon[winnerId] >= legsToWin;

              newGame.completedLegs = [...newGame.completedLegs, completedLeg];
              newGame.legsWon = updatedLegsWon;

              if (hasMatchWinner) {
                players.forEach((player) => {
                  if (player.id === winnerId) {
                    player.isWinner = true;
                  }
                });
                newGame.rounds = legRounds;
                newGame.isGameFinished = true;
              } else {
                const nextPlayerIndex = (playerIndex + 1) % players.length;
                const nextHiddenNumbers = generateHiddenNumbers();
                const resetPlayers = players.map((player) => ({
                  ...player,
                  totalScore: 0,
                  dartsThrown: 0,
                  targets: createDefaultTargets(nextHiddenNumbers),
                  isWinner: false,
                  currentDartIndex: 0,
                }));

                newGame.players = resetPlayers;
                newGame.currentLeg += 1;
                newGame.currentPlayerIndex = nextPlayerIndex;
                newGame.hiddenNumbers = nextHiddenNumbers;
                newGame.rounds = [];
                newGame.currentRound = {
                  playerId: resetPlayers[nextPlayerIndex].id,
                  darts: [],
                  totalPoints: 0,
                };
                newGame.isGameFinished = false;
              }
            }

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

      recordMiss: () => {
        try {
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

            // Track the miss dart
            const newDart: HiddenCricketDart = {
              targetNumber: "Miss",
              multiplier: 0,
              points: 0,
              previousPlayerScore: currentPlayer.totalScore,
            };

            // Add darts thrown count
            currentPlayer.dartsThrown += 1;
            currentPlayer.currentDartIndex += 1;

            // Add miss to round
            currentRound.darts.push(newDart);

            // Update the player
            players[playerIndex] = currentPlayer;

            // Update the game state
            newGame.players = players;
            newGame.currentRound = currentRound;

            return {
              ...state,
              currentGame: newGame,
            };
          });
        } catch (error) {
          console.error("Error in recordMiss:", error);
          // Don't update the state if there's an error
        }
      },

      undoLastHit: () => {
        set((state) => {
          if (!state.currentGame) return state;

          const newGame = { ...state.currentGame };
          const players = [...newGame.players];

          // Find the last dart - either in current round or last completed round
          let lastDart: HiddenCricketDart | undefined;
          let roundToModify: HiddenCricketRound | null = null;
          let playerIndex = -1;
          let isCurrentRound = false;

          // Check current round first
          if (newGame.currentRound && newGame.currentRound.darts.length > 0) {
            roundToModify = { ...newGame.currentRound };
            lastDart = roundToModify.darts[roundToModify.darts.length - 1];
            playerIndex = newGame.currentPlayerIndex;
            isCurrentRound = true;
          }
          // If no darts in current round, check last completed round
          else if (newGame.rounds.length > 0) {
            const lastRound = newGame.rounds[newGame.rounds.length - 1];
            if (lastRound && lastRound.darts.length > 0) {
              roundToModify = { ...lastRound };
              lastDart = roundToModify.darts[roundToModify.darts.length - 1];
              playerIndex = players.findIndex(
                (p) => p.id === lastRound.playerId
              );
              isCurrentRound = false;
            }
          }

          // If no dart found, nothing to undo
          if (!lastDart || !roundToModify || playerIndex === -1) {
            return state;
          }

          const currentPlayer = { ...players[playerIndex] };

          // Remove last dart from the round
          roundToModify.darts.pop();
          roundToModify.totalPoints -= lastDart.points || 0;

          // Decrease darts thrown and current dart index
          currentPlayer.dartsThrown = Math.max(
            0,
            currentPlayer.dartsThrown - 1
          );
          currentPlayer.currentDartIndex = Math.max(
            0,
            currentPlayer.currentDartIndex - 1
          );

          // Update targets if needed - restore previous state directly
          const targetIndex = currentPlayer.targets.findIndex(
            (t) => t.number === lastDart.targetNumber
          );

          if (targetIndex !== -1 && lastDart.previousHits !== undefined) {
            const targets = [...currentPlayer.targets];
            const target = { ...targets[targetIndex] };

            // Restore previous state directly from stored values
            target.hits = lastDart.previousHits;
            target.closed = target.hits >= 3;
            
            // Restore previous target points
            if (lastDart.previousTargetPoints !== undefined) {
              target.points = lastDart.previousTargetPoints;
            }

            // Restore previous player score
            if (lastDart.previousPlayerScore !== undefined) {
              currentPlayer.totalScore = lastDart.previousPlayerScore;
            }

            // Restore opponent scores for cutthroat mode
            if (newGame.gameType === "cutthroat" && lastDart.previousOpponentScores) {
              players.forEach((player, idx) => {
                if (idx !== playerIndex && lastDart.previousOpponentScores![player.id] !== undefined) {
                  players[idx] = {
                    ...player,
                    totalScore: lastDart.previousOpponentScores![player.id],
                  };
                }
              });
            }

            targets[targetIndex] = target;
            currentPlayer.targets = targets;
          }

          // Update player
          players[playerIndex] = currentPlayer;
          newGame.players = players;

          // Update round state
          if (isCurrentRound) {
            // Update current round
            newGame.currentRound = roundToModify;
          } else {
            // Update the last completed round
            newGame.rounds[newGame.rounds.length - 1] = roundToModify;
            // If round is now empty, remove it and move to previous player
            if (roundToModify.darts.length === 0) {
              newGame.rounds.pop();
              const prevPlayerIndex =
                (playerIndex - 1 + players.length) % players.length;
              newGame.currentPlayerIndex = prevPlayerIndex;
              // Create new empty round for previous player
              newGame.currentRound = {
                playerId: players[prevPlayerIndex].id,
                darts: [],
                totalPoints: 0,
              };
            } else {
              // Restore the round as current round
              newGame.currentPlayerIndex = playerIndex;
              newGame.currentRound = roundToModify;
              newGame.rounds.pop();
            }
          }

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

          // Reset current player's dart index (for statistics)
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

      getHiddenCricketPlayers: () => {
        // Return an empty array or transformed cached players
        return (get().currentGame?.players || []) as HiddenCricketPlayer[];
      },

      setHiddenCricketPlayers: (players) => {
        console.log("Setting hidden cricket players:", players);
        cachedPlayers = [...players];
      },
    }),
    {
      name: "wedart-hidden-cricket-storage",
      version: 1,
      partialize: (state) => ({
        gameSettings: state.gameSettings,
      }),
    }
  )
);

