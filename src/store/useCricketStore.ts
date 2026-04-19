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
  // Store previous state for easy undo
  previousHits?: number;
  previousTargetPoints?: number;
  previousPlayerScore?: number;
  previousOpponentScores?: Record<number, number>; // For cutthroat mode
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
  defaultLegs: number;
  cricketVariant?: CricketVariant;
}

interface CricketGameState {
  players: CricketPlayer[];
  currentPlayerIndex: number;
  isGameFinished: boolean;
  gameType: "standard" | "cutthroat" | "no-score";
  winCondition: "first-closed" | "points"; // Win by closing all numbers first or by points
  cricketVariant: CricketVariant;
  // Add round history
  rounds: CricketRound[];
  currentRound: CricketRound | null;
  totalLegs: number;
  currentLeg: number;
  legsWon: Record<number, number>;
  completedLegs: CricketLeg[];
}

export interface CricketLeg {
  legNumber: number;
  winnerId: number;
  rounds: CricketRound[];
}

interface CricketStoreState {
  // Game settings
  gameSettings: GameSettings;
  updateGameSettings: (settings: Partial<GameSettings>) => void;

  // Current game state
  currentGame: CricketGameState | null;
  startGame: (
    gameType: CricketGameState["gameType"],
    winCondition: CricketGameState["winCondition"],
    playerIds: number[],
    totalLegs: number,
    cricketVariant?: CricketVariant
  ) => void;
  recordHit: (
    targetNumber: number | string,
    multiplier: number,
    forPlayerId?: number
  ) => void;
  undoLastHit: () => void;
  endGame: () => void;
  // Add function to advance to next player manually
  finishTurn: () => void;

  // Get all players (for integration with main store)
  getCricketPlayers: () => CricketPlayer[];
  // Set players from main store
  setCricketPlayers: (players: { id: number; name: string }[]) => void;
}

export type CricketVariant = "standard" | "osha";

// Default array of cricket targets (Osha adds Triple and Double; Bull stays last)
const createDefaultTargets = (variant: CricketVariant = "standard"): CricketTarget[] => {
  const standard: CricketTarget[] = [
    { number: 20, hits: 0, closed: false, points: 0 },
    { number: 19, hits: 0, closed: false, points: 0 },
    { number: 18, hits: 0, closed: false, points: 0 },
    { number: 17, hits: 0, closed: false, points: 0 },
    { number: 16, hits: 0, closed: false, points: 0 },
    { number: 15, hits: 0, closed: false, points: 0 },
    { number: "Bull", hits: 0, closed: false, points: 0 },
  ];
  if (variant === "osha") {
    return [
      { number: 20, hits: 0, closed: false, points: 0 },
      { number: 19, hits: 0, closed: false, points: 0 },
      { number: 18, hits: 0, closed: false, points: 0 },
      { number: 17, hits: 0, closed: false, points: 0 },
      { number: 16, hits: 0, closed: false, points: 0 },
      { number: 15, hits: 0, closed: false, points: 0 },
      { number: "Triple", hits: 0, closed: false, points: 0 },
      { number: "Double", hits: 0, closed: false, points: 0 },
      { number: "Bull", hits: 0, closed: false, points: 0 },
    ];
  }
  return standard;
};

