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
} from "@mui/material";
import {
  Undo,
  EmojiEvents,
  ExitToApp,
  CheckCircle,
  NavigateNext,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useCricketStore } from "../store/useCricketStore";
import VibrationButton from "../components/VibrationButton";

const CricketGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentGame,
    recordHit,
    undoLastHit,
    endGame,
    setCricketPlayers,
    finishTurn,
  } = useCricketStore();
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

  // Auto-advance timer: 5 seconds after last click (only starts after first click)
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
    autoAdvanceTimerRef.current = setTimeout(() => {
      finishTurn();
    }, 5000);

    // Update progress every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const newProgress = Math.min((elapsed / 5000) * 100, 100);
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
  }, [lastClickTime, currentGame, finishTurn]);

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
    // Update last click time to reset auto-advance timer
    setLastClickTime(Date.now());
  };

  const handleUndo = () => {
    if (!currentGame) return;
    undoLastHit();
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

  // Function to render marks (0-3) for a player's target
  const renderMarks = (hits: number) => {
    if (hits === 0) return null;

    // Container to hold the marks
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: { xs: 16, sm: 20, md: 24 },
          height: { xs: 16, sm: 20, md: 24 },
          margin: "0 auto",
        }}
      >
        {/* First hit - Slash (/) */}
        {hits >= 1 && (
          <Box
            sx={{
              position: "absolute",
              width: "2px",
              height: { xs: "14px", sm: "16px", md: "20px" },
              bgcolor: "primary.main",
              transform: "rotate(45deg)",
            }}
          />
        )}

        {/* Second hit - Cross (X) - adds backslash (\) */}
        {hits >= 2 && (
          <Box
            sx={{
              position: "absolute",
              width: "2px",
              height: { xs: "14px", sm: "16px", md: "20px" },
              bgcolor: "primary.main",
              transform: "rotate(-45deg)",
            }}
          />
        )}

        {/* Third hit - Circle with cross */}
        {hits >= 3 && (
          <Box
            sx={{
              position: "absolute",
              width: { xs: "14px", sm: "16px", md: "20px" },
              height: { xs: "14px", sm: "16px", md: "20px" },
              border: "2px solid",
              borderColor: "primary.main",
              borderRadius: "50%",
            }}
          />
        )}
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              {currentPlayer?.name}'s Turn
            </Typography>
            <IconButton onClick={handleUndo} color="primary" size="small">
              <Undo />
            </IconButton>
          </Box>
          
          {/* Player Headers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: (() => {
                const playerCount = currentGame.players.length;
                if (playerCount === 1) return `1fr 60px`;
                const firstHalf = Math.ceil(playerCount / 2);
                const secondHalf = playerCount - firstHalf;
                return `repeat(${firstHalf}, 1fr) 60px repeat(${secondHalf}, 1fr)`;
              })(),
              gap: 0.5,
            }}
          >
            {/* First half of players */}
            {currentGame.players.slice(0, Math.ceil(currentGame.players.length / 2)).map((player) => {
              const isCurrentPlayer = player.id === currentPlayer?.id;
              const closedCount = player.targets.filter((t) => t.closed).length;
              
              return (
                <Paper
                  key={player.id}
                  elevation={isCurrentPlayer ? 4 : 1}
                  sx={{
                    p: 0.5,
                    backgroundColor: isCurrentPlayer
                      ? (theme) => alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    border: isCurrentPlayer
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1px solid",
                    borderColor: isCurrentPlayer
                      ? "primary.main"
                      : "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentPlayer ? "bold" : "normal",
                      mb: 0.25,
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}
                  >
                    {player.totalScore}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    {closedCount}/7
                  </Typography>
                </Paper>
              );
            })}
            
            {/* Number label column header - positioned between players */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" fontWeight="bold">
                Number
              </Typography>
            </Box>
            
            {/* Second half of players */}
            {currentGame.players.slice(Math.ceil(currentGame.players.length / 2)).map((player) => {
              const isCurrentPlayer = player.id === currentPlayer?.id;
              const closedCount = player.targets.filter((t) => t.closed).length;
              
              return (
                <Paper
                  key={player.id}
                  elevation={isCurrentPlayer ? 4 : 1}
                  sx={{
                    p: 0.5,
                    backgroundColor: isCurrentPlayer
                      ? (theme) => alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    border: isCurrentPlayer
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1px solid",
                    borderColor: isCurrentPlayer
                      ? "primary.main"
                      : "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentPlayer ? "bold" : "normal",
                      mb: 0.25,
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}
                  >
                    {player.totalScore}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
                    {closedCount}/7
                  </Typography>
                </Paper>
              );
            })}
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
            const currentPlayerTarget = getCurrentPlayerTarget(number);
            const canClick = canClickNumber(number);
            const playerCount = currentGame.players.length;
            const firstHalfCount = Math.ceil(playerCount / 2);

            return (
              <Paper
                key={number}
                elevation={1}
                sx={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: (() => {
                    const playerCount = currentGame.players.length;
                    if (playerCount === 1) return `1fr 60px`;
                    const firstHalf = Math.ceil(playerCount / 2);
                    const secondHalf = playerCount - firstHalf;
                    return `repeat(${firstHalf}, 1fr) 60px repeat(${secondHalf}, 1fr)`;
                  })(),
                  gap: 0.5,
                  p: 0.5,
                  minHeight: 0,
                }}
              >
                {/* First half of players */}
                {currentGame.players.slice(0, firstHalfCount).map((player) => {
                  const target = player.targets.find((t) => t.number === number);
                  const isCurrentPlayer = player.id === currentPlayer?.id;
                  const isClosed = target?.closed || false;
                  const isClickable = isCurrentPlayer && canClick;

                  return (
                    <Paper
                      key={`${player.id}-${number}`}
                      elevation={isClickable ? 4 : 1}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: isClickable ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        backgroundColor: isClosed
                          ? (theme) => alpha(theme.palette.success.main, 0.1)
                          : isClickable
                          ? (theme) => alpha(theme.palette.primary.main, 0.05)
                          : "transparent",
                        border: isClickable
                          ? (theme) => `2px solid ${theme.palette.primary.main}`
                          : isCurrentPlayer
                          ? (theme) => `1px solid ${theme.palette.primary.main}`
                          : "1px solid",
                        borderColor: isClickable
                          ? "primary.main"
                          : isCurrentPlayer
                          ? "primary.main"
                          : "divider",
                        "&:hover": isClickable
                          ? {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.15),
                              transform: "scale(1.02)",
                            }
                          : {},
                        "&:active": isClickable
                          ? {
                              transform: "scale(0.98)",
                            }
                          : {},
                      }}
                      onClick={() => isClickable && handleHit(number)}
                    >
                      {target && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                          {isClosed ? (
                            <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24, md: 32 } }} />
                          ) : (
                            renderMarks(target.hits)
                          )}
                          {currentGame?.gameType !== "no-score" && target.points > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                color: "primary.main",
                                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                              }}
                            >
                              +{target.points}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}

                {/* Number Label - positioned between players */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
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
                  const target = player.targets.find((t) => t.number === number);
                  const isCurrentPlayer = player.id === currentPlayer?.id;
                  const isClosed = target?.closed || false;
                  const isClickable = isCurrentPlayer && canClick;

                  return (
                    <Paper
                      key={`${player.id}-${number}`}
                      elevation={isClickable ? 4 : 1}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: isClickable ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        backgroundColor: isClosed
                          ? (theme) => alpha(theme.palette.success.main, 0.1)
                          : isClickable
                          ? (theme) => alpha(theme.palette.primary.main, 0.05)
                          : "transparent",
                        border: isClickable
                          ? (theme) => `2px solid ${theme.palette.primary.main}`
                          : isCurrentPlayer
                          ? (theme) => `1px solid ${theme.palette.primary.main}`
                          : "1px solid",
                        borderColor: isClickable
                          ? "primary.main"
                          : isCurrentPlayer
                          ? "primary.main"
                          : "divider",
                        "&:hover": isClickable
                          ? {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.15),
                              transform: "scale(1.02)",
                            }
                          : {},
                        "&:active": isClickable
                          ? {
                              transform: "scale(0.98)",
                            }
                          : {},
                      }}
                      onClick={() => isClickable && handleHit(number)}
                    >
                      {target && (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                          {isClosed ? (
                            <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24, md: 32 } }} />
                          ) : (
                            renderMarks(target.hits)
                          )}
                          {currentGame?.gameType !== "no-score" && target.points > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                color: "primary.main",
                                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                              }}
                            >
                              +{target.points}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Paper>
            );
          })}
        </Box>

        {/* Bottom Action Bar - Next Button */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <VibrationButton
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleFinishTurn}
              disabled={currentGame.isGameFinished}
              vibrationPattern={100}
              startIcon={<NavigateNext />}
              sx={{
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
              Next Player
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
