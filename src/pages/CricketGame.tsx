import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Undo,
  EmojiEvents,
  ExitToApp,
  CheckCircle,
  SportsScore,
  ExpandMore,
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

  const handleHit = (number: number | string, multiplier: number) => {
    if (!currentGame) return;
    recordHit(number, multiplier);
  };

  const handleUndo = () => {
    if (!currentGame) return;
    undoLastHit();
  };

  const handleFinishTurn = () => {
    if (!currentGame) return;
    finishTurn();
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

    const marks = [];
    for (let i = 0; i < Math.min(hits, 3); i++) {
      marks.push(
        <Box
          key={i}
          component="span"
          sx={{
            display: "inline-block",
            width: "8px",
            height: "16px",
            mx: "1px",
            bgcolor: "primary.main",
            borderRadius: i === 1 ? "0" : "4px",
            transform: i === 1 ? "rotate(45deg)" : "none",
          }}
        />
      );
    }

    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>{marks}</Box>
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

      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Players Section */}

        {/* Game Board */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="subtitle1">
                {currentPlayer?.name}'s Turn
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Darts remaining: {3 - (currentPlayer?.currentDartIndex || 0)}
                </Typography>
                {currentPlayer && currentPlayer.currentDartIndex > 0 && (
                  <Button
                    size="small"
                    onClick={handleFinishTurn}
                    startIcon={<SportsScore />}
                    sx={{ ml: 2 }}
                  >
                    Finish Turn
                  </Button>
                )}
              </Box>
            </Box>
            <IconButton size="small" onClick={handleUndo}>
              <Undo />
            </IconButton>
          </Box>

          {/* Cricket Scoreboard */}
          <Box sx={{ mb: 2, overflow: "auto" }}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {/* Header row with player names */}
              <Box
                sx={{
                  display: "flex",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                {/* Determine player count and layout */}
                {(() => {
                  // Check if player count is valid
                  if (!currentGame?.players?.length) return null;

                  const playerCount = currentGame.players.length;
                  const isEven = playerCount % 2 === 0;
                  const halfCount = Math.floor(playerCount / 2);

                  // Create array of elements to render
                  const headerElements = [];

                  // For even player count, first half of players come first
                  if (isEven) {
                    // First half of players
                    currentGame.players
                      .slice(0, halfCount)
                      .forEach((player, idx) => {
                        headerElements.push(
                          <Box
                            key={`first-half-${player.id}`}
                            sx={{
                              flex: 1,
                              minWidth: 100,
                              p: 1,
                              fontWeight: "bold",
                              textAlign: "center",
                              borderRight: 1,
                              borderColor: "divider",
                              bgcolor:
                                idx === currentGame.currentPlayerIndex
                                  ? (theme) =>
                                      alpha(theme.palette.primary.main, 0.1)
                                  : "transparent",
                              borderBottom:
                                idx === currentGame.currentPlayerIndex
                                  ? (theme) =>
                                      `2px solid ${theme.palette.primary.main}`
                                  : "none",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {player?.name}
                            </Typography>
                            <Typography
                              variant="body1"
                              color="primary.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              {player.totalScore}
                            </Typography>
                          </Box>
                        );
                      });

                    // Target column in the middle
                    headerElements.push(
                      <Box
                        key="targets-header"
                        sx={{
                          width: 80,
                          p: 1,
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRight: 1,
                          borderColor: "divider",
                        }}
                      >
                        Target
                      </Box>
                    );

                    // Second half of players
                    currentGame.players
                      .slice(halfCount)
                      .forEach((player, idx) => {
                        const actualIdx = idx + halfCount;
                        headerElements.push(
                          <Box
                            key={`second-half-${player.id}`}
                            sx={{
                              flex: 1,
                              minWidth: 100,
                              p: 1,
                              fontWeight: "bold",
                              textAlign: "center",
                              borderRight: actualIdx < playerCount - 1 ? 1 : 0,
                              borderColor: "divider",
                              bgcolor:
                                actualIdx === currentGame.currentPlayerIndex
                                  ? (theme) =>
                                      alpha(theme.palette.primary.main, 0.1)
                                  : "transparent",
                              borderBottom:
                                actualIdx === currentGame.currentPlayerIndex
                                  ? (theme) =>
                                      `2px solid ${theme.palette.primary.main}`
                                  : "none",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {player?.name}
                            </Typography>
                            <Typography
                              variant="body1"
                              color="primary.main"
                              sx={{ fontWeight: "bold" }}
                            >
                              {player.totalScore}
                            </Typography>
                          </Box>
                        );
                      });
                  } else {
                    // For odd player count, targets on the left
                    // Target column first
                    headerElements.push(
                      <Box
                        key="targets-header"
                        sx={{
                          width: 80,
                          p: 1,
                          fontWeight: "bold",
                          textAlign: "center",
                          borderRight: 1,
                          borderColor: "divider",
                        }}
                      >
                        Target
                      </Box>
                    );

                    // All players
                    currentGame.players.forEach((player, idx) => {
                      headerElements.push(
                        <Box
                          key={`player-${player.id}`}
                          sx={{
                            flex: 1,
                            minWidth: 100,
                            p: 1,
                            fontWeight: "bold",
                            textAlign: "center",
                            borderRight: idx < playerCount - 1 ? 1 : 0,
                            borderColor: "divider",
                            bgcolor:
                              idx === currentGame.currentPlayerIndex
                                ? (theme) =>
                                    alpha(theme.palette.primary.main, 0.1)
                                : "transparent",
                            borderBottom:
                              idx === currentGame.currentPlayerIndex
                                ? (theme) =>
                                    `2px solid ${theme.palette.primary.main}`
                                : "none",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {player?.name}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="primary.main"
                            sx={{ fontWeight: "bold" }}
                          >
                            {player.totalScore}
                          </Typography>
                        </Box>
                      );
                    });
                  }

                  return headerElements;
                })()}
              </Box>

              {/* Rows for each number */}
              {[20, 19, 18, 17, 16, 15, "Bull"].map((number) => (
                <Box
                  key={number}
                  sx={{
                    display: "flex",
                    borderBottom: number !== "Bull" ? 1 : 0,
                    borderColor: "divider",
                  }}
                >
                  {/* Determine layout based on player count */}
                  {(() => {
                    // Check if player count is valid
                    if (!currentGame?.players?.length) return null;

                    const playerCount = currentGame.players.length;
                    const isEven = playerCount % 2 === 0;
                    const halfCount = Math.floor(playerCount / 2);

                    // Create array of elements to render
                    const rowElements = [];

                    // For even player count, first half of players come first
                    if (isEven) {
                      // First half of players
                      currentGame.players
                        .slice(0, halfCount)
                        .forEach((player, playerIndex) => {
                          const target = player?.targets?.find(
                            (t) => t.number === number
                          );
                          if (!target) return null;

                          rowElements.push(
                            <Box
                              key={`first-half-${player.id}-${number}`}
                              sx={{
                                flex: 1,
                                minWidth: 100,
                                p: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRight: 1,
                                borderColor: "divider",
                                position: "relative",
                                bgcolor:
                                  playerIndex === currentGame.currentPlayerIndex
                                    ? (theme) =>
                                        alpha(theme.palette.primary.main, 0.05)
                                    : "transparent",
                              }}
                            >
                              {target.closed ? (
                                <CheckCircle color="success" />
                              ) : (
                                renderMarks(target.hits)
                              )}

                              {currentGame?.gameType !== "no-score" &&
                                target.points > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      position: "absolute",
                                      top: 2,
                                      right: 4,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {target.points}
                                  </Typography>
                                )}
                            </Box>
                          );
                        });

                      // Number label in the middle
                      rowElements.push(
                        <Box
                          key={`target-${number}`}
                          sx={{
                            width: 80,
                            p: 1,
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRight: 1,
                            borderColor: "divider",
                          }}
                        >
                          {number}
                        </Box>
                      );

                      // Second half of players
                      currentGame.players
                        .slice(halfCount)
                        .forEach((player, idx) => {
                          const playerIndex = idx + halfCount;
                          const target = player?.targets?.find(
                            (t) => t.number === number
                          );
                          if (!target) return null;

                          rowElements.push(
                            <Box
                              key={`second-half-${player.id}-${number}`}
                              sx={{
                                flex: 1,
                                minWidth: 100,
                                p: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRight:
                                  playerIndex < playerCount - 1 ? 1 : 0,
                                borderColor: "divider",
                                position: "relative",
                                bgcolor:
                                  playerIndex === currentGame.currentPlayerIndex
                                    ? (theme) =>
                                        alpha(theme.palette.primary.main, 0.05)
                                    : "transparent",
                              }}
                            >
                              {target.closed ? (
                                <CheckCircle color="success" />
                              ) : (
                                renderMarks(target.hits)
                              )}

                              {currentGame?.gameType !== "no-score" &&
                                target.points > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      position: "absolute",
                                      top: 2,
                                      right: 4,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {target.points}
                                  </Typography>
                                )}
                            </Box>
                          );
                        });
                    } else {
                      // For odd count, targets on the left
                      // Number label first
                      rowElements.push(
                        <Box
                          key={`target-${number}`}
                          sx={{
                            width: 80,
                            p: 1,
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRight: 1,
                            borderColor: "divider",
                          }}
                        >
                          {number}
                        </Box>
                      );

                      // All players
                      currentGame.players.forEach((player, playerIndex) => {
                        const target = player?.targets?.find(
                          (t) => t.number === number
                        );
                        if (!target) return null;

                        rowElements.push(
                          <Box
                            key={`player-${player.id}-${number}`}
                            sx={{
                              flex: 1,
                              minWidth: 100,
                              p: 1,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              borderRight:
                                playerIndex < playerCount - 1 ? 1 : 0,
                              borderColor: "divider",
                              position: "relative",
                              bgcolor:
                                playerIndex === currentGame.currentPlayerIndex
                                  ? (theme) =>
                                      alpha(theme.palette.primary.main, 0.05)
                                  : "transparent",
                            }}
                          >
                            {target.closed ? (
                              <CheckCircle color="success" />
                            ) : (
                              renderMarks(target.hits)
                            )}

                            {currentGame?.gameType !== "no-score" &&
                              target.points > 0 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    position: "absolute",
                                    top: 2,
                                    right: 4,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {target.points}
                                </Typography>
                              )}
                          </Box>
                        );
                      });
                    }

                    return rowElements;
                  })()}
                </Box>
              ))}
            </Box>
          </Box>
          {/* Dart Input */}
          <Box sx={{ mb: 2 }}>
            {/* New Cricket Board Input UI */}
            <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
              {/* Cricket numbers */}
              {[20, 19, 18, 17, 16, 15, "Bull"].map((number) => {
                const target = currentPlayer?.targets?.find(
                  (t) => t.number === number
                );

                // Check if ALL players have closed this number
                const allPlayersClosed = currentGame.players.every(
                  (player) =>
                    player.targets.find((t) => t.number === number)?.closed
                );

                const isCurrentPlayerClosed = target?.closed || false;
                // Disable if player has used all 3 darts or if all players have closed the number
                const dartLimitReached =
                  (currentPlayer?.currentDartIndex || 0) >= 3;
                const isDisabled = allPlayersClosed || dartLimitReached;

                return (
                  <Grid container key={number} spacing={1} sx={{ mb: 1 }}>
                    {/* Number label */}
                    <Grid item xs={2}>
                      <Box
                        sx={{
                          display: "flex",
                          height: "48px",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          position: "relative",
                          bgcolor:
                            isCurrentPlayerClosed && !allPlayersClosed
                              ? (theme) =>
                                  alpha(theme.palette.success.light, 0.1)
                              : undefined,
                          borderRadius: 1,
                          border:
                            isCurrentPlayerClosed && !allPlayersClosed
                              ? "1px solid"
                              : "none",
                          borderColor: "success.main",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            textDecoration: allPlayersClosed
                              ? "line-through"
                              : "none",
                            color:
                              isCurrentPlayerClosed && !allPlayersClosed
                                ? "success.main"
                                : "text.primary",
                          }}
                        >
                          {number}
                        </Typography>
                        {isCurrentPlayerClosed && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 3,
                              right: 3,
                              width: 12,
                              height: 12,
                            }}
                          >
                            <CheckCircle
                              color="success"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Single Button */}
                    <Grid item xs={3}>
                      <VibrationButton
                        variant="outlined"
                        fullWidth
                        size="small"
                        disabled={isDisabled}
                        onClick={() => handleHit(number, 1)}
                        vibrationPattern={50}
                        sx={{
                          height: "48px",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        Single
                      </VibrationButton>
                    </Grid>

                    {/* Double Button */}
                    <Grid item xs={3}>
                      <VibrationButton
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        size="small"
                        disabled={isDisabled}
                        onClick={() => handleHit(number, 2)}
                        vibrationPattern={75}
                        sx={{
                          height: "48px",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        Double
                      </VibrationButton>
                    </Grid>

                    {/* Triple Button */}
                    <Grid item xs={4}>
                      <VibrationButton
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="small"
                        disabled={isDisabled}
                        onClick={() => handleHit(number, 3)}
                        vibrationPattern={100}
                        sx={{
                          height: "48px",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        Triple
                      </VibrationButton>
                    </Grid>
                  </Grid>
                );
              })}

              {/* Miss Button */}
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <VibrationButton
                  variant="outlined"
                  color="error"
                  disabled={currentPlayer?.currentDartIndex >= 3}
                  onClick={() => handleHit(0, 0)}
                  vibrationPattern={[50, 100, 50]}
                  sx={{ width: 120 }}
                >
                  Miss
                </VibrationButton>
              </Box>
            </Paper>

            {/* Quick Hit Stats */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Current player: <strong>{currentPlayer?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Darts remaining:{" "}
                <strong>{3 - (currentPlayer?.currentDartIndex || 0)}</strong>
              </Typography>
            </Box>
          </Box>

          {/* Round History as Accordion */}
          {currentGame?.rounds && currentGame.rounds.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Accordion defaultExpanded={false}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls="round-history-content"
                  id="round-history-header"
                >
                  <Typography variant="subtitle1">
                    Round History ({currentGame.rounds.length} rounds)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper
                    variant="outlined"
                    sx={{ maxHeight: "250px", overflow: "auto" }}
                  >
                    <List dense>
                      {currentGame.rounds.map((round, roundIndex) => {
                        const player = currentGame.players.find(
                          (p) => p.id === round.playerId
                        );

                        return (
                          <ListItem
                            key={roundIndex}
                            divider={roundIndex < currentGame.rounds.length - 1}
                          >
                            <ListItemText
                              primary={`Round ${roundIndex + 1}: ${
                                player?.name || "Unknown Player"
                              }`}
                              secondary={
                                <Box>
                                  <Typography
                                    variant="caption"
                                    component="span"
                                  >
                                    Darts:{" "}
                                    {round.darts.map((dart, i) => (
                                      <span key={i}>
                                        {dart.targetNumber || "Miss"}
                                        {dart.multiplier > 1
                                          ? `×${dart.multiplier}`
                                          : ""}
                                        {i < round.darts.length - 1 ? ", " : ""}
                                      </span>
                                    ))}
                                    {round.totalPoints > 0 &&
                                      ` | Points: ${round.totalPoints}`}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Paper>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CricketGame;
