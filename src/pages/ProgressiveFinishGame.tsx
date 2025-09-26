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
  IconButton,
  Stack,
  Chip,
  Button,
  DialogContentText,
} from "@mui/material";
import {
  Calculate,
  GridOn,
  Undo,
  ArrowBack,
  Mic,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { useProgressiveFinishStore } from "../store/useProgressiveFinishStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useBlocker, BlockerFunction } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";
import DartInputErrorBoundary from "../components/DartInputErrorBoundary";
import VoiceInput from "../components/VoiceInput";

type InputMode = "numeric" | "board" | "voice";

const ProgressiveFinishGame: React.FC = () => {
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
  } = useProgressiveFinishStore();
  const { addCompletedGame } = useHistoryStore();
  const [inputMode, setInputMode] = useState<InputMode>("numeric");

  // Get microphone permission status from store
  const { permissionSettings } = useStore();
  const isMicrophoneEnabled = permissionSettings.microphone.enabled;

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

  // Update cached players in ProgressiveFinishStore
  useEffect(() => {
    // Convert Player[] to ProgressiveFinishPlayer[]
    const progressiveFinishPlayers = players.map((player) => ({
      id: player.id,
      name: player.name,
      currentScore: 0,
      dartsThrown: 0,
      levelsCompleted: 0,
      totalDartsUsed: 0,
      scores: [],
      avgPerDart: 0,
      avgPerLevel: 0,
    }));
    setPlayers(progressiveFinishPlayers);
  }, [players, setPlayers]);

  useEffect(() => {
    // Sync local inputMode with store inputMode
    if (currentGame && !isInitialized) {
      if (inputMode === "numeric") {
        setStoreInputMode("numeric");
      } else if (inputMode === "board") {
        setStoreInputMode("dart");
      } else if (inputMode === "voice") {
        setStoreInputMode("numeric");
      }
      setIsInitialized(true);
    }
  }, [currentGame, inputMode, setStoreInputMode, isInitialized]);

  // If microphone is disabled and current input mode is voice, switch to numeric
  useEffect(() => {
    if (!isMicrophoneEnabled && inputMode === "voice") {
      setInputMode("numeric");
    }
  }, [isMicrophoneEnabled, inputMode]);

  useEffect(() => {
    // Initialize inputMode from store when currentGame is available
    if (currentGame && currentGame.inputMode && !isInitialized) {
      const newMode = currentGame.inputMode === "numeric" ? "numeric" : "board";
      setInputMode(newMode);
      setIsInitialized(true);
    }
  }, [currentGame, isInitialized]);

  useEffect(() => {
    if (!currentGame) {
      navigate("/progressive-finish");
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

    // Calculate game duration in seconds
    const gameDuration = Math.floor(
      (Date.now() - gameStartTimeRef.current) / 1000
    );

    // Create the ProgressiveFinishCompletedGame object
    const completedGame = {
      id: uuidv4(),
      gameType: "progressive-finish" as const,
      timestamp: Date.now(),
      duration: gameDuration,
      winnerId: null, // Progressive Finish doesn't have a single winner
      highestLevelReached: currentGame.highestLevelReached,
      players: currentGame.players.map((player) => ({
        id: player.id,
        name: player.name,
        dartsThrown: player.dartsThrown,
        avgPerDart: player.avgPerDart,
        levelsCompleted: player.levelsCompleted,
        totalDartsUsed: player.totalDartsUsed,
        avgPerLevel: player.avgPerLevel,
        scores: player.scores.map((score) => ({
          score: score.score,
          darts: score.darts,
          level: score.level,
        })),
      })),
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
    // Don't allow switching to voice if microphone is not enabled
    if (newMode === "voice" && !isMicrophoneEnabled) {
      return;
    }

    // Set the input mode regardless of the current game state
    setInputMode(newMode);

    // Update the store with the appropriate value only if there's a current game
    if (currentGame) {
      // Convert "board" or "voice" to "dart" for the store
      const storeMode: "numeric" | "dart" =
        newMode === "numeric" ? "numeric" : "dart";

      // Use setInputMode method from the store
      useProgressiveFinishStore.getState().setInputMode(storeMode);
      console.log(
        "ProgressiveFinishGame: Updated store inputMode to",
        storeMode
      );
    }
  };

  if (!currentGame) return null;

  const handleUndo = () => {
    if (currentGame) {
      undoLastScore();
    }
  };

  const handleNewGame = () => {
    // Start a new game with the same players and settings
    const playerIds = currentGame.players.map((player) => player.id);
    startGame(playerIds);
    setDialogOpen(false);
  };

  const handleReturnToSetup = () => {
    // End the current game and navigate back to setup
    endGame();
    setDialogOpen(false);
    navigate(-1);
  };


  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  // Handle recording scores
  const handleScore = (
    score: number,
    darts: number
  ) => {
    if (currentGame && !currentGame.isGameFinished) {
      // Record the score
      recordScore(score, darts);

      // Check if the game is finished after the score is recorded
      const updatedGame = useProgressiveFinishStore.getState().currentGame;
      if (updatedGame && updatedGame.isGameFinished) {
        saveGameToHistory();
        setDialogOpen(true);
      }
    }
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper
        sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Game Info Section */}
        <Box sx={{ mb: 2 }}>
          <Stack spacing={1}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              align="center"
            >
              Level {currentGame.currentLevel}
            </Typography>

            {/* Remaining Score - Big Display */}
            <Box sx={{ textAlign: "center", my: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "4rem", sm: "6rem" },
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {currentGame.remainingScore}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                {currentGame.remainingScore === currentGame.targetScore
                  ? "Target Score"
                  : "Remaining"}
              </Typography>
            </Box>

            {/* Current Player and Status */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`Darts Left: ${currentGame.remainingDarts}`}
                color={currentGame.remainingDarts <= 2 ? "warning" : "default"}
                size="small"
              />
              <Chip
                label={`Failures: ${currentGame.failures}/${currentGame.maxFailures}`}
                color={
                  currentGame.failures >= currentGame.maxFailures - 1
                    ? "error"
                    : "default"
                }
                size="small"
              />
            </Box>
          </Stack>
        </Box>

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
            {currentGame.players.map((player, index) => (
              <PlayerBox
                key={player.id}
                player={player}
                isCurrentPlayer={currentGame.currentPlayerIndex === index}
                remainingScore={currentGame.remainingScore}
              />
            ))}
          </Box>
        </Box>

        {/* Rest of the game UI */}
        <Box
          sx={{
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
                currentPlayerScore={currentGame.remainingScore}
              />
            ) : inputMode === "board" ? (
              <DartInputErrorBoundary>
                <DartInput
                  onScore={(score, dartsUsed) =>
                    handleScore(score, dartsUsed)
                  }
                  gameContext={{
                    currentPlayerIndex: currentGame.currentPlayerIndex,
                    players: currentGame.players.map((player) => ({
                      id: player.id,
                      name: player.name,
                      score: currentGame.remainingScore,
                      scores: player.scores,
                    })),
                    isDoubleIn: false,
                    isDoubleOut: false,
                  }}
                />
              </DartInputErrorBoundary>
            ) : (
              <VoiceInput
                handleScore={(score, darts) =>
                  handleScore(score, darts)
                }
              />
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
              {isMicrophoneEnabled && (
                <ToggleButton value="voice" sx={{ px: { xs: 0.5, sm: 1 } }}>
                  <Mic />
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Box>

          <IconButton size="small" onClick={handleUndo} sx={{ ml: 0.5 }}>
            <Undo />
          </IconButton>
        </Box>
      </Paper>

      {/* Game Finished Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="game-finished-dialog-title"
      >
        <DialogTitle id="game-finished-dialog-title">
          Game Finished!
        </DialogTitle>
        <DialogContent>
          <Typography variant="h5" color="primary" gutterBottom>
            Highest Level Reached: {currentGame.highestLevelReached}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Final Results:
          </Typography>
          <Typography variant="body1" gutterBottom>
            Team Performance:
          </Typography>
          {currentGame.players.map((player) => (
            <Typography key={player.id} variant="body2">
              {player.name}: {player.dartsThrown} darts (Avg:{" "}
              {player.avgPerDart.toFixed(1)} per dart)
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReturnToSetup}>Return to Setup</Button>
          <Button onClick={handleNewGame} variant="contained" color="primary">
            Play Again
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleCancelLeave}
        aria-labelledby="leave-dialog-title"
      >
        <DialogTitle id="leave-dialog-title">Leave Game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave? Your current game progress will be
            lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLeave}>Cancel</Button>
          <Button onClick={handleReturnToSetup} color="error">
            Leave Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Move PlayerBox to its own dedicated component
function PlayerBox({
  player,
  isCurrentPlayer,
  remainingScore,
}: {
  player: any;
  isCurrentPlayer: boolean;
  remainingScore: number;
}) {
  return (
    <Paper
      sx={{
        p: { xs: 0.5, sm: 1 },
        flex: "1 1 0",
        minWidth: { xs: "100px", sm: "120px" },
        position: "relative",
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
        gap={0.5}
        justifyContent="space-between"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            noWrap
            sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}
          >
            {player.name}
          </Typography>
        </Box>

        {/* Player's current stats */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            mt: 1,
            gap: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              lineHeight: 1.1,
              textAlign: "center",
              color: isCurrentPlayer ? "primary.main" : "text.primary",
            }}
          >
            {remainingScore}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              textAlign: "center",
              fontSize: { xs: "0.6rem", sm: "0.75rem" },
            }}
          >
            Remaining
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1 },
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
            }}
          >
            Avg: {player.avgPerDart.toFixed(1)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          >
            Darts: {player.dartsThrown}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default ProgressiveFinishGame;
