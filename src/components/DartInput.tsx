import {
  Grid,
  Button,
  Box,
  Typography,
  Paper,
  Popper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useX01Store } from "../store/useX01Store";
import { alpha } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";
import React from "react";
import VibrationButton from "./VibrationButton";
import { Close, GpsFixed, DeleteOutline, Send, Cancel } from "@mui/icons-material";
import { isMobile } from "react-device-detect";

interface DartInputProps {
  onScore: (
    score: number,
    dartsUsed: number,
    lastDartMultiplier: Multiplier
  ) => void;
  gameContext?: {
    currentPlayerIndex: number;
    players: Array<{
      id: number;
      name: string;
      score: number;
      scores: Array<{ score: number; darts: number }>;
    }>;
    isDoubleIn: boolean;
    isDoubleOut: boolean;
  };
}

export type Multiplier = 1 | 2 | 3;

// Define a type to track both the score and how it was achieved
interface DartScore {
  baseNumber: number;
  multiplier: Multiplier;
  value: number; // The actual score value (baseNumber × multiplier)
}

// Remove the checkout guide object from here as it's now imported from the utils file

// Define a component to display dart indicators
const DartIndicators = ({
  currentDarts,
  currentGame,
  onClearDarts,
  onSubmitDarts,
  isSubmitting,
  autoSubmitCountdown,
}: {
  currentDarts: DartScore[];
  lastDartNotation: string | null;
  currentGame: {
    gameType?: "301" | "501" | "701";
    players: Array<{
      id: number;
      name: string;
      score: number;
      scores: Array<{ score: number; darts: number }>;
    }>;
    currentPlayerIndex: number;
    isDoubleIn?: boolean;
    isDoubleOut?: boolean;
  };
  onClearDarts: () => void;
  onSubmitDarts: () => void;
  isSubmitting: boolean;
  autoSubmitCountdown: number | null;
}) => {
  // Create an array of 3 items to represent the darts
  const dartSlots = [0, 1, 2];
  // Calculate the total score of all darts
  const totalScore = currentDarts.reduce((sum, dart) => sum + dart.value, 0);

  // Get the current player
  const currentPlayer = currentGame?.players[currentGame.currentPlayerIndex];

  // Calculate the remaining score after the current darts
  const currentPlayerScore = currentPlayer?.score || 0;
  const remainingScore = currentPlayerScore - totalScore;

  // Check if this is the first score for the player and if double-in is required
  const isFirstScore = currentPlayer?.scores.length === 0;
  const requiresDoubleIn = currentGame.isDoubleIn && isFirstScore;
  const lastDartIsDouble =
    currentDarts.length > 0 &&
    currentDarts[currentDarts.length - 1].multiplier === 2;
  const isValidDoubleIn = !requiresDoubleIn || lastDartIsDouble;

  // Check double-out requirement
  const requiresDoubleOut = currentGame.isDoubleOut && remainingScore <= 170;
  const isValidDoubleOut =
    !requiresDoubleOut ||
    (remainingScore === 0 && lastDartIsDouble) ||
    remainingScore > 0;

  // Determine if the score is valid
  const isValidScore =
    isValidDoubleIn &&
    isValidDoubleOut &&
    remainingScore >= 0 &&
    remainingScore !== 1;

  // Determine the error message
  const getErrorMessage = () => {
    if (requiresDoubleIn && !lastDartIsDouble && currentDarts.length > 0) {
      return "Must start with double";
    }
    if (remainingScore < 0) {
      return "Bust";
    }
    if (remainingScore === 1) {
      return "Bust";
    }
    if (currentGame.isDoubleOut && remainingScore === 0 && !lastDartIsDouble) {
      return "Must finish with double";
    }
    if (currentGame.isDoubleOut && remainingScore === 0) {
      return "Game Shot!";
    }
    return `To go: ${remainingScore}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 1,
        mt: 1,
        p: 1,
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
      }}
    >
      {/* Display remaining score */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          width: "100%",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          Scored: {totalScore}
        </Typography>
        <Typography
          variant="body2"
          color={!isValidScore ? "error.main" : "text.secondary"}
        >
          {getErrorMessage()}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* Dart chips on the left */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flex: 2,
          }}
        >
          {dartSlots.map((index) => {
            const dartScore = currentDarts[index];
            const hasScore = index < currentDarts.length;
            const isCurrentDart = index === currentDarts.length;

            return (
              <Chip
                key={index}
                icon={
                  <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                    <GpsFixed />
                  </Box>
                }
                label={
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Typography variant="caption">Dart {index + 1}</Typography>
                    {hasScore && (
                      <Typography variant="body2" fontWeight="bold">
                        {dartScore.value} pts
                      </Typography>
                    )}
                  </Box>
                }
                color={hasScore ? "info" : "default"}
                variant={isCurrentDart ? "outlined" : "filled"}
                sx={{
                  flex: 1,
                  height: "48px",
                  padding: "4px 0",
                  border: isCurrentDart ? "2px dashed" : "none",
                  borderColor: "info.main",
                  animation: isCurrentDart ? "pulse 1.5s infinite" : "none",
                  "@keyframes pulse": {
                    "0%": { opacity: 0.7 },
                    "50%": { opacity: 1 },
                    "100%": { opacity: 0.7 },
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Buttons on the right */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flex: 1,
          }}
        >
          <VibrationButton
            size="small"
            variant="outlined"
            onClick={onClearDarts}
            disabled={isSubmitting || currentDarts.length === 0 || autoSubmitCountdown !== null}
            sx={{
              height: "48px",
              minWidth: { xs: "48px", sm: "80px" },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            vibrationPattern={[200, 200]}
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>Clear</Box>
            <Box
              sx={{
                display: { xs: "flex", sm: "none" },
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <DeleteOutline />
            </Box>
          </VibrationButton>

          <VibrationButton
            size="small"
            variant="contained"
            onClick={onSubmitDarts}
            disabled={currentDarts.length === 0 || isSubmitting || autoSubmitCountdown !== null}
            sx={{
              height: "48px",
              minWidth: { xs: "48px", sm: "80px" },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            vibrationPattern={100}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>Submit</Box>
                <Box
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Send />
                </Box>
              </>
            )}
          </VibrationButton>
        </Box>
      </Box>

      {/* Add buttons for Reset and Submit */}
    </Box>
  );
};

const DartInput: React.FC<DartInputProps> = ({ onScore, gameContext }) => {
  console.log("DartInput component rendering");

  const { currentGame: x01Game, lastDartNotations } = useX01Store();

  // Use provided gameContext or fall back to X01 store
  const currentGame = gameContext || x01Game;

  console.log("Current game from store:", currentGame);
  console.log("Is mobile device:", isMobile);

  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentDarts, setCurrentDarts] = useState<DartScore[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isSubmitting] = useState(false);
  const autoSubmitTimer = useRef<number | null>(null);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(
    null
  );
  // Add state to track the last dart notation
  const [lastDartNotation, setLastDartNotation] = useState<string | null>(null);
  // Add state for multiplier toggle
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(1);

  // Add a ref for the countdown interval
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("DartInput mounted or updated");
    return () => {
      console.log("DartInput unmounting");
      if (pressTimer.current) {
        window.clearTimeout(pressTimer.current);
      }
      // Clear auto-submit timer on unmount
      if (autoSubmitTimer.current) {
        window.clearTimeout(autoSubmitTimer.current);
      }
      // Clear countdown interval on unmount
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Add a check to make sure currentGame exists
  useEffect(() => {
    if (!currentGame) {
      console.error("DartInput: currentGame is null or undefined");
    }
  }, [currentGame]);

  const handleStart = (
    number: number,
    event: React.MouseEvent | React.TouchEvent
  ) => {
    event.preventDefault();
    if (currentDarts.length >= 3) return;

    // Use the selected multiplier directly
    recordDart(number, selectedMultiplier, true);
  };


  const handleMultiplierSelect = (multiplier: Multiplier) => {
    if (selectedNumber !== null && currentDarts.length < 3) {
      recordDart(selectedNumber, multiplier, true);
    }
    setShowMultiplier(false);
    setAnchorEl(null);
    setSelectedNumber(null);
    setIsHolding(false);
  };

  const recordDart = (
    baseNumber: number,
    multiplier: Multiplier,
    fromMultiplierSelection = false
  ) => {
    console.log(
      `Recording dart: ${baseNumber} × ${multiplier} (fromMultiplierSelection: ${fromMultiplierSelection})`
    );
    const dartValue = baseNumber * multiplier;
    const updatedDarts = [
      ...currentDarts,
      { baseNumber, multiplier, value: dartValue },
    ];
    setCurrentDarts(updatedDarts);

    // Reset multiplier to single after recording dart
    setSelectedMultiplier(1);

    // Track dart notations for player stats
    const notation = formatDartNotation({
      baseNumber,
      multiplier,
      value: dartValue,
    });

    // Update last dart notation
    setLastDartNotation(notation);

    // Update from useStore to useX01Store
    useX01Store.setState({
      lastDartNotations: [...lastDartNotations, notation],
    });

    console.log(`Added notation: ${notation}`);

    // Modified auto-submit logic:
    // 1. When this is the third dart (always auto-submit with 3 darts)
    // 2. When a multiplier was explicitly selected BUT only if it's the third dart
    const shouldAutoSubmit = updatedDarts.length === 3;

    console.log(
      `Should auto-submit? ${shouldAutoSubmit} - Darts: ${updatedDarts.length}, Multiplier: ${multiplier}, Base: ${baseNumber}`
    );

    if (shouldAutoSubmit) {
      console.log(`Auto-submit triggered: Third dart entered`);

      // Clear any existing timer first
      if (autoSubmitTimer.current) {
        window.clearTimeout(autoSubmitTimer.current);
      }

      // Set initial countdown value
      setAutoSubmitCountdown(2);

      // Use an interval to update the countdown
      const countdownInterval = setInterval(() => {
        setAutoSubmitCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(countdownInterval);
            countdownIntervalRef.current = null;

            // Vibrate when countdown reaches 1 second to alert the user
            if (prev === 1 && typeof navigator.vibrate === "function") {
              navigator.vibrate(200); // 200ms vibration as final warning
            }

            return null;
          }

          // Add vibration feedback when countdown reaches 1
          if (prev === 2 && typeof navigator.vibrate === "function") {
            navigator.vibrate(100); // shorter vibration for initial countdown feedback
          }

          return prev - 1;
        });
      }, 1000);
      countdownIntervalRef.current = countdownInterval as unknown as number;

      // KEY FIX: Create a callback function that has access to the updated darts
      const autoSubmitCallback = () => {
        // This callback will have access to the most up-to-date currentDarts state
        console.log("Auto-submit callback running with darts:", updatedDarts);

        // Based on the updatedDarts array, calculate score and submit
        const totalScore = updatedDarts.reduce(
          (sum, dart) => sum + dart.value,
          0
        );
        const lastDartMultiplier =
          updatedDarts[updatedDarts.length - 1].multiplier;

        // Get current player's score
        if (!currentGame) {
          console.error("No active game found");
          return;
        }

        const currentPlayer =
          currentGame.players[currentGame.currentPlayerIndex];
        if (!currentPlayer) {
          console.error("Current player not found");
          return;
        }

        const remainingScore = currentPlayer.score - totalScore;

        // Check if this would be a winning throw and validate double-out
        if (remainingScore === 0 && currentGame.isDoubleOut) {
          if (lastDartMultiplier !== 2) {
            // If trying to finish without a double, record as bust
            console.log(
              "Attempted to finish without a double - recording as bust"
            );
            onScore(0, updatedDarts.length, lastDartMultiplier);
          } else {
            // Valid finish with a double
            onScore(totalScore, updatedDarts.length, lastDartMultiplier);
          }
        } else {
          // Not a finishing throw or double-out not required
          onScore(totalScore, updatedDarts.length, lastDartMultiplier);
        }

        // Reset UI state
        setCurrentDarts([]);
        autoSubmitTimer.current = null;
        setAutoSubmitCountdown(null);
        clearInterval(countdownInterval);
      };

      // Set the auto-submit timer
      setTimeout(() => {
        autoSubmitTimer.current = window.setTimeout(autoSubmitCallback, 2000);
      }, 50); // Small delay to ensure state is updated
    }
  };

  const handleSubmitDarts = async () => {
    try {
      // Clear any active auto-submit timer and interval
      if (autoSubmitTimer.current) {
        window.clearTimeout(autoSubmitTimer.current);
        autoSubmitTimer.current = null;
      }

      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      setAutoSubmitCountdown(null);

      // For debugging
      console.log("Submitting darts:", currentDarts);

      if (currentDarts.length === 0) {
        console.log("No darts to submit");
        return;
      }

      // Calculate total score
      const totalScore = currentDarts.reduce(
        (sum, dart) => sum + dart.value,
        0
      );
      console.log(
        `Total score: ${totalScore}, Darts thrown: ${currentDarts.length}`
      );

      // Get the current player
      if (!currentGame) {
        console.error("No active game found");
        return;
      }

      const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
      console.log(
        `Current player: ${currentPlayer.name}, Score before: ${currentPlayer.score}`
      );

      // Get the multiplier of the last dart for double-out/double-in validation
      const lastDartMultiplier =
        currentDarts.length > 0
          ? currentDarts[currentDarts.length - 1].multiplier
          : 1;

      // Check if this is the first score and double-in is required
      const isFirstScore = currentPlayer.scores.length === 0;
      const requiresDoubleIn = currentGame.isDoubleIn && isFirstScore;

      // Calculate remaining score
      const remainingScore = currentPlayer.score - totalScore;

      // Validate double-in requirement
      if (requiresDoubleIn && lastDartMultiplier !== 2) {
        console.log("Double-in required but last dart was not a double");
        onScore(0, currentDarts.length, lastDartMultiplier);
        setCurrentDarts([]);
        return;
      }

      // Validate the score is not a bust
      if (remainingScore < 0 || remainingScore === 1) {
        console.log("Score would result in bust");
        onScore(0, currentDarts.length, lastDartMultiplier);
        setCurrentDarts([]);
        return;
      }

      // Check double-out requirement
      if (remainingScore === 0 && currentGame.isDoubleOut) {
        if (lastDartMultiplier !== 2) {
          // If double-out is required and last dart isn't a double, record it as a bust
          console.log(
            "Double-out required but last dart was not a double - recording as bust"
          );
          onScore(0, currentDarts.length, lastDartMultiplier);
          setCurrentDarts([]);
          return;
        }
      }

      console.log(
        `Submitting score: ${totalScore}, Darts used: ${currentDarts.length}, Last multiplier: ${lastDartMultiplier}`
      );

      // Call the onScore callback to update the game state
      onScore(totalScore, currentDarts.length, lastDartMultiplier);

      // Reset current darts after submission
      setCurrentDarts([]);
      // Reset multiplier to Single for next turn
      setSelectedMultiplier(1);
      console.log("Darts submitted and reset");
    } catch (err) {
      console.error("Error submitting darts:", err);
    }
  };

  const handleCancelAutoSubmit = () => {
    // Clear any auto-submit timer
    if (autoSubmitTimer.current) {
      window.clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAutoSubmitCountdown(null);
  };

  const handleClearDarts = () => {
    setCurrentDarts([]);
    // Clear the last dart notation when resetting
    setLastDartNotation(null);
    // Reset multiplier to Single
    setSelectedMultiplier(1);

    // Clear any auto-submit timer
    if (autoSubmitTimer.current) {
      window.clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
      setAutoSubmitCountdown(null);
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Format a dart score to display notation like "15", "D15", "T15"
  const formatDartNotation = (dart: DartScore): string => {
    switch (dart.multiplier) {
      case 1:
        return `${dart.baseNumber}`;
      case 2:
        return `D${dart.baseNumber}`;
      case 3:
        return `T${dart.baseNumber}`;
      default:
        return `${dart.value}`;
    }
  };

  // Check if we have essential data
  if (!currentGame) {
    console.error("DartInput: currentGame not available");
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          Game data not available. Please start a new game.
        </Typography>
      </Box>
    );
  }

  console.log("DartInput rendering complete UI");

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      data-testid="dart-input"
    >
      {/* Most frequently hit numbers at the top - always visible */}
      <Box
        sx={{
          p: { xs: 0.25, sm: 0.5 },
          borderBottom: 1,
          borderColor: "divider",
          minHeight: "50px", // Ensure area is always visible even when empty
          height: { xs: "50px", sm: "60px" }, // Set a fixed height
          display: "flex",
          alignItems: "center",
          backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.05),
        }}
      >
        {currentGame && (
          <>
            {/* Extract frequent dart buttons into a dedicated component to ensure it updates properly */}
            <FrequentDartButtons
              currentPlayerIndex={currentGame.currentPlayerIndex}
              currentDartsLength={currentDarts.length}
              recordDart={recordDart}
              selectedMultiplier={selectedMultiplier}
            />
          </>
        )}
      </Box>

      {/* Add the dart indicators component */}
      {currentGame && (
        <DartIndicators
          currentDarts={currentDarts}
          lastDartNotation={lastDartNotation}
          currentGame={currentGame}
          onClearDarts={handleClearDarts}
          onSubmitDarts={handleSubmitDarts}
          isSubmitting={isSubmitting}
          autoSubmitCountdown={autoSubmitCountdown}
        />
      )}

      {/* Main content area - fills all remaining space */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: { xs: 0.25, sm: 0.5 },
          overflow: "hidden", // Add overflow hidden to prevent scrolling
        }}
      >
        {/* Auto-submit countdown indicator */}
        <Box
          sx={{
            width: "100%",
            textAlign: "center",
            mb: 0.5,
            position: "relative",
            zIndex: 5,
          }}
        >
          <Paper
            elevation={autoSubmitCountdown !== null ? 3 : 1}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 2,
              display: "inline-flex",
              alignItems: "center",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {autoSubmitCountdown !== null && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                    zIndex: 2,
                  }}
                >
                  Auto-submitting in {autoSubmitCountdown}s
                </Typography>
              )}
              <VibrationButton
                size="small"
                variant="contained"
                color="error"
                onClick={handleCancelAutoSubmit}
                disabled={autoSubmitCountdown === null}
                startIcon={<Cancel />}
                vibrationPattern={[50, 100, 50]}
                sx={{ minWidth: "auto", px: 1 }}
              >
                Cancel
              </VibrationButton>
            </Box>

            {/* Progress bar that animates as countdown decreases */}
            {autoSubmitCountdown !== null && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: "4px",
                  backgroundColor: "primary.main",
                  width: autoSubmitCountdown === 2 ? "100%" : "50%",
                  transition: "width 1s linear",
                }}
              />
            )}
          </Paper>
        </Box>

        {/* Number Grid - Takes all available space */}
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(4, 1fr)",
            gap: 1,
            marginBottom: 0.5,
          }}
        >
          {/* Number buttons 1-20 */}
          {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
            <VibrationButton
              key={num}
              size="small"
              color="info"
              variant={
                selectedNumber === num && (isHolding || showMultiplier)
                  ? "outlined"
                  : "contained"
              }
              disabled={currentDarts.length >= 3 || autoSubmitCountdown !== null}
              onClick={(e) => handleStart(num, e)}
              sx={{
                height: "100%",
                width: "100%",
                transition: "background-color 0.2s",
                fontSize: { xs: "0.8rem", sm: "1rem" },
                padding: 0,
                minWidth: 0, // Allow button to shrink below default min-width
                borderRadius: 1,
              }}
            >
              {num}
            </VibrationButton>
          ))}
        </Box>

        {/* Bottom buttons (Miss, S-Bull, D-Bull) */}
        <Box
          sx={{
            display: "flex",
            width: "100%",
            mt: 0.25,
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="error"
              onClick={() => {
                if (currentDarts.length < 3) {
                  recordDart(0, selectedMultiplier, true);
                }
              }}
              disabled={isSubmitting || currentDarts.length >= 3 || autoSubmitCountdown !== null}
              startIcon={
                <Close sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
              }
              sx={{
                height: { xs: "36px", sm: "42px" },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: 0, // Allow button to shrink below default min-width
              }}
              vibrationPattern={[20, 50, 20]}
              // Only use mouse events on non-mobile devices
              onMouseDown={!isMobile ? undefined : undefined}
              onMouseUp={!isMobile ? undefined : undefined}
              onMouseLeave={!isMobile ? undefined : undefined}
            >
              Miss
            </VibrationButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="info"
              onClick={() => {
                if (currentDarts.length < 3) {
                  recordDart(25, selectedMultiplier, true);
                }
              }}
              disabled={isSubmitting || currentDarts.length >= 3 || autoSubmitCountdown !== null}
              sx={{
                height: { xs: "36px", sm: "42px" },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: 0, // Allow button to shrink below default min-width
              }}
              vibrationPattern={80}
              // Only use mouse events on non-mobile devices
              onMouseDown={!isMobile ? undefined : undefined}
              onMouseUp={!isMobile ? undefined : undefined}
              onMouseLeave={!isMobile ? undefined : undefined}
            >
              S-Bull
            </VibrationButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="info"
              onClick={() => {
                if (currentDarts.length < 3) {
                  recordDart(25, selectedMultiplier, true);
                }
              }}
              disabled={isSubmitting || currentDarts.length >= 3 || autoSubmitCountdown !== null}
              sx={{
                height: { xs: "36px", sm: "42px" },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: 0, // Allow button to shrink below default min-width
              }}
              vibrationPattern={120}
              // Only use mouse events on non-mobile devices
              onMouseDown={!isMobile ? undefined : undefined}
              onMouseUp={!isMobile ? undefined : undefined}
              onMouseLeave={!isMobile ? undefined : undefined}
            >
              D-Bull
            </VibrationButton>
          </Box>
        </Box>
      </Box>

      {/* Multiplier Toggle */}
      <Box
        sx={{
          p: 1,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ToggleButtonGroup
          value={selectedMultiplier}
          exclusive
          onChange={(_, newMultiplier) => {
            if (newMultiplier !== null) {
              setSelectedMultiplier(newMultiplier);
            }
          }}
          size="small"
        >
          <ToggleButton value={1} sx={{ px: 2 }}>
            Single
          </ToggleButton>
          <ToggleButton value={2} sx={{ px: 2 }}>
            Double
          </ToggleButton>
          <ToggleButton value={3} sx={{ px: 2 }}>
            Triple
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Multiplier Popper */}
      <Popper
        open={showMultiplier}
        anchorEl={anchorEl}
        placement="top"
        sx={{ zIndex: 1300 }}
      >
        <Paper
          sx={{
            display: "flex",
            gap: 1,
            p: 1,
            bgcolor: "background.paper",
            boxShadow: 3,
          }}
        >
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => handleMultiplierSelect(2)}
            sx={{ minWidth: "80px" }}
            // Only use mouse events on non-mobile devices
            onMouseDown={!isMobile ? undefined : undefined}
            onMouseUp={!isMobile ? undefined : undefined}
            onMouseLeave={!isMobile ? undefined : undefined}
          >
            Double
          </Button>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => handleMultiplierSelect(3)}
            sx={{ minWidth: "80px" }}
            // Only use mouse events on non-mobile devices
            onMouseDown={!isMobile ? undefined : undefined}
            onMouseUp={!isMobile ? undefined : undefined}
            onMouseLeave={!isMobile ? undefined : undefined}
          >
            Triple
          </Button>
        </Paper>
      </Popper>
    </Box>
  );
};

// Create a separate component to ensure it re-renders properly
function FrequentDartButtons({
  currentPlayerIndex,
  currentDartsLength,
  recordDart,
  selectedMultiplier,
}: {
  currentPlayerIndex: number;
  currentDartsLength: number;
  recordDart: (
    baseNumber: number,
    multiplier: Multiplier,
    fromMultiplierSelection?: boolean
  ) => void;
  selectedMultiplier: Multiplier;
}) {
  const { currentGame, getPlayerMostFrequentDarts } = useX01Store();

  // Re-compute frequent darts when currentPlayerIndex changes or darts are recorded
  const [frequentDarts, setFrequentDarts] = useState<string[]>([]);

  useEffect(() => {
    // Get the current player's ID from the game
    if (currentGame && currentGame.players[currentPlayerIndex]) {
      const playerId = currentGame.players[currentPlayerIndex].id;
      // Limit to 5 favorite darts
      const frequent = getPlayerMostFrequentDarts(playerId, 5);
      console.log(`Player ${playerId}'s frequent darts:`, frequent);
      setFrequentDarts(frequent);
    }
  }, [currentPlayerIndex, currentGame, getPlayerMostFrequentDarts]);

  // Create dartCounts for tracking frequency
  const dartCounts: Record<string, number> = {};

  // Calculate dartCounts if the current player exists
  if (currentGame && currentGame.players[currentPlayerIndex]) {
    const currentPlayer = currentGame.players[currentPlayerIndex];
    // Track counts for each frequent dart
    frequentDarts.forEach((notation) => {
      dartCounts[notation] = currentPlayer.dartHits[notation] || 0;
    });
  }

  const handleFavoriteDartClick = (notation: string) => {
    console.log(`Favorite dart clicked: ${notation}`);
    // Process the notation to extract the base number
    let baseNumber = 0;

    if (notation.startsWith("T")) {
      baseNumber = Number(notation.substring(1));
    } else if (notation.startsWith("D")) {
      baseNumber = Number(notation.substring(1));
    } else {
      baseNumber = Number(notation);
    }

    if (!isNaN(baseNumber) && baseNumber > 0) {
      // Use the selected multiplier instead of the notation's multiplier
      recordDart(baseNumber, selectedMultiplier, true);
    } else {
      console.error(`Invalid dart notation: ${notation}`);
    }
  };

  // Always show buttons - even common defaults for new players
  return (
    <>
      {frequentDarts.length === 0 ? (
        <Typography variant="caption" sx={{ color: "text.secondary", p: 1 }}>
          Your favorite darts will appear here
        </Typography>
      ) : (
        <Box sx={{ width: "100%", height: "100%" }}>
          <Grid container spacing={0.5} columns={5} sx={{ height: "100%" }}>
            {frequentDarts.slice(0, 5).map((notation, index) => {
              // Get the hit count for this notation
              const hitCount = dartCounts[notation] || 0;

              let baseNumber = parseInt(notation.replace(/[DT]/g, ""));
              if (isNaN(baseNumber)) baseNumber = 25;

              return (
                <Grid item xs={1} key={index} sx={{ flex: 1, height: "100%" }}>
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="secondary"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      lineHeight: 1,
                      p: 0.5,
                      minWidth: 0, // Allow button to shrink below default min-width
                    }}
                    disabled={currentDartsLength >= 3}
                    onClick={() => {
                      if (currentDartsLength < 3) {
                        handleFavoriteDartClick(notation);
                      }
                    }}
                    // Only use mouse events on non-mobile devices
                    onMouseDown={!isMobile ? undefined : undefined}
                    onMouseUp={!isMobile ? undefined : undefined}
                    onMouseLeave={!isMobile ? undefined : undefined}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
                      {notation}
                    </Typography>
                    {hitCount > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ fontSize: { xs: "0.55rem", sm: "0.6rem" } }}
                      >
                        {hitCount}
                      </Typography>
                    )}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </>
  );
}

export default DartInput;
