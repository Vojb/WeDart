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
  Card,
  CardContent,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Undo,
  EmojiEvents,
  ExitToApp,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useHalfItStore } from "../store/useHalfItStore";
import VibrationButton from "../components/VibrationButton";

const HalfItGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentGame, recordScore, undoLastScore, endGame, setHalfItPlayers } =
    useHalfItStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [currentScore, setCurrentScore] = useState<string>("");
  const [dartsUsed, setDartsUsed] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidGame, setIsValidGame] = useState(true);

  // If no game is in progress, redirect to setup
  useEffect(() => {
    // Add a slight delay to ensure proper state initialization
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/halfit");
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
        navigate("/halfit");
        return;
      }

      // Ensure sequence array exists and is not empty
      if (!currentGame.sequence || currentGame.sequence.length === 0) {
        console.error("Sequence array is empty or undefined");
        setIsValidGame(false);
        navigate("/halfit");
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
        navigate("/halfit");
        return;
      }

      // Check to ensure currentRound is defined
      const currentRound = currentGame.sequence[currentGame.currentRoundIndex];
      if (!currentRound) {
        console.error("Current round is undefined", {
          currentRoundIndex: currentGame.currentRoundIndex,
          sequence: currentGame.sequence,
        });
        setIsValidGame(false);
        navigate("/halfit");
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

  // Safely access currentPlayer and currentRound now that we've validated
  const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
  const currentRound = currentGame.sequence[currentGame.currentRoundIndex];

  const handleSubmitScore = () => {
    const score = parseInt(currentScore) || 0;
    recordScore(score, dartsUsed);
    setCurrentScore("");
    setDartsUsed(3);
  };

  const handleUndo = () => {
    undoLastScore();
  };

  const handleLeaveGame = () => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/halfit");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  const handlePlayAgain = () => {
    // Start a new game with the same players
    if (currentGame && currentGame.players && currentGame.players.length > 0) {
      setHalfItPlayers(
        currentGame.players.map((p) => ({ id: p.id, name: p.name }))
      );
      endGame();
      setTimeout(() => {
        navigate("/halfit");
      }, 100);
    } else {
      // If there's an issue with the current game, just navigate back
      endGame();
      navigate("/halfit");
    }
  };

  const handleReturnToSetup = () => {
    // End the current game and navigate back to setup
    endGame();
    setDialogOpen(false);
    navigate("/halfit");
  };

  // Ensure safe access to players data
  const hasPlayers = currentGame.players && currentGame.players.length > 0;
  const hasWinner = hasPlayers && currentGame.players.some((p) => p.isWinner);
  const winner = hasWinner ? currentGame.players.find((p) => p.isWinner) : null;

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
            Final Scores
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {hasPlayers &&
              currentGame.players
                .sort((a, b) => b.score - a.score) // Sort by score (highest first)
                .map((player) => (
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
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography>{player.name}</Typography>
                          <Typography fontWeight="bold">
                            {player.score} points
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
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
                            Rounds completed: {player.rounds.length}
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
        <Box
          sx={{
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              minWidth: "fit-content",
            }}
          >
            {currentGame.players.map((player, idx) => (
              <Paper
                key={player.id}
                sx={{
                  p: 1,
                  minWidth: "120px",
                  position: "relative",
                  backgroundColor: (theme) =>
                    idx === currentGame.currentPlayerIndex
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                  borderLeft: (theme) =>
                    idx === currentGame.currentPlayerIndex
                      ? `4px solid ${theme.palette.primary.main}`
                      : "none",
                }}
              >
                <Typography variant="body1" noWrap>
                  {player.name}
                </Typography>
                <Typography variant="h5">{player.score}</Typography>
                <Typography variant="caption">
                  Round: {player.rounds.length + 1}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

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
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1">
              {currentPlayer.name}'s Turn
            </Typography>
            <IconButton size="small" onClick={handleUndo}>
              <Undo />
            </IconButton>
          </Box>

          {/* Current Round */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Round {currentGame.currentRoundIndex + 1} of{" "}
                {currentGame.sequence.length}
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                Target: {currentRound.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentRound.multiplier > 1
                  ? `Hit ${currentRound.description} to score ${currentRound.multiplier}x points`
                  : `Hit ${currentRound.description} to score points. Miss and your score is halved!`}
              </Typography>
            </CardContent>
          </Card>

          {/* Score Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Enter Score
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Score"
                  variant="outlined"
                  type="number"
                  value={currentScore}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow valid scores (0-180)
                    if (
                      value === "" ||
                      (parseInt(value) >= 0 && parseInt(value) <= 180)
                    ) {
                      setCurrentScore(value);
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        points
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Darts"
                  variant="outlined"
                  type="number"
                  value={dartsUsed}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 3) {
                      setDartsUsed(value);
                    }
                  }}
                  inputProps={{ min: 1, max: 3 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Submit Button */}
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleSubmitScore}
            >
              Submit Score
            </Button>
          </Box>

          {/* Round History */}
          {currentPlayer.rounds.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Round History
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <List dense>
                  {currentPlayer.rounds.map((round, idx) => (
                    <ListItem
                      key={idx}
                      divider={idx < currentPlayer.rounds.length - 1}
                    >
                      <ListItemText
                        primary={`Round ${idx + 1}: ${
                          round.target.description
                        }`}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              Score:{" "}
                              {round.score === 0
                                ? "Miss (Halved)"
                                : round.score}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Darts: {round.dartsUsed}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default HalfItGame;