/** Replay one dart (used to rebuild leg state after undoing a completed leg). */
function applyCricketDartReplay(
  players: CricketPlayer[],
  playerIndex: number,
  dart: CricketDart,
  gameType: CricketGameState["gameType"]
): void {
  const targetNumber = dart.targetNumber;
  const multiplier = dart.multiplier;
  const currentPlayer = { ...players[playerIndex] };

  currentPlayer.dartsThrown += 1;
  currentPlayer.currentDartIndex += 1;

  const targetIndex = currentPlayer.targets.findIndex(
    (t) => t.number === targetNumber
  );

  if (targetIndex !== -1) {
    const targets = [...currentPlayer.targets];
    const target = { ...targets[targetIndex] };
    const newHits = Math.min(target.hits + multiplier, 3);
    const wasClosed = target.closed;
    const isClosed = newHits >= 3;
    const extraHits = target.hits + multiplier - 3;
    const hasExtraHits = !wasClosed && isClosed && extraHits > 0;

    target.hits = newHits;
    target.closed = isClosed;

    if (gameType !== "no-score") {
      const someOpponentNotClosed = players.some(
        (p, idx) =>
          idx !== playerIndex && !p.targets[targetIndex].closed
      );

      if (someOpponentNotClosed) {
        const pointValue =
          targetNumber === "Bull" ||
          targetNumber === "Triple" ||
          targetNumber === "Double"
            ? 25
            : Number(targetNumber);

        if (gameType === "standard" && (wasClosed || hasExtraHits)) {
          const pointsToAdd = wasClosed
            ? multiplier * pointValue
            : extraHits * pointValue;
          target.points += pointsToAdd;
          currentPlayer.totalScore += pointsToAdd;
        } else if (gameType === "cutthroat" && (wasClosed || hasExtraHits)) {
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
        }
      }
    }

    targets[targetIndex] = target;
    currentPlayer.targets = targets;
  }

  players[playerIndex] = currentPlayer;
}

function replayCricketLegRounds(
  legRounds: CricketRound[],
  playerTemplates: { id: number; name: string }[],
  gameType: CricketGameState["gameType"],
  cricketVariant: CricketVariant
): CricketPlayer[] {
  const players: CricketPlayer[] = playerTemplates.map((p) => ({
    id: p.id,
    name: p.name,
    totalScore: 0,
    dartsThrown: 0,
    targets: createDefaultTargets(cricketVariant),
    isWinner: false,
    currentDartIndex: 0,
  }));

  for (const round of legRounds) {
    const playerIndex = players.findIndex((pl) => pl.id === round.playerId);
    if (playerIndex === -1) continue;
    for (const dart of round.darts) {
      applyCricketDartReplay(players, playerIndex, dart, gameType);
    }
  }
  return players;
}

function removeLastDartFromCricketLegRounds(
  legRounds: CricketRound[]
): { modifiedLegRounds: CricketRound[]; removedDart: CricketDart } | null {
  if (legRounds.length === 0) return null;
  const clone = legRounds.map((r) => ({
    ...r,
    darts: [...r.darts],
    totalPoints: r.totalPoints,
  }));
  const lastRi = clone.length - 1;
  const lastRound = clone[lastRi];
  if (lastRound.darts.length === 0) return null;
  const removedDart = lastRound.darts[lastRound.darts.length - 1];
  lastRound.darts = lastRound.darts.slice(0, -1);
  lastRound.totalPoints -= removedDart.points || 0;
  if (lastRound.darts.length === 0) {
    clone.pop();
  } else {
    clone[lastRi] = lastRound;
  }
  return { modifiedLegRounds: clone, removedDart };
}

function playerStillHasWonLeg(
  currentPlayer: CricketPlayer,
  players: CricketPlayer[],
  gameType: CricketGameState["gameType"],
  winCondition: CricketGameState["winCondition"]
): boolean {
  if (winCondition === "first-closed") {
    return currentPlayer.targets.every((t) => t.closed);
  }
  const currentPlayerClosedAll = currentPlayer.targets.every((t) => t.closed);
  if (!currentPlayerClosedAll) return false;
  if (winCondition !== "points") return false;
  if (gameType === "cutthroat") {
    const lowestScore = Math.min(...players.map((p) => p.totalScore));
    return players
      .filter((p) => p.totalScore === lowestScore)
      .some((p) => p.id === currentPlayer.id);
  }
  if (gameType === "standard") {
    const highestScore = Math.max(...players.map((p) => p.totalScore));
    return players
      .filter((p) => p.totalScore === highestScore)
      .some((p) => p.id === currentPlayer.id);
  }
  return currentPlayerClosedAll;
}

