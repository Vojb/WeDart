import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
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
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  Undo,
  EmojiEvents,
  ExitToApp,
  NavigateNext,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useCricketStore } from "../store/useCricketStore";
import { useStore } from "../store/useStore";
import VibrationButton from "../components/VibrationButton";
import { vibrateDevice } from "../theme/ThemeProvider";
import CricketPlayerBox from "../components/cricket-player-box/cricket-player-box";
import CountUp from "../components/count-up/count-up";
import { motion, Variants } from "framer-motion";

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
  } = useCricketStore();
  const { countdownDuration } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidGame, setIsValidGame] = useState(true);
  const [lastClickTime, setLastClickTime] = useState<number>(Date.now());
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const progressStartTimeRef = useRef<number>(Date.now());

  // Cricket numbers in order
  const cricketNumbers = [20, 19, 18, 17, 16, 15, "Bull"];

  // Auto-advance timer: configurable duration after last click (only starts after first click)
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) {
      // Clear timer if game is finished
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      return;
    }

    // Only start timer if the current player has made at least one click
    // Check if currentRound has any darts
    const hasMadeClicks = currentGame.currentRound && currentGame.currentRound.darts.length > 0;

    if (!hasMadeClicks) {
      // Clear timer and progress if player hasn't clicked yet
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      return;
    }

    // Clear existing timer and interval
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Reset progress
    setProgress(0);
    progressStartTimeRef.current = Date.now();

    // Set new timer
    const durationMs = countdownDuration * 1000;
    autoAdvanceTimerRef.current = setTimeout(() => {
      finishTurn();
    }, durationMs);

    // Update progress every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Cleanup
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [lastClickTime, currentGame, finishTurn, countdownDuration]);

  const shape: React.CSSProperties = {
    strokeWidth: 10,
    strokeLinecap: "round",
    fill: "transparent",
  }

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => {
      const delay = i * 0.5
      return {
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
          opacity: { delay, duration: 0.01 },
        },
      }
    },
  }
  // Reset progress when player changes (new turn starts)
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) return;

    // Only reset if current round is empty (new turn just started)
    const isNewTurn = currentGame.currentRound && currentGame.currentRound.darts.length === 0;

    if (isNewTurn) {
      // Clear timer and progress when a new turn starts
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
    }
  }, [currentGame?.currentPlayerIndex, currentGame?.currentRound?.darts.length, currentGame?.isGameFinished]);

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

  const handleHit = (number: number | string) => {
    if (!currentGame || currentGame.isGameFinished) return;
    // Always use multiplier 1 (single hit per click)
    recordHit(number, 1);
    // Vibrate on hit
    vibrateDevice(50);
    // Update last click time to reset auto-advance timer
    setLastClickTime(Date.now());
  };

  const handleUndo = () => {
    if (!currentGame) return;
    undoLastHit();
    // Vibrate on undo
    vibrateDevice([50, 30, 50]);
    setLastClickTime(Date.now());
  };

  const handleFinishTurn = () => {
    if (!currentGame) return;
    // Clear auto-advance timer and progress interval
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(0);
    finishTurn();
    setLastClickTime(Date.now());
  };

  const handleLeaveGame = () => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/cricket");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  const handlePlayAgain = () => {
    // Start a new game with the same players and settings
    if (currentGame?.players && currentGame.players.length > 0) {
      setCricketPlayers(
        currentGame.players.map((p) => ({ id: p.id, name: p.name }))
      );
      endGame();
      setTimeout(() => {
        navigate("/cricket");
      }, 100);
    } else {
      // If there's an issue with the current game, just navigate back
      endGame();
      navigate("/cricket");
    }
  };

  const handleReturnToSetup = () => {
    // End the current game and navigate back to setup
    endGame();
    setDialogOpen(false);
    navigate("/cricket");
  };

  // Function to render marks (0-3) for a player's target with animation
  const renderMarks = (hits: number, color?: string) => {
    if (hits === 0) return null;

    const viewBoxSize = 48;
    const center = viewBoxSize / 2;
    const lineLength = 36;
    const strokeWidth = 4;
    const primaryColor = color || theme.palette.primary.main;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: { xs: 32, sm: 40, md: 48 },
          height: { xs: 32, sm: 40, md: 48 },
          margin: "0 auto",
        }}
      >
        <motion.svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          {/* First hit - Slash (/) */}
          {hits >= 1 && (
            <motion.line
              key={`slash-${hits}`}
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
              key={`backslash-${hits}`}
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
    );
  };

  // Function to render closed mark (ring with cross)
  const renderClosedMark = (color?: string) => {
    const viewBoxSize = 48;
    const center = viewBoxSize / 2;
    const lineLength = 36;
    const circleRadius = 18;
    const strokeWidth = 4;
    const primaryColor = color || theme.palette.primary.main;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: { xs: 32, sm: 40, md: 48 },
          height: { xs: 32, sm: 40, md: 48 },
          margin: "0 auto",
        }}
      >
        <motion.svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
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

  // Get current player's target for a number
  const getCurrentPlayerTarget = (number: number | string) => {
    return currentPlayer?.targets?.find((t) => t.number === number);
  };

  // Check if a number can be clicked (not closed or opponent hasn't closed it)
  const canClickNumber = (number: number | string) => {
    if (currentGame.isGameFinished) return false;
    const target = getCurrentPlayerTarget(number);
    if (!target) return false;

    // Can click if target is not closed, or if any opponent hasn't closed it
    if (!target.closed) return true;

    return currentGame.players.some((p) => {
      if (p.id === currentPlayer.id) return false;
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
        onClose={() => { }} // Prevent closing by clicking outside
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
                          Darts thrown: {player.dartsThrown}
                        </Typography>
                        <Typography
                          variant="body2"
                          component="span"
                          display="block"
                        >
                          Closed numbers:{" "}
                          {player.targets.filter((t) => t.closed).length} of 7
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <VibrationButton onClick={handleReturnToSetup} vibrationPattern={50}>
            Return to Setup
          </VibrationButton>
          <VibrationButton
            onClick={handlePlayAgain}
            variant="contained"
            color="primary"
            vibrationPattern={100}
          >
            Play Again
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


          {/* Player Headers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: (() => {
                const playerCount = currentGame.players.length;
                if (playerCount === 1) return `1fr 60px`;
                if (playerCount === 2) {
                  const firstHalf = Math.ceil(playerCount / 2);
                  const secondHalf = playerCount - firstHalf;
                  return `repeat(${firstHalf}, 1fr) 60px repeat(${secondHalf}, 1fr)`;
                }
                // For 3+ players, number goes last
                return `repeat(${playerCount}, 1fr) 60px`;
              })(),
              gap: 0.5,
            }}
          >
            {(() => {
              const playerCount = currentGame.players.length;
              // For 1-2 players, split in half with number in middle
              if (playerCount <= 2) {
                const firstHalf = Math.ceil(playerCount / 2);
                return (
                  <>
                    {/* First half of players */}
                    {currentGame.players.slice(0, firstHalf).map((player) => {
                      const playerIndex = currentGame.players.indexOf(player);
                      const playerColor = playerIndex % 2 === 0 
                        ? theme.palette.primary.main 
                        : theme.palette.secondary.main;
                      const isCurrentPlayer = player.id === currentPlayer?.id;
                      const playerRounds = currentGame.rounds.filter((round) => round.playerId === player.id);
                      const allRounds = [...playerRounds];
                      if (currentGame.currentRound && currentGame.currentRound.playerId === player.id) {
                        allRounds.push(currentGame.currentRound);
                      }
                      const totalMarks = allRounds.reduce((sum, round) => sum + round.darts.length, 0);
                      const avgMarksPerRound = allRounds.length > 0 ? totalMarks / allRounds.length : 0;

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

                    {/* Number label column header */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography variant="body2" fontWeight="bold">
                        Number
                      </Typography>
                    </Box>

                    {/* Second half of players */}
                    {currentGame.players.slice(firstHalf).map((player) => {
                      const playerIndex = currentGame.players.indexOf(player);
                      const playerColor = playerIndex % 2 === 0 
                        ? theme.palette.primary.main 
                        : theme.palette.secondary.main;
                      const isCurrentPlayer = player.id === currentPlayer?.id;
                      const playerRounds = currentGame.rounds.filter((round) => round.playerId === player.id);
                      const allRounds = [...playerRounds];
                      if (currentGame.currentRound && currentGame.currentRound.playerId === player.id) {
                        allRounds.push(currentGame.currentRound);
                      }
                      const totalMarks = allRounds.reduce((sum, round) => sum + round.darts.length, 0);
                      const avgMarksPerRound = allRounds.length > 0 ? totalMarks / allRounds.length : 0;

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

              // For 3+ players, all players first, then number
              return (
                <>
                  {currentGame.players.map((player, playerIndex) => {
                    const playerColor = playerIndex % 2 === 0 
                      ? theme.palette.primary.main 
                      : theme.palette.secondary.main;
                    const isCurrentPlayer = player.id === currentPlayer?.id;
                    const playerRounds = currentGame.rounds.filter((round) => round.playerId === player.id);
                    const allRounds = [...playerRounds];
                    if (currentGame.currentRound && currentGame.currentRound.playerId === player.id) {
                      allRounds.push(currentGame.currentRound);
                    }
                    const totalMarks = allRounds.reduce((sum, round) => sum + round.darts.length, 0);
                    const avgMarksPerRound = allRounds.length > 0 ? totalMarks / allRounds.length : 0;

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

                  {/* Number label column header - positioned last */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" fontWeight="bold">
                      Number
                    </Typography>
                  </Box>
                </>
              );
            })()}
          </Box>
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
                      if (playerCount === 1) return `1fr 60px`;
                      if (playerCount === 2) {
                        const firstHalf = Math.ceil(playerCount / 2);
                        const secondHalf = playerCount - firstHalf;
                        return `repeat(${firstHalf}, 1fr) 60px repeat(${secondHalf}, 1fr)`;
                      }
                      // For 3+ players, number goes last
                      return `repeat(${playerCount}, 1fr) 60px`;
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
                        {currentGame.players.slice(0, firstHalfCount).map((player) => {
                          const playerIndex = currentGame.players.indexOf(player);
                          const playerColor = playerIndex % 2 === 0 
                            ? theme.palette.primary.main 
                            : theme.palette.secondary.main;
                          const target = player.targets.find((t) => t.number === number);
                          const isCurrentPlayer = player.id === currentPlayer?.id;
                          const isClosed = target?.closed || false;
                          const isClickable = isCurrentPlayer && canClick;

                          return (
                            <Box
                              key={`${player.id}-${number}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
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
                              onClick={() => isClickable && handleHit(number)}
                            >
                              {target && (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                                  {isClosed ? (
                                    renderClosedMark(playerColor)
                                  ) : (
                                    renderMarks(target.hits, playerColor)
                                  )}
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
                              fontSize: { xs: "1.2rem", sm: "1.5rem", md: "2rem" },
                            }}
                          >
                            {number}
                          </Typography>
                        </Box>

                        {/* Second half of players */}
                        {currentGame.players.slice(firstHalfCount).map((player) => {
                          const playerIndex = currentGame.players.indexOf(player);
                          const playerColor = playerIndex % 2 === 0 
                            ? theme.palette.primary.main 
                            : theme.palette.secondary.main;
                          const target = player.targets.find((t) => t.number === number);
                          const isCurrentPlayer = player.id === currentPlayer?.id;
                          const isClosed = target?.closed || false;
                          const isClickable = isCurrentPlayer && canClick;

                          return (
                            <Box
                              key={`${player.id}-${number}`}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
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
                              onClick={() => isClickable && handleHit(number)}
                            >
                              {target && (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                                  {isClosed ? (
                                    renderClosedMark(playerColor)
                                  ) : (
                                    renderMarks(target.hits, playerColor)
                                  )}

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
                        const playerColor = playerIndex % 2 === 0 
                          ? theme.palette.primary.main 
                          : theme.palette.secondary.main;
                        const target = player.targets.find((t) => t.number === number);
                        const isCurrentPlayer = player.id === currentPlayer?.id;
                        const isClosed = target?.closed || false;
                        const isClickable = isCurrentPlayer && canClick;

                        return (
                          <Box
                            key={`${player.id}-${number}`}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
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
                            onClick={() => isClickable && handleHit(number)}
                          >
                            {target && (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                                {isClosed ? (
                                  renderClosedMark(playerColor)
                                ) : (
                                  renderMarks(target.hits, playerColor)
                                )}
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
                            fontSize: { xs: "1.2rem", sm: "1.5rem", md: "2rem" },
                          }}
                        >
                          {number}
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: (() => {
                const playerCount = currentGame.players.length;
                if (playerCount === 1) return `1fr 60px`;
                if (playerCount === 2) {
                  const firstHalf = Math.ceil(playerCount / 2);
                  const secondHalf = playerCount - firstHalf;
                  return `repeat(${firstHalf}, 1fr) 60px repeat(${secondHalf}, 1fr)`;
                }
                return `repeat(${playerCount}, 1fr) 60px`;
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
                    {currentGame.players.slice(0, firstHalfCount).map((player) => {
                      const playerIndex = currentGame.players.indexOf(player);
                      const playerColor = playerIndex % 2 === 0 
                        ? theme.palette.primary.main 
                        : theme.palette.secondary.main;
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
                              fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
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
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Score
                      </Typography>
                    </Box>

                    {/* Second half of players - total score */}
                    {currentGame.players.slice(firstHalfCount).map((player) => {
                      const playerIndex = currentGame.players.indexOf(player);
                      const playerColor = playerIndex % 2 === 0 
                        ? theme.palette.primary.main 
                        : theme.palette.secondary.main;
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
                              fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
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
                    const playerColor = playerIndex % 2 === 0 
                      ? theme.palette.primary.main 
                      : theme.palette.secondary.main;
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
                            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
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
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
        </Box>

        {/* Bottom Action Bar - Next Button */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row", gap: 2,
          }}
        >
          <Box sx={{ flex: 1, flexDirection: "row", flexWrap:"wrap", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
            <IconButton onClick={handleUndo} color="info" size="small">
              <Undo />
            </IconButton>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {currentGame.currentRound && currentGame.currentRound.darts.length > 0 ? (
              (() => {
                // Get current player's color
                const currentPlayerIndex = currentGame.currentPlayerIndex;
                const playerColor = currentPlayerIndex % 2 === 0 
                  ? theme.palette.primary.main 
                  : theme.palette.secondary.main;
                
                // Group darts by target number and count occurrences
                const groupedDarts = currentGame.currentRound.darts.reduce((acc, dart) => {
                  const key = String(dart.targetNumber);
                  if (!acc[key]) {
                    acc[key] = { count: 0, totalPoints: 0 };
                  }
                  acc[key].count += dart.multiplier;
                  acc[key].totalPoints += dart.points;
                  return acc;
                }, {} as Record<string, { count: number; totalPoints: number }>);

                return Object.entries(groupedDarts).map(([targetNumber, data]) => (
                  <Box
                    key={targetNumber}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: alpha(playerColor, 0.1),
                      border: `1px solid ${alpha(playerColor, 0.3)}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      {data.count > 1 ? `${data.count}x${targetNumber}` : targetNumber}
                    </Typography>
                    {data.totalPoints > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "secondary.main",
                          fontWeight: 600,
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        }}
                      >
                        (+{data.totalPoints})
                      </Typography>
                    )}
                  </Box>
                ));
              })()
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  fontStyle: "italic",
                }}
              >
                No darts thrown yet
              </Typography>
            )}
          </Box>
          </Box>

          {/* Round Summary */}
         

          <Box >

            <VibrationButton

              variant="contained"
              color={currentPlayer && currentGame.currentPlayerIndex % 2 === 0 ? "primary" : "secondary"}
              fullWidth
              size="large"
              onClick={handleFinishTurn}
              disabled={currentGame.isGameFinished}
              vibrationPattern={100}
              startIcon={<NavigateNext />}
              sx={{
                flex: 1,
                py: 1.5,
                fontSize: "1.2rem",
                fontWeight: "bold",
                position: "relative",
                overflow: "hidden",
                "&::before": !currentGame.isGameFinished && progress > 0
                  ? {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${progress}%`,
                    backgroundColor: (theme) =>
                      alpha(theme.palette.common.white, 0.3),
                    transition: "width 0.05s linear",
                  }
                  : {},
              }}
            >
              Next
            </VibrationButton>
            {/* Progress bar indicator */}
            {!currentGame.isGameFinished && progress > 0 && (
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: "transparent",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: (theme) => theme.palette.common.white,
                  },
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CricketGame;
