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
  ArrowBack,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { useX01Store } from "../store/useX01Store";
import { useHistoryStore } from "../store/useHistoryStore";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useBlocker, BlockerFunction } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";
import DartInputErrorBoundary from "../components/DartInputErrorBoundary";
import checkoutGuide from "../utils/checkoutGuide";
import VibrationButton from "../components/VibrationButton";

type InputMode = "numeric" | "board";

const X01Game: React.FC = () => {
  const navigate = useNavigate();
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        currentGame &&
        !currentGame.isGameFinished &&
        !gameSavedToHistoryRef.current
      ) {
        // Standard way to show a confirmation dialog before closing the window
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentGame]);

  // Use useBlocker to handle navigation attempts
  const blocker: BlockerFunction = () => {
    if (
      currentGame &&
      !currentGame.isGameFinished &&
      !gameSavedToHistoryRef.current
    ) {
      setLeaveDialogOpen(true);
      return true; // Block the navigation
    }
    return false; // Allow the navigation
  };

  useBlocker(blocker);

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
    navigate(-1);
  };

  const handleLeaveGame = () => {
    // End the current game and navigate back
    endGame();
    setLeaveDialogOpen(false);
    navigate(-1);
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  // Handle recording scores
  const handleScore = (
    score: number,
    darts: number,
    lastDartMultiplier?: number
  ) => {
    if (currentGame && !currentGame.isGameFinished) {
      const player = currentGame.players[currentGame.currentPlayerIndex];
      const remainingAfterScore = player.score - score;

      // Record the score
      recordScore(score, darts, lastDartMultiplier);

      // Check if the player has won (reached exactly 0)
      if (remainingAfterScore === 0) {
        // Save the game to history and display the game finished dialog
        saveGameToHistory();
        setDialogOpen(true);
      }
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Dialog open={dialogOpen} maxWidth="sm" fullWidth onClose={() => {}}>
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
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Players Section */}
        <Box
          sx={{
            p: 0.5,
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto",
            flexShrink: 0,
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
            p: { xs: 0.5, sm: 1 },
          }}
        >
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {inputMode === "numeric" ? (
              <NumericInput
                onScore={handleScore}
                currentPlayerScore={
                  currentGame?.players[currentGame.currentPlayerIndex]?.score
                }
                doubleOutRequired={false}
              />
            ) : (
              <DartInputErrorBoundary>
                <DartInput
                  onScore={(score, dartsUsed, lastDartMultiplier) =>
                    handleScore(score, dartsUsed, lastDartMultiplier)
                  }
                />
              </DartInputErrorBoundary>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            mb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            px: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => setLeaveDialogOpen(true)}
              sx={{ mr: 0.5 }}
              aria-label="back to setup"
            >
              <ArrowBack />
            </IconButton>

            <ToggleButtonGroup
              value={inputMode}
              exclusive
              size="small"
              onChange={(_, newMode) =>
                newMode && handleInputModeChange(newMode)
              }
            >
              <ToggleButton value="numeric" sx={{ px: { xs: 0.5, sm: 1 } }}>
                <Calculate />
              </ToggleButton>
              <ToggleButton value="board" sx={{ px: { xs: 0.5, sm: 1 } }}>
                <GridOn />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <IconButton size="small" onClick={handleUndo} sx={{ ml: 0.5 }}>
            <Undo />
          </IconButton>
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
        p: { xs: 0.5, sm: 1 }, // Responsive padding
        flex: "1 1 0", // Changed to make boxes equally fill the container
        minWidth: { xs: "100px", sm: "120px" }, // Responsive minimum width
        position: "relative", // For absolute positioning of last round score
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: (theme) =>
          isCurrentPlayer
            ? alpha(theme.palette.primary.main, 0.1)
            : "transparent",
        borderLeft: (theme) =>
          isCurrentPlayer ? `4px solid ${theme.palette.primary.main}` : "none",
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        gap={0.5} // Reduced gap
        justifyContent="space-between"
      >
        {/* Show "Bust" if last score is 0 but we have scores (meaning a bust occurred) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="body1"
            noWrap
            sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }} // Responsive font size
          >
            {player.name}
          </Typography>
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
                fontSize: { xs: "0.7rem", sm: "0.875rem" }, // Responsive font size
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
                fontSize: { xs: "0.7rem", sm: "0.875rem" }, // Responsive font size
              }}
            >
              {player.lastRoundScore}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1 }, // Responsive gap
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              fontSize: { xs: "1.8rem", sm: "2.125rem" }, // Responsive font size
              lineHeight: 1.1,
            }}
          >
            {player.score}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1 }, // Responsive gap
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              cursor: "pointer",
              fontSize: { xs: "0.65rem", sm: "0.75rem" }, // Responsive font size
            }}
            onClick={onToggleAvgView}
          >
            Avg: {showRoundAvg ? playerAvgPerRound : playerAvgPerDart}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }} // Responsive font size
          >
            Darts: {player.dartsThrown}
          </Typography>
        </Box>
        {showCheckoutGuide && checkoutPath && (
          <Box
            sx={{
              p: { xs: 0.5, sm: 0.75 }, // Responsive padding
              borderRadius: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.success.main, 0.2)
                  : alpha(theme.palette.success.main, 0.1),
              border: "1px solid",
              borderColor: "success.main",
              mt: { xs: 0.5, sm: 0.75 }, // Responsive margin
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                lineHeight: 1.2,
                fontSize: { xs: "0.7rem", sm: "0.875rem" }, // Responsive font size
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.success.light
                    : theme.palette.success.dark,
              }}
            >
              {checkoutPath}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default X01Game;