function maybeRevertCompletedLegAfterUndo(newGame: CricketGameState): void {
  if (newGame.completedLegs.length === 0) return;
  const last = newGame.completedLegs[newGame.completedLegs.length - 1];
  const idx = newGame.players.findIndex((p) => p.id === last.winnerId);
  if (idx === -1) return;
  if (
    playerStillHasWonLeg(
      newGame.players[idx],
      newGame.players,
      newGame.gameType,
      newGame.winCondition
    )
  ) {
    return;
  }
  newGame.completedLegs = newGame.completedLegs.slice(0, -1);
  newGame.legsWon = { ...newGame.legsWon };
  newGame.legsWon[last.winnerId] = Math.max(
    0,
    (newGame.legsWon[last.winnerId] || 0) - 1
  );
  newGame.isGameFinished = false;
  newGame.players = newGame.players.map((p) => ({ ...p, isWinner: false }));
}

// Reference to main store players to avoid circular dependencies
let cachedPlayers: { id: number; name: string }[] = [];

// Function to update cached players - add this function
export const updateCachedPlayers = (
  players: { id: number; name: string }[]
) => {
  cachedPlayers = [...players];
};

// Removed debounce delay to allow rapid clicking

// Create the Cricket store with persistence
export const useCricketStore = create<CricketStoreState>()(
  persist(
    (set, get) => ({
      gameSettings: {
        gameType: "standard",
        winCondition: "points",
        defaultLegs: 3,
        cricketVariant: "standard",
      },
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings },
        })),

      currentGame: null,
      startGame: (gameType, winCondition, playerIds, totalLegs, cricketVariant = "standard") => {
        console.log("Starting game with player IDs:", playerIds);
        console.log("Cached players:", cachedPlayers);

        // Create a new game with the selected settings
        set((state) => {
          // Find the selected players from the cached players in selection order
          const selectedPlayers = playerIds
            .map((playerId) =>
              cachedPlayers.find((player) => player.id === playerId)
            )
            .filter(
              (player): player is { id: number; name: string } => Boolean(player)
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
              targets: createDefaultTargets(cricketVariant),
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

          const legsWon = playerIds.reduce<Record<number, number>>(
            (acc, id) => ({ ...acc, [id]: 0 }),
            {}
          );

          return {
            ...state,
            currentGame: {
              players: cricketPlayers,
              currentPlayerIndex: 0,
              isGameFinished: false,
              gameType,
              winCondition,
              cricketVariant,
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

      recordHit: (targetNumber, multiplier, forPlayerId) => {
        try {
          set((state) => {
            // Guard clauses
            if (!state.currentGame) return state;

            // Create shallow copies to work with
            const newGame = { ...state.currentGame };
            const players = [...newGame.players];
            let playerIndex = newGame.currentPlayerIndex;

            if (forPlayerId !== undefined) {
              const targetIdx = players.findIndex((p) => p.id === forPlayerId);
              if (targetIdx === -1) return state;
              if (targetIdx !== playerIndex) {
                if (
                  newGame.currentRound &&
                  newGame.currentRound.darts.length > 0
                ) {
                  newGame.rounds = [
                    ...newGame.rounds,
                    { ...newGame.currentRound },
                  ];
                  players[playerIndex] = {
                    ...players[playerIndex],
                    currentDartIndex: 0,
                  };
                }
                playerIndex = targetIdx;
                newGame.currentPlayerIndex = targetIdx;
                newGame.currentRound = {
                  playerId: players[targetIdx].id,
                  darts: [],
                  totalPoints: 0,
                };
              }
            }

            const currentPlayer = { ...players[playerIndex] };

            // Create or update the current round
            let currentRound = newGame.currentRound
              ? { ...newGame.currentRound, darts: [...newGame.currentRound.darts] }
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
            const newDart: CricketDart = {
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
                  // Calculate point value (Bull, Triple, Double = 25)
                  const pointValue =
                    targetNumber === "Bull" ||
                    targetNumber === "Triple" ||
                    targetNumber === "Double"
                      ? 25
                      : Number(targetNumber);

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
              const completedLeg: CricketLeg = {
                legNumber: newGame.currentLeg,
                winnerId,
                rounds: legRounds,
              };

              const legsToWin = newGame.totalLegs;
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
                // Next leg starts with whoever did not lead off this leg (rotate from leg starter, not from winner)
                const legStarterIndex = players.findIndex(
                  (p) => p.id === legRounds[0].playerId
                );
                const nextPlayerIndex =
                  (legStarterIndex + 1) % players.length;
                const resetPlayers = players.map((player) => ({
                  ...player,
                  totalScore: 0,
                  dartsThrown: 0,
                  targets: createDefaultTargets(newGame.cricketVariant),
                  isWinner: false,
                  currentDartIndex: 0,
                }));

                newGame.players = resetPlayers;
                newGame.currentLeg += 1;
                newGame.currentPlayerIndex = nextPlayerIndex;
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

      undoLastHit: () => {
        set((state) => {
          if (!state.currentGame) return state;
          const g = state.currentGame;

          // Undo across leg boundary: next leg started but no darts thrown yet
          if (
            g.completedLegs.length > 0 &&
            g.rounds.length === 0 &&
            (!g.currentRound || g.currentRound.darts.length === 0)
          ) {
            const lastLeg = g.completedLegs[g.completedLegs.length - 1];
            const removed = removeLastDartFromCricketLegRounds(lastLeg.rounds);
            if (!removed) return state;

            const { modifiedLegRounds } = removed;
            const playerTemplates = g.players.map((p) => ({
              id: p.id,
              name: p.name,
            }));
            const replayedPlayers = replayCricketLegRounds(
              modifiedLegRounds,
              playerTemplates,
              g.gameType,
              g.cricketVariant
            );

            const legsWon = { ...g.legsWon };
            legsWon[lastLeg.winnerId] = Math.max(
              0,
              (legsWon[lastLeg.winnerId] || 0) - 1
            );

            let rounds: CricketRound[];
            let currentRound: CricketRound;
            let currentPlayerIndex: number;

            if (modifiedLegRounds.length === 0) {
              rounds = [];
              const starterId = lastLeg.rounds[0].playerId;
              currentPlayerIndex = Math.max(
                0,
                replayedPlayers.findIndex((p) => p.id === starterId)
              );
              currentRound = {
                playerId: starterId,
                darts: [],
                totalPoints: 0,
              };
            } else {
              const lastR = modifiedLegRounds[modifiedLegRounds.length - 1];
              rounds = modifiedLegRounds.slice(0, -1).map((r) => ({
                ...r,
                darts: [...r.darts],
                totalPoints: r.totalPoints,
              }));
              currentRound = {
                playerId: lastR.playerId,
                darts: [...lastR.darts],
                totalPoints: lastR.totalPoints,
              };
              currentPlayerIndex = replayedPlayers.findIndex(
                (p) => p.id === lastR.playerId
              );
            }

            return {
              ...state,
              currentGame: {
                ...g,
                completedLegs: g.completedLegs.slice(0, -1),
                legsWon,
                currentLeg: lastLeg.legNumber,
                players: replayedPlayers,
                rounds,
                currentRound,
                currentPlayerIndex,
                isGameFinished: false,
              },
            };
          }

          const newGame = { ...state.currentGame };
          const players = [...newGame.players];

          // Find the last dart - either in current round or last completed round
          let lastDart: CricketDart | undefined;
          let roundToModify: CricketRound | null = null;
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

          // Match-end state duplicates the last round in both rounds[] and currentRound
          if (
            isCurrentRound &&
            newGame.rounds.length > 0 &&
            newGame.currentRound &&
            newGame.rounds[newGame.rounds.length - 1].playerId ===
              newGame.currentRound.playerId
          ) {
            newGame.rounds = [...newGame.rounds];
            newGame.rounds[newGame.rounds.length - 1] = { ...roundToModify! };
          }

          maybeRevertCompletedLegAfterUndo(newGame);

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
