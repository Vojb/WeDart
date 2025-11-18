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
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Calculate,
  GridOn,
  Undo,
  ArrowBack,
  Mic,
  Cancel,
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
import VoiceInput from "../components/VoiceInput";
import VibrationButton from "../components/VibrationButton";

type InputMode = "numeric" | "board" | "voice";



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
    lastLegStats,
  } = useX01Store();
  const { addCompletedGame } = useHistoryStore();
  const [inputMode, setInputMode] = useState<InputMode>("numeric");
  const [showRoundAvg, setShowRoundAvg] = useState(false);

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
  // Add new state for leg won dialog
  const [legWonDialogOpen, setLegWonDialogOpen] = useState(false);
  // Countdown state for auto-submit
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number>(0);
  const pendingScoreRef = useRef<{
    score: number;
    darts: number;
    lastDartMultiplier?: number;
  } | null>(null);
  const [previewData, setPreviewData] = useState<{
    score: number;
    currentScore: number;
    remainingScore: number;
    isBust: boolean;
    isCheckout: boolean;
  } | null>(null);

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

  // Show leg stats dialog when a leg is completed
  useEffect(() => {
    if (lastLegStats && !currentGame?.isGameFinished) {
      setLegWonDialogOpen(true);
    }
  }, [lastLegStats, currentGame?.isGameFinished]);

  // Reset game start time and history flag when a new game starts
  useEffect(() => {
    if (currentGame && !currentGame.isGameFinished) {
      gameStartTimeRef.current = Date.now();
      gameSavedToHistoryRef.current = false;
    }
  }, [currentGame]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Reset countdown when player changes
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) return;
    
    // Clear countdown when player changes
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCountdown(null);
    setProgress(0);
    pendingScoreRef.current = null;
    setPreviewData(null);
  }, [currentGame?.currentPlayerIndex, currentGame?.isGameFinished]);

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
      useX01Store.getState().setInputMode(storeMode);
      console.log("X01Game: Updated store inputMode to", storeMode);
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

  const handleNewGame = () => {
    // Start a new game with the same players and settings
    const playerIds = currentGame.players.map((player) => player.id);
    startGame(currentGame.gameType, playerIds, currentGame.totalLegs);
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

  // Handle quick submit from favorite numbers (with countdown)
  const handleQuickSubmit = (
    score: number,
    darts: number = 3,
    lastDartMultiplier?: number
  ) => {
    if (!currentGame || currentGame.isGameFinished) return;
    
    // Cancel any existing countdown
    handleCancelCountdown();

    const player = currentGame.players[currentGame.currentPlayerIndex];
    const remainingAfterScore = player.score - score;

    // Check if this would be a bust
    const wouldBust = remainingAfterScore < 0;
    
    // Check if this is a checkout (reaching exactly 0)
    const isCheckout = remainingAfterScore === 0;

    // For checkouts with double out, we need to handle it differently
    // If it's a checkout, we'll use the regular handleScore flow after countdown
    // but for now, we'll proceed with the countdown
    let finalMultiplier = lastDartMultiplier;
    if (
      inputMode === "numeric" &&
      isCheckout &&
      currentGame.isDoubleOut
    ) {
      finalMultiplier = 2;
    }

    // Store pending score data
    pendingScoreRef.current = {
      score: wouldBust ? 0 : score,
      darts: wouldBust ? 3 : (isCheckout ? 3 : darts), // For checkout, default to 3 darts
      lastDartMultiplier: wouldBust ? 1 : finalMultiplier,
    };

    // Set preview data
    setPreviewData({
      score: wouldBust ? 0 : score,
      currentScore: player.score,
      remainingScore: wouldBust ? player.score : remainingAfterScore,
      isBust: wouldBust,
      isCheckout: isCheckout && !wouldBust,
    });

    // Start countdown (5 seconds)
    setCountdown(5);
    setProgress(0);
    progressStartTimeRef.current = Date.now();

    // Clear any existing timers
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;

    // Update progress bar every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const newProgress = Math.min((elapsed / 5000) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50) as unknown as number;

    // Record score after countdown completes (5 seconds)
    countdownTimerRef.current = setTimeout(() => {
      if (pendingScoreRef.current) {
        recordScore(
          pendingScoreRef.current.score,
          pendingScoreRef.current.darts,
          pendingScoreRef.current.lastDartMultiplier
        );
        pendingScoreRef.current = null;
      }
      setCountdown(null);
      setProgress(0);
      setPreviewData(null);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Check if game is finished after score is recorded
      const updatedGame = useX01Store.getState().currentGame;
      if (updatedGame && updatedGame.isGameFinished) {
        saveGameToHistory();
        setDialogOpen(true);
      }
    }, 5000) as unknown as number;
  };

  const handleCancelCountdown = () => {
    // Clear countdown and pending score
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCountdown(null);
    setProgress(0);
    pendingScoreRef.current = null;
    setPreviewData(null);
  };

  // Handle recording scores
  const handleScore = (
    score: number,
    darts: number,
    lastDartMultiplier?: number
  ) => {
    // Don't allow regular score submission during countdown
    if (countdown !== null && countdown > 0) {
      return;
    }
    
    if (currentGame && !currentGame.isGameFinished) {
      const player = currentGame.players[currentGame.currentPlayerIndex];
      const remainingAfterScore = player.score - score;

      // When using voice input, always ensure lastDartMultiplier is 2 if it's a potential winning score
      if (
        inputMode === "voice" &&
        remainingAfterScore === 0 &&
        (!lastDartMultiplier || lastDartMultiplier !== 2)
      ) {
        lastDartMultiplier = 2;
      }

      // For numeric input, always set lastDartMultiplier to 2 for checkouts to bypass double out check
      if (
        inputMode === "numeric" &&
        remainingAfterScore === 0 &&
        currentGame.isDoubleOut
      ) {
        lastDartMultiplier = 2;
      }

      // Record the score
      recordScore(score, darts, lastDartMultiplier);

      // We no longer need to check for leg win here as it's handled in the store
      // The store will call handleLegWin when a player reaches 0
      // We just need to check if the game is finished after the score is recorded
      const updatedGame = useX01Store.getState().currentGame;
      if (updatedGame && updatedGame.isGameFinished) {
        saveGameToHistory();
        setDialogOpen(true);
      }
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Bar - Game Info and Players */}
      <Paper
        sx={{
          p: 1,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
       

        {/* Players Section */}
        <Box
          sx={{
            p: 0.5,
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
            {currentGame.players
              .slice()
              .sort(
                (a, b) =>
                  (currentGame.playerPositions[a.id] || 0) -
                  (currentGame.playerPositions[b.id] || 0)
              )
              .map((player, index) => (
                <PlayerBox
                  key={player.id}
                  player={player}
                  isCurrentPlayer={currentGame.currentPlayerIndex === index}
                  showRoundAvg={showRoundAvg}
                  onToggleAvgView={() => setShowRoundAvg(!showRoundAvg)}
                  legsWon={currentGame.legsWon[player.id] || 0}
                />
              ))}
          </Box>
        </Box>
      </Paper>

      {/* Input Area - Takes remaining space */}
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
              onQuickSubmit={handleQuickSubmit}
              currentPlayerScore={
                currentGame?.players.find(
                  (p) =>
                    currentGame.playerPositions[p.id] - 1 ===
                    currentGame.currentPlayerIndex
                )?.score
              }
              previewData={previewData}
            />
          ) : inputMode === "board" ? (
            <DartInputErrorBoundary>
              <DartInput
                onScore={(score, dartsUsed, lastDartMultiplier) =>
                  handleScore(score, dartsUsed, lastDartMultiplier)
                }
              />
            </DartInputErrorBoundary>
          ) : (
            <VoiceInput
              handleScore={(score, darts, lastDartMultiplier) =>
                handleScore(score, darts, lastDartMultiplier)
              }
            />
          )}
        </Box>
      </Box>

      {/* Bottom Action Bar */}
      <Paper
        sx={{
          p: 1,
          borderRadius: 0,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Progress Bar */}
        {countdown !== null && countdown > 0 && (
          <Box sx={{ width: "100%" }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 6,
                borderRadius: 1,
              }} 
            />
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
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

          <VibrationButton
            variant="contained"
            color="error"
            onClick={handleCancelCountdown}
            disabled={countdown === null || countdown === 0}
            startIcon={<Cancel />}
            vibrationPattern={[50, 100, 50]}
            size="small"
            sx={{ display: countdown !== null && countdown > 0 ? "flex" : "none" }}
          >
            Cancel
          </VibrationButton>

          <IconButton 
            size="small" 
            onClick={handleUndo} 
            sx={{ ml: 0.5 }}
            disabled={countdown !== null && countdown > 0}
          >
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
          {winner && (
            <Typography variant="h5" color="primary" gutterBottom>
              {winner.name} won the match!
            </Typography>
          )}
          <Typography variant="body1" gutterBottom>
            Final Score:
          </Typography>
          {playerStats.map((player) => (
            <Typography key={player.id} variant="body2">
              {player.name}: {player.pointsScored} points (Avg:{" "}
              {player.avgPerDart})
              {currentGame.legsWon[player.id] > 0 &&
                ` - ${currentGame.legsWon[player.id]} legs won`}
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

      {/* Leg Won Dialog */}
      <Dialog
        open={legWonDialogOpen}
        onClose={() => setLegWonDialogOpen(false)}
        aria-labelledby="leg-won-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="leg-won-dialog-title">
          Leg {lastLegStats?.legNumber} Complete!
        </DialogTitle>
        <DialogContent>
          {lastLegStats && (
            <>
              <Typography variant="h6" color="primary" gutterBottom>
                {currentGame.players.find((p) => p.id === lastLegStats.winnerId)?.name} won the leg!
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Leg Statistics:
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell align="right">Darts</TableCell>
                      <TableCell align="right">Avg/Dart</TableCell>
                      <TableCell align="right">Avg/Round</TableCell>
                      <TableCell align="right">100+</TableCell>
                      <TableCell align="right">140+</TableCell>
                      <TableCell align="right">180</TableCell>
                      <TableCell align="right">Checkout</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lastLegStats.players.map((player: {
                      id: number;
                      name: string;
                      dartsThrown: number;
                      avgPerDart: number;
                      avgPerRound: number;
                      rounds100Plus: number;
                      rounds140Plus: number;
                      rounds180: number;
                      checkoutAttempts: number;
                      checkoutSuccess: number;
                      scores: Array<{ score: number; darts: number }>;
                    }) => {
                      const isWinner = player.id === lastLegStats.winnerId;
                      return (
                        <TableRow
                          key={player.id}
                          sx={{
                            backgroundColor: isWinner
                              ? (theme) => alpha(theme.palette.primary.main, 0.1)
                              : "transparent",
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{ fontWeight: isWinner ? "bold" : "normal" }}
                          >
                            {player.name}
                            {isWinner && " 🏆"}
                          </TableCell>
                          <TableCell align="right">{player.dartsThrown}</TableCell>
                          <TableCell align="right">
                            {player.avgPerDart.toFixed(1)}
                          </TableCell>
                          <TableCell align="right">
                            {player.avgPerRound.toFixed(1)}
                          </TableCell>
                          <TableCell align="right">{player.rounds100Plus}</TableCell>
                          <TableCell align="right">{player.rounds140Plus}</TableCell>
                          <TableCell align="right">{player.rounds180}</TableCell>
                          <TableCell align="right">
                            {player.checkoutAttempts > 0
                              ? `${player.checkoutSuccess}/${player.checkoutAttempts}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" gutterBottom>
                Current Legs Won:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {currentGame.players.map((player) => (
                  <Chip
                    key={player.id}
                    label={`${player.name}: ${currentGame.legsWon[player.id] || 0}`}
                    color={
                      currentGame.legsWon[player.id] >
                      Math.floor(currentGame.totalLegs / 2)
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />
                ))}
              </Stack>
              
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                First to {Math.ceil(currentGame.totalLegs / 2)} legs wins the
                match
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLegWonDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Continue
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
  showRoundAvg,
  onToggleAvgView,
  legsWon,
}: {
  player: any;
  isCurrentPlayer: boolean;
  showRoundAvg: boolean;
  onToggleAvgView: () => void;
  legsWon: number;
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                fontSize: { xs: "0.8rem", sm: "1rem" },
              }}
            >
              {legsWon}
            </Typography>
            <Typography
              variant="body1"
              noWrap
              sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}
            >
              {player.name}
            </Typography>
          </Box>
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
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
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
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              {player.lastRoundScore}
            </Typography>
          ) : null}
        </Box>

        {/* Player's current score */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              fontSize: { xs: "1.8rem", sm: "2.125rem" },
              lineHeight: 1.1,
            }}
          >
            {player.score}
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
              cursor: "pointer",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
            }}
            onClick={onToggleAvgView}
          >
            Avg: {showRoundAvg ? playerAvgPerRound : playerAvgPerDart}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          >
            Darts: {player.dartsThrown}
          </Typography>
        </Box>
        {showCheckoutGuide && checkoutPath && (
          <Box
            sx={{
              p: { xs: 0.5, sm: 0.75 },
              borderRadius: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.success.main, 0.2)
                  : alpha(theme.palette.success.main, 0.1),
              border: "1px solid",
              borderColor: "success.main",
              mt: { xs: 0.5, sm: 0.75 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                lineHeight: 1.2,
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
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
