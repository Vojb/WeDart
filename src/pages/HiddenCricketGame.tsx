import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
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
  Grid,
} from "@mui/material";
import {
  EmojiEvents,
  ExitToApp,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useHiddenCricketStore,
  updateHiddenCricketCachedPlayers,
} from "../store/useHiddenCricketStore";
import { useStore } from "../store/useStore";
import VibrationButton from "../components/VibrationButton";
import { vibrateDevice } from "../theme/ThemeProvider";
import CricketPlayerBox from "../components/cricket-player-box/cricket-player-box";
import CricketShiftedScoreboard from "../components/cricket-shifted-scoreboard/cricket-shifted-scoreboard";
import CricketAutoAdvanceNextButton from "../components/cricket-auto-advance-next-button/cricket-auto-advance-next-button";
import { motion, Variants } from "framer-motion";
import MultiplierSelector from "../components/multiplier-selector/multiplier-selector";
import HiddenCricketTwoPlayersLayout from "../components/hidden-cricket-two-players-layout/hidden-cricket-two-players-layout";
import HiddenCricketMultiPlayersLayout from "../components/hidden-cricket-multi-players-layout/hidden-cricket-multi-players-layout";
import BullSymbol from "../components/bull-symbol/bull-symbol";
import { countCricketDartsThrown } from "../utils/cricketDartsThrownStat";

const HiddenCricketGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {
    currentGame,
    recordHit,
    recordMiss,
    undoLastHit,
    endGame,
    setHiddenCricketPlayers,
    finishTurn,
    isHiddenNumber,
    startGame,
  } = useHiddenCricketStore();
  const { countdownDuration } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidGame, setIsValidGame] = useState(true);
  const [lastClickTime, setLastClickTime] = useState<number>(Date.now());
  const [isShifted, setIsShifted] = useState(false);
  const [showMultiplierSelector, setShowMultiplierSelector] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | string | null>(
    null,
  );
  const [isInputExpanded, setIsInputExpanded] = useState(true);

  // Numbers 1-20 and Bull for button input (in order)
  const allNumbers = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    "Bull",
  ];

  const shape: React.CSSProperties = useMemo(
    () => ({
      strokeWidth: 10,
      strokeLinecap: "round",
      fill: "transparent",
    }),
    [],
  );

  const draw: Variants = useMemo(
    () => ({
      hidden: { pathLength: 0, opacity: 0 },
      visible: (i: number) => {
        const delay = i * 0.5;
        return {
          pathLength: 1,
          opacity: 1,
          transition: {
            pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
            opacity: { delay, duration: 0.01 },
          },
        };
      },
    }),
    [],
  );

  // If no game is in progress, redirect to setup
  useEffect(() => {
    // Add a slight delay to ensure proper state initialization
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/hidden-cricket");
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
        navigate("/hidden-cricket");
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
        navigate("/hidden-cricket");
        return;
      }

      // If we got here, the game is valid
      setIsValidGame(true);
    }
  }, [isLoading, currentGame, navigate]);

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

  const handleFinishTurn = useCallback(() => {
    if (!currentGame) return;
    finishTurn();
    setLastClickTime(Date.now());
  }, [currentGame, finishTurn]);

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

  // Safely access currentPlayer now that we've validated in the effect
  const currentPlayer = currentGame?.players?.[currentGame.currentPlayerIndex];

  const handleNumberClick = (number: number | string) => {
    if (!currentGame || currentGame.isGameFinished) return;

    // Check if player has already thrown 3 darts this turn
    const currentRoundDarts = currentGame.currentRound?.darts.length || 0;
    if (currentRoundDarts >= 3) {
      // Already thrown 3 darts, vibrate to indicate limit reached
      vibrateDevice([50, 30, 50]);
      return;
    }

    // Check if all players have closed this number - if so, treat as miss
    if (isNumberClosedByAll(number)) {
      recordMiss();
      vibrateDevice([50, 30, 50]);
      setLastClickTime(Date.now());
      return;
    }

    // Check if this number is a valid hidden number
    if (isHiddenNumber(number)) {
      // Valid hidden number - show multiplier selector
      setSelectedNumber(number);
      setShowMultiplierSelector(true);
    } else {
      // Not a valid target - record as miss immediately (no multiplier needed)
      recordMiss();
      vibrateDevice([50, 30, 50]);
      setLastClickTime(Date.now());
    }
  };

  const handleMultiplierSelect = (multiplier: number) => {
    if (!currentGame || !selectedNumber) return;

    // Check if player has already thrown 3 darts this turn
    const currentRoundDarts = currentGame.currentRound?.darts.length || 0;
    if (currentRoundDarts >= 3) {
      // Already thrown 3 darts, close selector and vibrate
      setShowMultiplierSelector(false);
      setSelectedNumber(null);
      vibrateDevice([50, 30, 50]);
      return;
    }

    // Check if all players have closed this number - if so, treat as miss
    if (isNumberClosedByAll(selectedNumber)) {
      recordMiss();
      vibrateDevice([50, 30, 50]);
      setLastClickTime(Date.now());
      setShowMultiplierSelector(false);
      setSelectedNumber(null);
      return;
    }

    // Check if this number is a valid hidden number
    const isValid = isHiddenNumber(selectedNumber);
    if (isValid) {
      // Valid hidden number - record as hit
      recordHit(selectedNumber, multiplier);
      vibrateDevice(50);
    } else {
      // Not a valid target - record as miss (counts as dart but no points)
      // This ensures non-hidden numbers are still recorded as darts
      recordMiss();
      vibrateDevice([50, 30, 50]);
    }

    setLastClickTime(Date.now());

    // Close multiplier selector
    setShowMultiplierSelector(false);
    setSelectedNumber(null);
  };

  const handleMultiplierCancel = () => {
    setShowMultiplierSelector(false);
    setSelectedNumber(null);
  };

  const handleMiss = () => {
    if (!currentGame || currentGame.isGameFinished) return;

    // Check if player has already thrown 3 darts this turn
    const currentRoundDarts = currentGame.currentRound?.darts.length || 0;
    if (currentRoundDarts >= 3) {
      // Already thrown 3 darts, vibrate to indicate limit reached
      vibrateDevice([50, 30, 50]);
      return;
    }

    // Record the miss
    recordMiss();
    vibrateDevice(50);
    setLastClickTime(Date.now());
  };

  const handleUndo = () => {
    if (!currentGame) return;
    undoLastHit();
    // Vibrate on undo
    vibrateDevice([50, 30, 50]);
    setLastClickTime(Date.now());
  };

  const currentRoundDartCount = currentGame?.currentRound?.darts.length ?? 0;
  const shouldRunAutoAdvanceTimer =
    !!currentGame &&
    !currentGame.isGameFinished &&
    currentRoundDartCount >= 3;

  const handleLeaveGame = () => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/hidden-cricket");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  const handleRematch = () => {
    if (!currentGame?.players?.length) return;
    const simplePlayers = currentGame.players.map((p) => ({
      id: p.id,
      name: p.name,
    }));
    setHiddenCricketPlayers(simplePlayers);
    updateHiddenCricketCachedPlayers(simplePlayers);
    startGame(
      currentGame.gameType,
      currentGame.winCondition,
      currentGame.lastBull,
      simplePlayers.map((p) => p.id),
      currentGame.totalLegs,
    );
    setDialogOpen(false);
  };

  const handleReturnToSetup = () => {
    if (currentGame?.players && currentGame.players.length > 0) {
      const simplePlayers = currentGame.players.map((p) => ({
        id: p.id,
        name: p.name,
      }));
      setHiddenCricketPlayers(simplePlayers);
      updateHiddenCricketCachedPlayers(simplePlayers);
    }
    endGame();
    setDialogOpen(false);
    setTimeout(() => {
      navigate("/hidden-cricket");
    }, 100);
  };

  // Function to render marks (0-3) for a player's target with animation
  const renderMarks = (hits: number, color?: string) => {
    if (hits === 0) return null;

    const viewBoxSize = 56;
    const center = viewBoxSize / 2;
    const lineLength = 42;
    const strokeWidth = 5;
    const primaryColor = color || theme.palette.primary.main;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "100%",
          height: "100%",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            fontSize: isInputExpanded
              ? "clamp(0.75rem, 60%, 1.5rem)"
              : "clamp(1rem, 60%, 2rem)",
            width: "1.5em",
            height: "1.5em",
            maxWidth: "100%",
            maxHeight: "100%",
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 1,
          }}
        >
          <motion.svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            {/* First hit - Slash (/) */}
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

            {/* Second hit - Cross (X) - adds backslash (\) */}
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

            {/* Third hit - Circle with cross - add ring but keep cross visible */}
            {hits >= 3 && (
              <motion.svg>
                <motion.circle
                  className="circle-path"
                  cx="50"
                  cy="50"
                  r="80"
                  stroke={"red"}
                  variants={draw}
                  custom={1}
                  style={shape}
                />
              </motion.svg>
            )}
          </motion.svg>
        </Box>
      </Box>
    );
  };

  // Function to render closed mark (ring with cross)
  const renderClosedMark = (color?: string) => {
    const viewBoxSize = 56;
    const center = viewBoxSize / 2;
    const lineLength = 42;
    const circleRadius = 21;
    const strokeWidth = 5;
    const primaryColor = color || theme.palette.primary.main;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "100%",
          height: "100%",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            fontSize: isInputExpanded
              ? "clamp(0.75rem, 60%, 1.5rem)"
              : "clamp(1rem, 60%, 2rem)",
            width: "1.5em",
            height: "1.5em",
            maxWidth: "100%",
            maxHeight: "100%",
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 1,
          }}
        >
          <motion.svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            {/* Cross lines */}
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

            {/* Circle ring */}
            <motion.circle
              className="circle-path"
              cx={center}
              cy={center}
              stroke={primaryColor}
              strokeWidth={strokeWidth}
              fill="none"
              r={circleRadius}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
        </Box>
      </Box>
    );
  };

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

  // Check if all players have closed a number
  const isNumberClosedByAll = (number: number | string) => {
    if (!currentGame) return false;
    return currentGame.players.every((player) => {
      const target = player.targets.find((t) => t.number === number);
      return target?.closed || false;
    });
  };

  // Check if any player has hit a number
  const hasAnyPlayerHitNumber = (number: number | string) => {
    if (!currentGame) return false;
    return currentGame.players.some((player) => {
      const target = player.targets.find((t) => t.number === number);
      return target && target.hits > 0;
    });
  };

  // Row label: revealed number, bull symbol, or "?" when hidden
  const getNumberDisplayText = (number: number | string): React.ReactNode => {
    if (!currentGame) return "?";
    if (currentGame.lastBull && number === "Bull") {
      return <BullSymbol />;
    }
    if (!hasAnyPlayerHitNumber(number)) return "?";
    if (number === "Bull") return <BullSymbol />;
    return String(number);
  };

  // Check if current player has closed all non-Bull numbers (for lastBull rule)
  const hasCurrentPlayerClosedAllNonBull = () => {
    if (!currentGame || !currentPlayer) return false;
    if (!currentGame.lastBull) return false;
    const nonBullTargets = currentPlayer.targets.filter(
      (t) => t.number !== "Bull",
    );
    return nonBullTargets.every((t) => t.closed);
  };

  // Get hidden numbers sorted for display - found numbers at the top, Bull always at bottom
  const hiddenNumbersSorted = [...currentGame.hiddenNumbers].sort((a, b) => {
    // Bull always goes to the bottom
    if (a === "Bull") return 1;
    if (b === "Bull") return -1;

    // For non-Bull numbers, separate found and unfound
    const aFound = hasAnyPlayerHitNumber(a);
    const bFound = hasAnyPlayerHitNumber(b);

    // Found numbers come first
    if (aFound && !bFound) return -1;
    if (!aFound && bFound) return 1;

    // Within the same group (both found or both unfound), sort by value
    return Number(b) - Number(a);
  });

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Multiplier Selector Modal */}
      {showMultiplierSelector && selectedNumber && (
        <MultiplierSelector
          onSelect={handleMultiplierSelect}
          onCancel={handleMultiplierCancel}
          selectedNumber={selectedNumber}
          isValidTarget={isHiddenNumber(selectedNumber)}
        />
      )}

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
            Hidden Numbers Were:
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {hiddenNumbersSorted.join(", ")}
          </Typography>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
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
        {/* Top Bar - Header with Player Names */}
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
              players={currentGame.players as any}
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
              {currentGame.players.length === 2 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 1fr",
                gap: 0.5,
              }}
            >
              {/* First player */}
              <Box
                sx={{
                  backgroundColor:
                    currentGame.players[0]?.id === currentPlayer?.id
                      ? alpha(theme.palette.primary.main, 0.06)
                      : "transparent",
                  borderRadius: 1,
                  transition: "background-color 0.3s ease",
                }}
              >
                {(() => {
                  const player = currentGame.players[0];
                  const playerIndex = 0;
                  const avgMarksPerRound =
                    avgMarksPerRoundByPlayer[player.id] ?? 0;
                  return (
                    <CricketPlayerBox
                      player={player as any}
                      isCurrentPlayer={player.id === currentPlayer?.id}
                      avgMarksPerRound={avgMarksPerRound}
                      playerIndex={playerIndex}
                    />
                  );
                })()}
              </Box>

              {/* Empty middle column to match grid layout */}
              <Box />

              {/* Second player */}
              <Box
                sx={{
                  backgroundColor:
                    currentGame.players[1]?.id === currentPlayer?.id
                      ? alpha(theme.palette.secondary.main, 0.06)
                      : "transparent",
                  borderRadius: 1,
                  transition: "background-color 0.3s ease",
                }}
              >
                {(() => {
                  const player = currentGame.players[1];
                  const playerIndex = 1;
                  const avgMarksPerRound =
                    avgMarksPerRoundByPlayer[player.id] ?? 0;
                  return (
                    <CricketPlayerBox
                      player={player as any}
                      isCurrentPlayer={player.id === currentPlayer?.id}
                      avgMarksPerRound={avgMarksPerRound}
                      playerIndex={playerIndex}
                    />
                  );
                })()}
              </Box>
            </Box>
              ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${currentGame.players.length}, 1fr) 60px`,
                gap: 0.5,
              }}
            >
              {currentGame.players.map((player, playerIndex) => {
                const playerColor =
                  playerIndex % 2 === 0
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main;
                const isCurrentPlayer = player.id === currentPlayer?.id;
                const avgMarksPerRound =
                  avgMarksPerRoundByPlayer[player.id] ?? 0;
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
                      player={player as any}
                      isCurrentPlayer={isCurrentPlayer}
                      avgMarksPerRound={avgMarksPerRound}
                      playerIndex={playerIndex}
                      />
                  </Box>
                );
              })}
              {/* Empty column to match grid layout */}
              <Box />
            </Box>
              )}
            </Box>
          )}
        </Paper>

        {/* Number Grid - Showing all players' progress on hidden numbers */}
        <Box
          sx={{
            flex: "1 1 0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 0.5,
            minHeight: 0,
            width: "100%",
            transition: "flex 0.3s ease-in-out",
          }}
        >
          {currentGame.players.length === 2 ? (
            <HiddenCricketTwoPlayersLayout
              players={currentGame.players}
              currentPlayerId={currentPlayer?.id || null}
              rounds={currentGame.rounds}
              currentRound={currentGame.currentRound}
              renderMarks={renderMarks}
              renderClosedMark={renderClosedMark}
              getNumberDisplayText={getNumberDisplayText}
              isNumberClosedByAll={isNumberClosedByAll}
              hasCurrentPlayerClosedAllNonBull={
                hasCurrentPlayerClosedAllNonBull
              }
              lastBull={currentGame.lastBull}
              isInputExpanded={isInputExpanded}
              hiddenNumbersSorted={hiddenNumbersSorted}
            />
          ) : (
            <HiddenCricketMultiPlayersLayout
              players={currentGame.players}
              currentPlayerId={currentPlayer?.id || null}
              rounds={currentGame.rounds}
              currentRound={currentGame.currentRound}
              renderMarks={renderMarks}
              renderClosedMark={renderClosedMark}
              getNumberDisplayText={getNumberDisplayText}
              isNumberClosedByAll={isNumberClosedByAll}
              hasCurrentPlayerClosedAllNonBull={
                hasCurrentPlayerClosedAllNonBull
              }
              lastBull={currentGame.lastBull}
              isInputExpanded={isInputExpanded}
              hiddenNumbersSorted={hiddenNumbersSorted}
            />
          )}
        </Box>

        {/* Number Input Buttons (1-20, Bull) - Collapsible */}
        <Paper
          sx={{
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {/* Collapse/Expand Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1,
              cursor: "pointer",
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
            onClick={() => setIsInputExpanded(!isInputExpanded)}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              Select Number
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsInputExpanded(!isInputExpanded);
              }}
            >
              {isInputExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Collapsible Content */}
          <Box
            sx={{
              maxHeight: isInputExpanded ? "50vh" : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <Box sx={{ p: 1 }}>
              <Grid container spacing={0.5}>
                {allNumbers.map((number) => {
                  const currentRoundDarts =
                    currentGame.currentRound?.darts.length || 0;
                  const isTurnComplete = currentRoundDarts >= 3;
                  const isClosedByAll = isNumberClosedByAll(number);

                  return (
                    <Grid item xs={3} sm={2} md={2} key={number}>
                      <VibrationButton
                        variant="outlined"
                        onClick={() => handleNumberClick(number)}
                        disabled={currentGame.isGameFinished || isTurnComplete}
                        vibrationPattern={50}
                        fullWidth
                        sx={{
                          minHeight: { xs: 40, sm: 48 },
                          fontSize: { xs: "0.875rem", sm: "1rem" },
                          color: isClosedByAll ? "error.main" : "inherit",
                          borderColor: isClosedByAll ? "error.main" : "inherit",
                          "&:hover": {
                            borderColor: isClosedByAll
                              ? "error.dark"
                              : "inherit",
                            backgroundColor: isClosedByAll
                              ? "error.light"
                              : "inherit",
                          },
                        }}
                      >
                        {number === "Bull" ? (
                          <BullSymbol size="1.5rem" />
                        ) : (
                          number
                        )}
                      </VibrationButton>
                    </Grid>
                  );
                })}
                {/* Miss button */}
                <Grid item xs={3} sm={2} md={2}>
                  <VibrationButton
                    variant="outlined"
                    color="error"
                    onClick={handleMiss}
                    disabled={
                      currentGame.isGameFinished ||
                      (currentGame.currentRound?.darts.length || 0) >= 3
                    }
                    vibrationPattern={50}
                    fullWidth
                    sx={{
                      minHeight: { xs: 40, sm: 48 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Miss
                  </VibrationButton>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>

        {/* Bottom Action Bar */}
        <Paper
          sx={{
            p: 1,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            gap: 1,
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
              gap: 1,
            }}
          >
            <Button
              variant="text"
              color="info"
              size="large"
              onClick={handleUndo}
              sx={{
                py: 0.75,
                fontSize: "1rem",
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
              {/* Dart count indicator */}
              {currentGame.currentRound && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    fontWeight: 600,
                  }}
                >
                  Darts: {currentGame.currentRound.darts.length}/3
                </Typography>
              )}
              {currentGame.currentRound &&
              currentGame.currentRound.darts.length > 0 ? (
                (() => {
                  // Get current player's color
                  const currentPlayerIndex = currentGame.currentPlayerIndex;
                  const playerColor =
                    currentPlayerIndex % 2 === 0
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main;

                  // Group darts by target number and count occurrences
                  const groupedDarts = currentGame.currentRound.darts.reduce(
                    (acc, dart) => {
                      const key = String(dart.targetNumber);
                      if (!acc[key]) {
                        acc[key] = { count: 0, totalPoints: 0 };
                      }
                      if (dart.targetNumber === "Miss") {
                        acc[key].count += 1; // Count misses
                      } else {
                        acc[key].count += dart.multiplier;
                      }
                      acc[key].totalPoints += dart.points;
                      return acc;
                    },
                    {} as Record<
                      string,
                      { count: number; totalPoints: number }
                    >,
                  );

                  return Object.entries(groupedDarts).map(
                    ([targetNumber, data]) => (
                      <Box
                        key={targetNumber}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          px: { xs: 1.25, sm: 1.5 },
                          py: { xs: 0.65, sm: 0.75 },
                          borderRadius: 1,
                          backgroundColor: alpha(playerColor, 0.1),
                          border: `1px solid ${alpha(playerColor, 0.3)}`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "1.15rem", sm: "1.35rem" },
                          }}
                        >
                          {targetNumber === "Miss"
                            ? `Miss${data.count > 1 ? ` (${data.count})` : ""}`
                            : data.count > 1
                              ? <>
                                  {data.count}×
                                  {targetNumber === "Bull" ? (
                                    <BullSymbol />
                                  ) : (
                                    targetNumber
                                  )}
                                </>
                              : targetNumber === "Bull" ? (
                                  <BullSymbol />
                                ) : (
                                  targetNumber
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
                    ),
                  );
                })()
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
              buttonSize="compact"
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default HiddenCricketGame;
