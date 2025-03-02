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
import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { useX01Store } from "../store/useX01Store";
import { useHistoryStore } from "../store/useHistoryStore";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useLocation } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";
import DartInputErrorBoundary from "../components/DartInputErrorBoundary";
import checkoutGuide from "../utils/checkoutGuide";

type InputMode = "numeric" | "board";

const X01Game: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { players } = useStore();
  const {
    currentGame,
    recordScore,
    undoLastScore,
    endGame,
    startGame,
    setInputMode: setStoreInputMode,
    setPlayers,
  } = useX01Store();
  const { addCompletedGame } = useHistoryStore();
  const [inputMode, setInputMode] = useState<InputMode>("numeric");
  const [showRoundAvg, setShowRoundAvg] = useState(false);

  // Handle game finished dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  // Handle navigation confirmation dialog
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  // Add flag to prevent infinite loop
  const [isInitialized, setIsInitialized] = useState(false);
  // Track game start time
  const gameStartTimeRef = useRef<number>(Date.now());
  // Track if game is saved to history
  const gameSavedToHistoryRef = useRef<boolean>(false);

  // Update cached players in X01Store
  useEffect(() => {
    setPlayers(players);
  }, [players, setPlayers]);

  useEffect(() => {
    // Sync local inputMode with store inputMode
    if (currentGame && !isInitialized) {
      if (inputMode === "numeric") {
        setStoreInputMode("numeric");
      } else if (inputMode === "board") {
        setStoreInputMode("dart");
      }
      setIsInitialized(true);
    }
  }, [currentGame, inputMode, setStoreInputMode, isInitialized]);

  useEffect(() => {
    // Initialize inputMode from store when currentGame is available
    if (currentGame && currentGame.inputMode) {
      const newMode = currentGame.inputMode === "numeric" ? "numeric" : "board";
      setInputMode(newMode);
    }
  }, [currentGame]);

  useEffect(() => {
    if (!currentGame) {
      navigate("/x01");
    } else if (currentGame.isGameFinished && !dialogOpen) {
      // Open dialog when game is finished
      setDialogOpen(true);

      // Save the completed game to history if not already saved
      if (!gameSavedToHistoryRef.current) {
        saveGameToHistory();
        gameSavedToHistoryRef.current = true;
      }
    }
  }, [currentGame, navigate, dialogOpen]);

  // Reset game start time and history flag when a new game starts
  useEffect(() => {
    if (currentGame && !currentGame.isGameFinished) {
      gameStartTimeRef.current = Date.now();
      gameSavedToHistoryRef.current = false;
    }
  }, [currentGame]);

  // Save the completed game to history
  const saveGameToHistory = () => {
    if (!currentGame || !currentGame.isGameFinished) return;

    // Find the winner (player with score of exactly 0)
    const winner = currentGame.players.find((p) => p.score === 0);

    // Calculate game duration in seconds
    const gameDuration = Math.floor(
      (Date.now() - gameStartTimeRef.current) / 1000
    );

    // Create the X01CompletedGame object
    const completedGame = {
      id: uuidv4(),
      gameType: currentGame.gameType,
      timestamp: Date.now(),
      isDoubleOut: currentGame.isDoubleOut,
      isDoubleIn: currentGame.isDoubleIn,
      duration: gameDuration,
      winnerId: winner ? winner.id : null,
      players: currentGame.players.map((player) => {
        const initialScore = player.initialScore;
        const pointsScored = initialScore - player.score;

        return {
          id: player.id,
          name: player.name,
          initialScore: player.initialScore,
          finalScore: player.score,
          dartsThrown: player.dartsThrown,
          rounds100Plus: player.rounds100Plus,
          rounds140Plus: player.rounds140Plus,
          rounds180: player.rounds180,
          checkoutSuccess: player.checkoutSuccess,
          checkoutAttempts: player.checkoutAttempts,
          avgPerDart:
            player.dartsThrown > 0 ? pointsScored / player.dartsThrown : 0,
          avgPerRound:
            player.dartsThrown > 0
              ? pointsScored / Math.ceil(player.dartsThrown / 3)
              : 0,
          scores: player.scores.map((score) => ({
            score: score.score,
            darts: score.darts,
          })),
        };
      }),
    };

    // Add the completed game to history
    addCompletedGame(completedGame);
  };

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

  // Handle changes to inputMode without creating an infinite loop
  const handleInputModeChange = (newMode: InputMode) => {
    setInputMode(newMode);

    // Update the store with the appropriate value
    if (currentGame) {
      // Convert "board" to "dart" for the store
      const storeMode: "numeric" | "dart" =
        newMode === "numeric" ? "numeric" : "dart";

      // Fix: Use setInputMode method from the store instead of direct state update
      if (currentGame) {
        useX01Store.getState().setInputMode(storeMode);
        console.log("X01Game: Updated store inputMode to", storeMode);
      }
    }
  };

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
                onChange={(_, newMode) =>
                  newMode && handleInputModeChange(newMode)
                }
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
              <DartInputErrorBoundary>
                <DartInput
                  onScore={(score, dartsUsed, lastDartMultiplier) =>
                    recordScore(score, dartsUsed, lastDartMultiplier)
                  }
                />
              </DartInputErrorBoundary>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// Move PlayerBox to its own dedicated component
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

  // Check if we need to display checkout guide (score below 170)
  const showCheckoutGuide = player.score <= 170 && player.score > 1;
  const checkoutPath = showCheckoutGuide ? checkoutGuide[player.score] : null;

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

      {/* Checkout guide */}
      {showCheckoutGuide && checkoutPath && (
        <Box
          sx={{
            mt: 1,
            p: 0.75,
            borderRadius: 1,
            backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08),
            border: "1px dashed",
            borderColor: "success.main",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: "bold",
              color: "success.main",
              fontSize: "0.7rem",
              mb: 0.25,
            }}
          >
            CHECKOUT
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: "medium", lineHeight: 1.2 }}
          >
            {checkoutPath}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default X01Game;
