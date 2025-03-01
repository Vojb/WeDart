import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Calculate,
  GridOn,
  Undo,
  EmojiEvents,
  ExitToApp,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate, useLocation } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";

type InputMode = "numeric" | "board";

export default function X01Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentGame, recordScore, undoLastScore, endGame, startGame } =
    useStore();
  const [inputMode, setInputMode] = useState<InputMode>("numeric");
  const [showRoundAvg, setShowRoundAvg] = useState(false);

  // Handle game finished dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  // Handle navigation confirmation dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  useEffect(() => {
    if (!currentGame) {
      navigate("/x01");
    } else if (currentGame.isGameFinished && !dialogOpen) {
      // Open dialog when game is finished
      setDialogOpen(true);
    }
  }, [currentGame, navigate, dialogOpen]);

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

  if (!currentGame) return null;

  // Find the winner (player with score of exactly 0)
  const winner = currentGame.players.find((p) => p.score === 0);

  // Calculate stats for all players
  const playerStats = currentGame.players.map((player) => {
    const initialScore = player.initialScore;
    const pointsScored = initialScore - player.score;
    const avgPerDart =
      player.dartsThrown > 0
        ? (pointsScored / player.dartsThrown).toFixed(1)
        : "0.0";
    const checkoutPercentage =
      player.checkoutAttempts > 0
        ? Math.round((player.checkoutSuccess / player.checkoutAttempts) * 100)
        : 0;

    return {
      ...player,
      avgPerDart,
      pointsScored,
      checkoutPercentage,
    };
  });

  const handleUndo = () => {
    if (currentGame) {
      undoLastScore();
    }
  };

  const handlePlayAgain = () => {
    // Start a new game with the same players and settings
    const playerIds = currentGame.players.map((player) => player.id);
    startGame(currentGame.gameType, playerIds);
    setDialogOpen(false);
  };

  const handleReturnToSetup = () => {
    // End the current game and navigate back to setup
    endGame();
    setDialogOpen(false);
    navigate("/x01");
  };

  const handleLeaveGame = () => {
    // End the current game and navigate back
    endGame();
    setLeaveDialogOpen(false);
    navigate("/x01");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
            {playerStats.map((player) => (
              <ListItem
                key={player.id}
                sx={{
                  mb: 1,
                  backgroundColor:
                    player.score === 0
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
                        Average: {player.avgPerDart} points per dart
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
                        100+ rounds: {player.rounds100Plus}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        140+ rounds: {player.rounds140Plus}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        180s: {player.rounds180}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReturnToSetup}>Return to Setup</Button>
          <Button onClick={handlePlayAgain} variant="contained" color="primary">
            Play Again
          </Button>
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
          <Button onClick={handleCancelLeave}>Cancel</Button>
          <Button onClick={handleLeaveGame} variant="contained" color="error">
            Leave Game
          </Button>
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
            minHeight: "fit-content",
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
              <PlayerBox
                key={player.id}
                player={player}
                index={idx}
                isCurrentPlayer={idx === currentGame.currentPlayerIndex}
                showRoundAvg={showRoundAvg}
                onToggleAvgView={() => setShowRoundAvg(!showRoundAvg)}
              />
            ))}
          </Box>
        </Box>

        {/* Input Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 1,
          }}
        >
          <Box
            sx={{
              mb: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                size="small"
                onChange={(_, newMode) => newMode && setInputMode(newMode)}
              >
                <ToggleButton value="numeric">
                  <Calculate />
                </ToggleButton>
                <ToggleButton value="board">
                  <GridOn />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <IconButton size="small" onClick={handleUndo} sx={{ ml: 1 }}>
              <Undo />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {inputMode === "numeric" ? (
              <NumericInput onScore={recordScore} />
            ) : (
              <DartInput onScore={recordScore} />
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// Component to display player information in a box
function PlayerBox({
  player,
  isCurrentPlayer,
  showRoundAvg,
  onToggleAvgView,
}: {
  player: any;
  index: number;
  isCurrentPlayer: boolean;
  showRoundAvg: boolean;
  onToggleAvgView: () => void;
}) {
  // Calculate player-specific averages
  const playerInitialScore = player.initialScore;
  const playerPointsScored = playerInitialScore - player.score;
  const playerDartsThrown = player.dartsThrown || 1; // Avoid division by zero
  const playerRoundsPlayed = Math.ceil(playerDartsThrown / 3);

  const playerAvgPerDart = (playerPointsScored / playerDartsThrown).toFixed(1);
  const playerAvgPerRound = (
    playerPointsScored / playerRoundsPlayed || 0
  ).toFixed(1);

  return (
    <Paper
      sx={{
        p: 1,
        flex: "1 1 0", // Changed to make boxes equally fill the container
        minWidth: "120px", // Minimum width to ensure playability on smaller screens
        position: "relative", // For absolute positioning of last round score
        backgroundColor: (theme) =>
          isCurrentPlayer
            ? alpha(theme.palette.primary.main, 0.1)
            : "transparent",
        borderLeft: (theme) =>
          isCurrentPlayer ? `4px solid ${theme.palette.primary.main}` : "none",
      }}
    >
      {/* Show "Bust" if last score is 0 but we have scores (meaning a bust occurred) */}
      {player.lastRoundScore === 0 && player.scores.length > 0 ? (
        <Typography
          variant="body2"
          sx={{
            opacity: 0.3,
            color: "error.main",
            position: "absolute",
            top: 4,
            right: 8,
            fontWeight: "bold",
          }}
        >
          Bust
        </Typography>
      ) : player.lastRoundScore > 0 ? (
        <Typography
          variant="body2"
          sx={{
            opacity: 0.3,
            color: "text.secondary",
            position: "absolute",
            top: 4,
            right: 8,
          }}
        >
          {player.lastRoundScore}
        </Typography>
      ) : null}
      <Typography variant="body1" noWrap>
        {player.name}
      </Typography>
      <Typography variant="h5">{player.score}</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ cursor: "pointer" }}
          onClick={onToggleAvgView}
        >
          Avg: {showRoundAvg ? playerAvgPerRound : playerAvgPerDart}
        </Typography>
        <Typography variant="caption">Darts: {player.dartsThrown}</Typography>
      </Box>
    </Paper>
  );
}
