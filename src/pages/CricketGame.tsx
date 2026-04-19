import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  alpha,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { EmojiEvents, ExitToApp } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useCricketStore, updateCachedPlayers } from "../store/useCricketStore";
import { useStore } from "../store/useStore";
import VibrationButton from "../components/VibrationButton";
import { vibrateDevice } from "../theme/ThemeProvider";
import CricketPlayerBox from "../components/cricket-player-box/cricket-player-box";
import CricketTwoPlayerScoreboard from "../components/cricket-two-player-scoreboard/cricket-two-player-scoreboard";
import CricketShiftedScoreboard from "../components/cricket-shifted-scoreboard/cricket-shifted-scoreboard";
import CricketAutoAdvanceNextButton from "../components/cricket-auto-advance-next-button/cricket-auto-advance-next-button";
import BullSymbol from "../components/bull-symbol/bull-symbol";
import CountUp from "../components/count-up/count-up";
import { motion } from "framer-motion";
import { countCricketDartsThrown } from "../utils/cricketDartsThrownStat";

/** SVG user-space units; scales with cell size (CSS padding 2px on wrapper). */
const CRICKET_MARK_VIEWBOX = 64;
const CRICKET_MARK_CENTER = CRICKET_MARK_VIEWBOX / 2;
const CRICKET_MARK_LINE_LENGTH = 52;
const CRICKET_MARK_STROKE = 6;
const CRICKET_MARK_CIRCLE_R = 24;

const CricketGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {
    currentGame,
    recordHit,
    undoLastHit,
    endGame,
    setCricketPlayers,
    finishTurn,
    startGame,
  } = useCricketStore();
  const { countdownDuration } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidGame, setIsValidGame] = useState(true);
  const [lastClickTime, setLastClickTime] = useState<number>(Date.now());
  const [isShifted, setIsShifted] = useState(false);

  const numberLabelFontSize = { xs: "3.05rem", sm: "3.5rem", md: "4.1rem" };

  // Cricket targets in order (from game; Osha includes Triple and Double)
  const cricketNumbers = useMemo(
    () =>
      currentGame?.players?.[0]?.targets?.map((t) => t.number) ?? [
        20,
        19,
        18,
        17,
        16,
        15,
        "Bull",
      ],
    [currentGame?.players],
  );

  const formatCricketTargetLabel = (n: number | string): React.ReactNode => {
    if (n === "Double") return "D";
    if (n === "Triple") return "T";
    if (n === "Bull") return <BullSymbol />;
    return String(n);
  };

  // If no game is in progress, redirect to setup
  useEffect(() => {
    // Add a slight delay to ensure proper state initialization
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/cricket");
        return;
      } else if (currentGame.isGameFinished && !dialogOpen) {
        // Open dialog when game is finished
        setDialogOpen(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentGame, navigate, dialogOpen]);

  // Close the finished-game dialog if undo reopens the match (no longer finished)
  useEffect(() => {
    if (dialogOpen && currentGame && !currentGame.isGameFinished) {
      setDialogOpen(false);
    }
  }, [dialogOpen, currentGame?.isGameFinished, currentGame]);

  // Validation effect - must be at the top level with other effects
  useEffect(() => {
    if (!isLoading && currentGame) {
      // Ensure players array exists and is not empty
      if (!currentGame.players || currentGame.players.length === 0) {
        console.error("Players array is empty or undefined");
        setIsValidGame(false);
        navigate("/cricket");
        return;
      }

      // Additional check to ensure currentPlayer is defined
      const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
      if (!currentPlayer) {
        console.error("Current player is undefined", {
          currentPlayerIndex: currentGame.currentPlayerIndex,
          players: currentGame.players,
        });
        setIsValidGame(false);
        navigate("/cricket");
        return;
      }

      // If we got here, the game is valid
      setIsValidGame(true);
    }
  }, [isLoading, currentGame, navigate]);

  // Handle back button and navigation attempts
  useEffect(() => {
    // Function to handle the back button press
    const handleBackButton = (e: PopStateEvent) => {
      if (currentGame && !currentGame.isGameFinished) {
        // Prevent the default back navigation
        e.preventDefault();
        // Show confirmation dialog
        setLeaveDialogOpen(true);
        // Push the current state again to prevent navigation
        window.history.pushState(null, "", location.pathname);
      }
    };

    // Push initial state to history stack
    window.history.pushState(null, "", location.pathname);

    // Add event listener for popstate (back button)
    window.addEventListener("popstate", handleBackButton);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [currentGame, location.pathname]);

  const currentPlayer = useMemo(
    () => currentGame?.players?.[currentGame.currentPlayerIndex],
    [currentGame?.players, currentGame?.currentPlayerIndex],
  );
  const playerColors = useMemo(() => {
    if (!currentGame) return [];
    return currentGame.players.map((_, index) =>
      index % 2 === 0
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
    );
  }, [currentGame, theme.palette.primary.main, theme.palette.secondary.main]);
  const playerRoundStats = useMemo(() => {
    if (!currentGame)
      return new Map<number, { totalMarks: number; roundsCount: number }>();
    const stats = new Map<
      number,
      { totalMarks: number; roundsCount: number }
    >();
    currentGame.players.forEach((player) => {
      stats.set(player.id, { totalMarks: 0, roundsCount: 0 });
    });
    currentGame.rounds.forEach((round) => {
      const stat = stats.get(round.playerId);
      if (!stat) return;
      stat.totalMarks += round.darts.length;
      stat.roundsCount += 1;
    });
    if (currentGame.currentRound) {
      const stat = stats.get(currentGame.currentRound.playerId);
      if (stat) {
        stat.totalMarks += currentGame.currentRound.darts.length;
        stat.roundsCount += 1;
      }
    }
    return stats;
  }, [currentGame?.players, currentGame?.rounds, currentGame?.currentRound]);
  const getAvgMarksPerRound = useCallback(
    (playerId: number) => {
      const stats = playerRoundStats.get(playerId);
      if (!stats || stats.roundsCount === 0) return 0;
      return stats.totalMarks / stats.roundsCount;
    },
    [playerRoundStats],
  );
  const currentPlayerColor = useMemo(() => {
    if (!currentGame) return theme.palette.primary.main;
    return currentGame.currentPlayerIndex % 2 === 0
      ? theme.palette.primary.main
      : theme.palette.secondary.main;
  }, [
    currentGame?.currentPlayerIndex,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);
  const groupedDarts = useMemo(() => {
    if (
      !currentGame?.currentRound ||
      currentGame.currentRound.darts.length === 0
    )
      return [];
    const grouped = currentGame.currentRound.darts.reduce(
      (acc, dart) => {
        const key = String(dart.targetNumber);
        if (!acc[key]) {
          acc[key] = { count: 0, totalPoints: 0 };
        }
        acc[key].count += dart.multiplier;
        acc[key].totalPoints += dart.points;
        return acc;
      },
      {} as Record<string, { count: number; totalPoints: number }>,
    );
    return Object.entries(grouped);
  }, [currentGame?.currentRound]);
  const dartsThrownByPlayer = useMemo(() => {
    if (!currentGame) return {};
    return currentGame.players.reduce<Record<number, number>>(
      (acc, player) => ({
        ...acc,
        [player.id]: countCricketDartsThrown(player.id, {
          isGameFinished: currentGame.isGameFinished,
          completedLegs: currentGame.completedLegs,
          rounds: currentGame.rounds,
          currentRound: currentGame.currentRound,
        }),
      }),
      {},
    );
  }, [currentGame]);
  const avgMarksPerRoundByPlayer = useMemo(() => {
    if (!currentGame) return {};
    return currentGame.players.reduce(
      (acc, player) => {
        const playerRounds = currentGame.rounds.filter(
          (round) => round.playerId === player.id,
        );
        const allRounds = [...playerRounds];
        if (
          currentGame.currentRound &&
          currentGame.currentRound.playerId === player.id
        ) {
          allRounds.push(currentGame.currentRound);
        }
        const totalMarks = allRounds.reduce(
          (sum, round) => sum + round.darts.length,
          0,
        );
        const avgMarksPerRound =
          allRounds.length > 0 ? totalMarks / allRounds.length : 0;
        acc[player.id] = avgMarksPerRound;
        return acc;
      },
      {} as Record<number, number>,
    );
  }, [currentGame]);

  const handleHit = useCallback(
    (number: number | string, forPlayerId?: number) => {
      if (!currentGame || currentGame.isGameFinished) return;
      const pid =
        forPlayerId ?? currentGame.players[currentGame.currentPlayerIndex]?.id;
      if (pid === undefined) return;
      recordHit(number, 1, pid);
      vibrateDevice(50);
      setLastClickTime(Date.now());
    },
    [currentGame, recordHit],
  );

  const handleUndo = useCallback(() => {
    if (!currentGame) return;
    undoLastHit();
    // Vibrate on undo
    vibrateDevice([50, 30, 50]);
    setLastClickTime(Date.now());
  }, [currentGame, undoLastHit]);

  const handleFinishTurn = useCallback(() => {
    if (!currentGame) return;
    finishTurn();
    setLastClickTime(Date.now());
  }, [currentGame, finishTurn]);

  const currentRoundDartCount = currentGame?.currentRound?.darts.length ?? 0;
  const shouldRunAutoAdvanceTimer =
    !!currentGame && !currentGame.isGameFinished && currentRoundDartCount > 0;

  const handleLeaveGame = useCallback(() => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/cricket");
  }, [endGame, navigate]);

  const handleCancelLeave = useCallback(() => {
    setLeaveDialogOpen(false);
  }, []);

  const handleRematch = useCallback(() => {
    if (!currentGame?.players?.length) return;
    const simplePlayers = currentGame.players.map((p) => ({
      id: p.id,
      name: p.name,
    }));
    setCricketPlayers(simplePlayers);
    updateCachedPlayers(simplePlayers);
    startGame(
      currentGame.gameType,
      currentGame.winCondition,
      simplePlayers.map((p) => p.id),
      currentGame.totalLegs,
      currentGame.cricketVariant,
    );
    setDialogOpen(false);
  }, [currentGame, setCricketPlayers, startGame]);

  const handleReturnToSetup = useCallback(() => {
    if (currentGame?.players && currentGame.players.length > 0) {
      const simplePlayers = currentGame.players.map((p) => ({
        id: p.id,
        name: p.name,
      }));
      setCricketPlayers(simplePlayers);
      updateCachedPlayers(simplePlayers);
    }
    endGame();
    setDialogOpen(false);
    setTimeout(() => {
      navigate("/cricket");
    }, 100);
  }, [currentGame?.players, endGame, navigate, setCricketPlayers]);

  const markBoxSx = {
    width: "100%",
    height: "100%",
    flex: 1,
    minHeight: 0,
    p: "2px",
    boxSizing: "border-box" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  };

  // Closed mark (ring with cross) — also used for 3 hits before target is closed
  const renderClosedMark = useCallback(
    (color?: string) => {
      const center = CRICKET_MARK_CENTER;
      const lineLength = CRICKET_MARK_LINE_LENGTH;
      const strokeWidth = CRICKET_MARK_STROKE;
      const primaryColor = color || theme.palette.primary.main;

      return (
        <Box sx={markBoxSx}>
          <motion.svg
            viewBox={`0 0 ${CRICKET_MARK_VIEWBOX} ${CRICKET_MARK_VIEWBOX}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            <motion.line
              x1={center - lineLength / 2}
              y1={center - lineLength / 2}
              x2={center + lineLength / 2}
              y2={center + lineLength / 2}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.line
              x1={center + lineLength / 2}
              y1={center - lineLength / 2}
              x2={center - lineLength / 2}
              y2={center + lineLength / 2}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.circle
              className="circle-path"
              cx={center}
              cy={center}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              fill="none"
              r={CRICKET_MARK_CIRCLE_R}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
        </Box>
      );
    },
    [theme.palette.primary.main],
  );

  // Marks (0–3) for a player's target with animation
  const renderMarks = useCallback(
    (hits: number, color?: string) => {
      if (hits === 0) return null;
      if (hits >= 3) return renderClosedMark(color);

      const center = CRICKET_MARK_CENTER;
      const lineLength = CRICKET_MARK_LINE_LENGTH;
      const strokeWidth = CRICKET_MARK_STROKE;
      const primaryColor = color || theme.palette.primary.main;

      return (
        <Box sx={markBoxSx}>
          <motion.svg
            viewBox={`0 0 ${CRICKET_MARK_VIEWBOX} ${CRICKET_MARK_VIEWBOX}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            {hits >= 1 && (
              <motion.line
                key="mark-slash"
                x1={center - lineLength / 2}
                y1={center - lineLength / 2}
                x2={center + lineLength / 2}
                y2={center + lineLength / 2}
                stroke={primaryColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={hits === 1 ? { pathLength: 0 } : { pathLength: 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0 }}
              />
            )}
            {hits >= 2 && (
              <motion.line
                key="mark-backslash"
                x1={center + lineLength / 2}
                y1={center - lineLength / 2}
                x2={center - lineLength / 2}
                y2={center + lineLength / 2}
                stroke={primaryColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={hits === 2 ? { pathLength: 0 } : { pathLength: 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: hits === 2 ? 0.1 : 0 }}
              />
            )}
          </motion.svg>
        </Box>
      );
    },
    [renderClosedMark, theme.palette.primary.main],
  );

  // Display loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If no game or invalid game, don't render the main content
  if (!currentGame || !isValidGame) {
    return null;
  }

  // Ensure safe access to players data
  const hasPlayers = currentGame?.players && currentGame.players.length > 0;
  const hasWinner = hasPlayers && currentGame.players.some((p) => p.isWinner);
  const winner = hasWinner ? currentGame.players.find((p) => p.isWinner) : null;

  // Return loading UI if player is missing
  if (!currentPlayer) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Loading game data...</Typography>
      </Box>
    );
  }

  // Get current player's target for a number
  const getCurrentPlayerTarget = (number: number | string) => {
    return currentPlayer?.targets?.find((t) => t.number === number);
  };

  // Check if a number can be clicked for the current player (center column / legacy)
  const canClickNumber = (number: number | string) => {
    if (currentGame.isGameFinished) return false;
    const target = getCurrentPlayerTarget(number);
    if (!target) return false;

    if (!target.closed) return true;

    return currentGame.players.some((p) => {
      if (p.id === currentPlayer.id) return false;
      const otherTarget = p.targets.find((t) => t.number === number);
      return otherTarget && !otherTarget.closed;
    });
  };

  const canClickNumberForPlayer = (
    number: number | string,
    playerId: number,
  ) => {
    if (currentGame.isGameFinished) return false;
    const player = currentGame.players.find((p) => p.id === playerId);
    if (!player) return false;
    const target = player.targets.find((t) => t.number === number);
    if (!target) return false;

    if (!target.closed) return true;

    return currentGame.players.some((p) => {
      if (p.id === playerId) return false;
      const otherTarget = p.targets.find((t) => t.number === number);
      return otherTarget && !otherTarget.closed;
    });
  };

  // Check if all players have closed a number
  const isNumberClosedByAll = (number: number | string) => {
    if (!currentGame) return false;
    return currentGame.players.every((player) => {
      const target = player.targets.find((t) => t.number === number);
      return target?.closed || false;
    });
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Game Summary Dialog */}
      <Dialog
        open={dialogOpen}
        maxWidth="sm"
        fullWidth
        onClose={() => {}} // Prevent closing by clicking outside
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <EmojiEvents color="primary" sx={{ mr: 1 }} />
          Game Finished
        </DialogTitle>
        <DialogContent>
          {winner && (
            <Typography variant="h5" color="primary" gutterBottom>
              {winner.name} won!
            </Typography>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Player Statistics
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {hasPlayers &&
              currentGame.players.map((player) => (
                <ListItem
                  key={player.id}
                  sx={{
                    mb: 1,
                    backgroundColor: player.isWinner
                      ? (theme) => alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={player.name}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          Score: {player.totalScore}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          Darts thrown: {dartsThrownByPlayer[player.id] ?? 0}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          Closed numbers:{" "}
                          {player.targets.filter((t) => t.closed).length} of{" "}
                          {player.targets.length}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <VibrationButton
            onClick={handleUndo}
            variant="outlined"
            color="info"
            vibrationPattern={[50, 30, 50]}
          >
            Undo last dart
          </VibrationButton>
          <VibrationButton onClick={handleReturnToSetup} vibrationPattern={50}>
            Return to Setup
          </VibrationButton>
          <VibrationButton
            onClick={handleRematch}
            variant="contained"
            color="primary"
            vibrationPattern={100}
          >
            Rematch
          </VibrationButton>
        </DialogActions>
      </Dialog>

      {/* Leave Game Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleCancelLeave}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <ExitToApp color="warning" sx={{ mr: 1 }} />
          Leave Game?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to leave the current game? All progress will
            be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <VibrationButton onClick={handleCancelLeave} vibrationPattern={50}>
            Cancel
          </VibrationButton>
          <VibrationButton
            onClick={handleLeaveGame}
            variant="contained"
            color="error"
            vibrationPattern={[50, 100, 50]}
          >
            Leave Game
          </VibrationButton>
        </DialogActions>
      </Dialog>

      {/* Main Game Interface */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Top Bar - Header with Player Names and Scores */}
        <Paper
          sx={{
            p: 1,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {isShifted ? (
            <CricketShiftedScoreboard
              players={currentGame.players}
              currentPlayerIndex={currentGame.currentPlayerIndex}
              avgMarksPerRoundByPlayer={avgMarksPerRoundByPlayer}
              legsWon={currentGame.legsWon}
              totalLegs={currentGame.totalLegs}
              onDoubleClick={() => setIsShifted(false)}
            />
          ) : (
            <Box
              sx={{ cursor: "pointer" }}
              onDoubleClick={() => setIsShifted(true)}
            >
              {(() => {
                const playerCount = currentGame.players.length;
                if (playerCount === 2) {
                  return (
                    <CricketTwoPlayerScoreboard
                      players={currentGame.players}
                      currentPlayerIndex={currentGame.currentPlayerIndex}
                      legsWon={currentGame.legsWon}
                      totalLegs={currentGame.totalLegs}
                      avgMarksPerRoundByPlayer={avgMarksPerRoundByPlayer}
                    />
                  );
                }

                return (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: (() => {
                        const playerCount = currentGame.players.length;
                        if (playerCount === 1) return `1fr 76px`;
                        if (playerCount === 2) {
                          const firstHalf = Math.ceil(playerCount / 2);
                          const secondHalf = playerCount - firstHalf;
                          return `repeat(${firstHalf}, 1fr) 76px repeat(${secondHalf}, 1fr)`;
                        }
                        return `repeat(${playerCount}, 1fr) 76px`;
                      })(),
                      gap: 0.5,
                    }}
                  >
                    {(() => {
                      const playerCount = currentGame.players.length;
                      if (playerCount <= 2) {
                        const firstHalf = Math.ceil(playerCount / 2);
                        return (
                          <>
                            {currentGame.players
                              .slice(0, firstHalf)
                              .map((player, playerIndex) => {
                                const playerColor =
                                  playerColors[playerIndex] ||
                                  theme.palette.primary.main;
                                const isCurrentPlayer =
                                  player.id === currentPlayer?.id;
                                const avgMarksPerRound = getAvgMarksPerRound(
                                  player.id,
                                );
                                return (
                                  <Box
                                    key={player.id}
                                    sx={{
                                      backgroundColor: isCurrentPlayer
                                        ? alpha(playerColor, 0.06)
                                        : "transparent",
                                      borderRadius: 1,
                                      transition: "background-color 0.3s ease",
                                    }}
                                  >
                                    <CricketPlayerBox
                                      player={player}
                                      isCurrentPlayer={isCurrentPlayer}
                                      avgMarksPerRound={avgMarksPerRound}
                                      playerIndex={playerIndex}
                                    />
                                  </Box>
                                );
                              })}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                Number
                              </Typography>
                            </Box>
                            {currentGame.players
                              .slice(firstHalf)
                              .map((player, index) => {
                                const playerIndex = index + firstHalf;
                                const playerColor =
                                  playerColors[playerIndex] ||
                                  theme.palette.primary.main;
                                const isCurrentPlayer =
                                  player.id === currentPlayer?.id;
                                const avgMarksPerRound = getAvgMarksPerRound(
                                  player.id,
                                );
                                return (
                                  <Box
                                    key={player.id}
                                    sx={{
                                      backgroundColor: isCurrentPlayer
                                        ? alpha(playerColor, 0.06)
                                        : "transparent",
                                      borderRadius: 1,
                                      transition: "background-color 0.3s ease",
                                    }}
                                  >
                                    <CricketPlayerBox
                                      player={player}
                                      isCurrentPlayer={isCurrentPlayer}
                                      avgMarksPerRound={avgMarksPerRound}
                                      playerIndex={playerIndex}
                                    />
                                  </Box>
                                );
                              })}
                          </>
                        );
                      }

                      return (
                        <>
                          {currentGame.players.map((player, playerIndex) => {
                            const playerColor =
                              playerColors[playerIndex] ||
                              theme.palette.primary.main;
                            const isCurrentPlayer =
                              player.id === currentPlayer?.id;
                            const avgMarksPerRound = getAvgMarksPerRound(
                              player.id,
                            );
                            return (
                              <Box
                                key={player.id}
                                sx={{
                                  backgroundColor: isCurrentPlayer
                                    ? alpha(playerColor, 0.06)
                                    : "transparent",
                                  borderRadius: 1,
                                  transition: "background-color 0.3s ease",
                                }}
                              >
                                <CricketPlayerBox
                                  player={player}
                                  isCurrentPlayer={isCurrentPlayer}
                                  avgMarksPerRound={avgMarksPerRound}
                                  playerIndex={playerIndex}
                                />
                              </Box>
                            );
                          })}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              Number
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                );
              })()}
            </Box>
          )}
        </Paper>

        {/* Full-Screen Number Grid with Player Columns */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 0.5,
            gap: 0.5,
          }}
        >
          {cricketNumbers.map((number) => {
            const canClick = canClickNumber(number);
            const allClosed = isNumberClosedByAll(number);

            return (
              <Box
                key={number}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  filter: allClosed ? "blur(4px)" : "none",
                  opacity: allClosed ? 0.5 : 1,
                  transition: "filter 0.3s ease, opacity 0.3s ease",
                }}
              >
                {/* Main row with players and number */}
                <Box
                  sx={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: (() => {
                      const playerCount = currentGame.players.length;
                      if (playerCount === 1) return `1fr 76px`;
                      if (playerCount === 2) {
                        const firstHalf = Math.ceil(playerCount / 2);
                        const secondHalf = playerCount - firstHalf;
                        return `repeat(${firstHalf}, 1fr) 76px repeat(${secondHalf}, 1fr)`;
                      }
                      // For 3+ players, number goes last
                      return `repeat(${playerCount}, 1fr) 76px`;
                    })(),
                    gap: 0.5,
                    p: 0.5,
                    minHeight: 0,
                  }}
                >
                  {(() => {
                    const playerCount = currentGame.players.length;

                    // For 1-2 players, split in half with number in middle
                    if (playerCount <= 2) {
                      const firstHalfCount = Math.ceil(playerCount / 2);
                      return (
                        <>
                          {/* First half of players */}
                          {currentGame.players
                            .slice(0, firstHalfCount)
                            .map((player, playerIndex) => {
                              const playerColor =
                                playerColors[playerIndex] ||
                                theme.palette.primary.main;
                              const target = player.targets.find(
                                (t) => t.number === number,
                              );
                              const isCurrentPlayer =
                                player.id === currentPlayer?.id;
                              const isClosed = target?.closed || false;
                              const isClickable = canClickNumberForPlayer(
                                number,
                                player.id,
                              );

                              return (
                                <Box
                                  key={`${player.id}-${number}`}
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    alignSelf: "stretch",
                                    minHeight: 0,
                                    height: "100%",
                                    cursor: isClickable ? "pointer" : "default",
                                    backgroundColor: isCurrentPlayer
                                      ? alpha(playerColor, 0.06)
                                      : "transparent",
                                    transition: "all 0.2s ease",
                                    "&:hover": isClickable
                                      ? {
                                          backgroundColor: alpha(
                                            playerColor,
                                            0.15,
                                          ),
                                          transform: "scale(1.02)",
                                        }
                                      : {},
                                  }}
                                  onClick={() =>
                                    isClickable && handleHit(number, player.id)
                                  }
                                >
                                  {target && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        justifyContent: "center",
                                        gap: 0.25,
                                        flex: 1,
                                        width: "100%",
                                        minHeight: 0,
                                      }}
                                    >
                                      {isClosed
                                        ? renderClosedMark(playerColor)
                                        : renderMarks(target.hits, playerColor)}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}

                          {/* Number Label - positioned between players */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: canClick ? "pointer" : "default",
                              transition: "all 0.2s ease",
                              "&:hover": canClick
                                ? {
                                    backgroundColor: (theme) =>
                                      alpha(theme.palette.primary.main, 0.15),
                                    transform: "scale(1.05)",
                                  }
                                : {},
                            }}
                            onClick={() => canClick && handleHit(number)}
                          >
                            <Typography
                              variant="h5"
                              component="div"
                              sx={{
                                fontWeight: "bold",
                                fontSize: numberLabelFontSize,
                              }}
                            >
                              {formatCricketTargetLabel(number)}
                            </Typography>
                          </Box>

                          {/* Second half of players */}
                          {currentGame.players
                            .slice(firstHalfCount)
                            .map((player, index) => {
                              const playerIndex = index + firstHalfCount;
                              const playerColor =
                                playerColors[playerIndex] ||
                                theme.palette.primary.main;
                              const target = player.targets.find(
                                (t) => t.number === number,
                              );
                              const isCurrentPlayer =
                                player.id === currentPlayer?.id;
                              const isClosed = target?.closed || false;
                              const isClickable = canClickNumberForPlayer(
                                number,
                                player.id,
                              );

                              return (
                                <Box
                                  key={`${player.id}-${number}`}
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    alignSelf: "stretch",
                                    minHeight: 0,
                                    height: "100%",
                                    cursor: isClickable ? "pointer" : "default",
                                    backgroundColor: isCurrentPlayer
                                      ? alpha(playerColor, 0.06)
                                      : "transparent",
                                    transition: "all 0.2s ease",
                                    "&:hover": isClickable
                                      ? {
                                          backgroundColor: alpha(
                                            playerColor,
                                            0.15,
                                          ),
                                          transform: "scale(1.02)",
                                        }
                                      : {},
                                  }}
                                  onClick={() =>
                                    isClickable && handleHit(number, player.id)
                                  }
                                >
                                  {target && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        justifyContent: "center",
                                        gap: 0.25,
                                        flex: 1,
                                        width: "100%",
                                        minHeight: 0,
                                      }}
                                    >
                                      {isClosed
                                        ? renderClosedMark(playerColor)
                                        : renderMarks(target.hits, playerColor)}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                        </>
                      );
                    }

                    // For 3+ players, all players first, then number
                    return (
                      <>
                        {currentGame.players.map((player, playerIndex) => {
                          const playerColor =
                            playerColors[playerIndex] ||
                            theme.palette.primary.main;
                          const target = player.targets.find(
                            (t) => t.number === number,
                          );
                          const isCurrentPlayer =
                            player.id === currentPlayer?.id;
                          const isClosed = target?.closed || false;
                          const isClickable = canClickNumberForPlayer(
                            number,
                            player.id,
                          );

                          return (
                            <Box
                              key={`${player.id}-${number}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                alignSelf: "stretch",
                                minHeight: 0,
                                height: "100%",
                                cursor: isClickable ? "pointer" : "default",
                                backgroundColor: isCurrentPlayer
                                  ? alpha(playerColor, 0.06)
                                  : "transparent",
                                transition: "all 0.2s ease",
                                "&:hover": isClickable
                                  ? {
                                      backgroundColor: alpha(playerColor, 0.15),
                                      transform: "scale(1.02)",
                                    }
                                  : {},
                              }}
                              onClick={() =>
                                isClickable && handleHit(number, player.id)
                              }
                            >
                              {target && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "stretch",
                                    justifyContent: "center",
                                    gap: 0.25,
                                    flex: 1,
                                    width: "100%",
                                    minHeight: 0,
                                  }}
                                >
                                  {isClosed
                                    ? renderClosedMark(playerColor)
                                    : renderMarks(target.hits, playerColor)}
                                </Box>
                              )}
                            </Box>
                          );
                        })}

                        {/* Number Label - positioned last */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: canClick ? "pointer" : "default",
                            transition: "all 0.2s ease",
                            "&:hover": canClick
                              ? {
                                  backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.15),
                                  transform: "scale(1.05)",
                                }
                              : {},
                          }}
                          onClick={() => canClick && handleHit(number)}
                        >
                          <Typography
                            variant="h5"
                            component="div"
                            sx={{
                              fontWeight: "bold",
                              fontSize: numberLabelFontSize,
                            }}
                          >
                            {formatCricketTargetLabel(number)}
                          </Typography>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            );
          })}

          {/* Total Score Row - below all numbers */}
          {currentGame.players.length !== 2 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: (() => {
                  const playerCount = currentGame.players.length;
                  if (playerCount === 1) return `1fr 76px`;
                  if (playerCount === 2) {
                    const firstHalf = Math.ceil(playerCount / 2);
                    const secondHalf = playerCount - firstHalf;
                    return `repeat(${firstHalf}, 1fr) 76px repeat(${secondHalf}, 1fr)`;
                  }
                  return `repeat(${playerCount}, 1fr) 76px`;
                })(),
                gap: 0.5,
                p: { xs: 2, sm: 3, md: 4 },
                borderTop: "2px solid",
                borderColor: "divider",
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              {(() => {
                const playerCount = currentGame.players.length;

                // For 1-2 players, split in half with label in middle
                if (playerCount <= 2) {
                  const firstHalfCount = Math.ceil(playerCount / 2);
                  return (
                    <>
                      {/* First half of players - total score */}
                      {currentGame.players
                        .slice(0, firstHalfCount)
                        .map((player, playerIndex) => {
                          const playerColor =
                            playerColors[playerIndex] ||
                            theme.palette.primary.main;
                          return (
                            <Box
                              key={`score-${player.id}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: { xs: 1, sm: 2, md: 3 },
                              }}
                            >
                              <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                  fontWeight: 700,
                                  color: playerColor,
                                  fontSize: {
                                    xs: "2.65rem",
                                    sm: "3.65rem",
                                    md: "4.65rem",
                                  },
                                }}
                              >
                                <CountUp
                                  to={player.totalScore}
                                  duration={0.5}
                                  delay={0}
                                  animateOnChange={true}
                                  startWhen={true}
                                />
                              </Typography>
                            </Box>
                          );
                        })}

                      {/* Score label */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.95rem", sm: "1.1rem" },
                            color: theme.palette.text.secondary,
                          }}
                        >
                          Score
                        </Typography>
                      </Box>

                      {/* Second half of players - total score */}
                      {currentGame.players
                        .slice(firstHalfCount)
                        .map((player, index) => {
                          const playerIndex = index + firstHalfCount;
                          const playerColor =
                            playerColors[playerIndex] ||
                            theme.palette.primary.main;
                          return (
                            <Box
                              key={`score-${player.id}`}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: { xs: 1, sm: 2, md: 3 },
                              }}
                            >
                              <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                  fontWeight: 700,
                                  color: playerColor,
                                  fontSize: {
                                    xs: "2.65rem",
                                    sm: "3.65rem",
                                    md: "4.65rem",
                                  },
                                }}
                              >
                                <CountUp
                                  to={player.totalScore}
                                  duration={0.5}
                                  delay={0}
                                  animateOnChange={true}
                                  startWhen={true}
                                />
                              </Typography>
                            </Box>
                          );
                        })}
                    </>
                  );
                }

                // For 3+ players, all players first, then label
                return (
                  <>
                    {currentGame.players.map((player, playerIndex) => {
                      const playerColor =
                        playerColors[playerIndex] || theme.palette.primary.main;
                      return (
                        <Box
                          key={`score-${player.id}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              fontWeight: 700,
                              color: playerColor,
                              fontSize: {
                                xs: "1.75rem",
                                sm: "2.1rem",
                                md: "2.45rem",
                              },
                            }}
                          >
                            <CountUp
                              to={player.totalScore}
                              duration={0.5}
                              delay={0}
                              animateOnChange={true}
                              startWhen={true}
                            />
                          </Typography>
                        </Box>
                      );
                    })}

                    {/* Score label */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          fontSize: { xs: "0.95rem", sm: "1.1rem" },
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Score
                      </Typography>
                    </Box>
                  </>
                );
              })()}
            </Box>
          )}
        </Box>

        {/* Bottom Action Bar - Next Button */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            gap: 2,
          }}
        >
          <Box
            sx={{
              flex: 1,
              flexDirection: "row",
              flexWrap: "wrap",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button
              variant="text"
              color="info"
              size="large"
              onClick={handleUndo}
              sx={{
                py: 1.5,
                fontSize: "1.2rem",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              Undo
            </Button>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {groupedDarts.length > 0 ? (
                groupedDarts.map(([targetNumber, data]) => (
                  <Box
                    key={targetNumber}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: { xs: 1.25, sm: 1.5 },
                      py: { xs: 0.65, sm: 0.75 },
                      borderRadius: 1,
                      backgroundColor: alpha(currentPlayerColor, 0.1),
                      border: `1px solid ${alpha(currentPlayerColor, 0.3)}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "1.15rem", sm: "1.35rem" },
                      }}
                    >
                      {data.count > 1 ? (
                        <>
                          {data.count}×{formatCricketTargetLabel(targetNumber)}
                        </>
                      ) : (
                        formatCricketTargetLabel(targetNumber)
                      )}
                    </Typography>
                    {data.totalPoints > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "secondary.main",
                          fontWeight: 600,
                          fontSize: { xs: "1.05rem", sm: "1.2rem" },
                        }}
                      >
                        (+{data.totalPoints})
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    fontStyle: "italic",
                  }}
                >
                  No darts thrown yet
                </Typography>
              )}
            </Box>
          </Box>

          {/* Round Summary */}

          <Box>
            <CricketAutoAdvanceNextButton
              isGameFinished={currentGame.isGameFinished}
              shouldRunAutoAdvanceTimer={shouldRunAutoAdvanceTimer}
              countdownDurationSec={countdownDuration}
              timerResetKey={lastClickTime}
              currentPlayerIndex={currentGame.currentPlayerIndex}
              currentRoundDartCount={currentRoundDartCount}
              onFinishTurn={handleFinishTurn}
              buttonColor={
                currentPlayer && currentGame.currentPlayerIndex % 2 === 0
                  ? "primary"
                  : "secondary"
              }
              disabled={currentGame.isGameFinished}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CricketGame;
