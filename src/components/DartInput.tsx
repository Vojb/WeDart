import { Grid, Button, Box, Typography, Paper, Popper } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { alpha } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";

interface DartInputProps {
  onScore: (score: number, dartsUsed: number) => void;
}

export type Multiplier = 1 | 2 | 3;

// Define a type to track both the score and how it was achieved
interface DartScore {
  baseNumber: number;
  multiplier: Multiplier;
  value: number; // The actual score value (baseNumber × multiplier)
}

export default function DartInput({ onScore }: DartInputProps) {
  const { currentGame } = useStore();
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentDarts, setCurrentDarts] = useState<DartScore[]>([]);
  const [dartNotations, setDartNotations] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        window.clearTimeout(pressTimer.current);
      }
    };
  }, []);

  const handleStart = (
    number: number,
    event: React.MouseEvent | React.TouchEvent
  ) => {
    event.preventDefault();
    if (currentDarts.length >= 3) return;

    // If clicking a new number while multiplier is shown, clear the previous state
    if (showMultiplier && selectedNumber !== number) {
      setShowMultiplier(false);
      setAnchorEl(null);
      setSelectedNumber(null);
    }

    const element = event.currentTarget as HTMLElement;
    setSelectedNumber(number);
    setAnchorEl(element);
    setIsHolding(true);

    pressTimer.current = window.setTimeout(() => {
      setShowMultiplier(true);
    }, 500);
  };

  const handleEnd = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Only register single score if not showing multiplier
    if (selectedNumber !== null && currentDarts.length < 3 && !showMultiplier) {
      recordDart(selectedNumber, 1);
      setSelectedNumber(null);
    }

    setIsHolding(false);
  };

  const handleMultiplierSelect = (multiplier: Multiplier) => {
    if (selectedNumber !== null && currentDarts.length < 3) {
      recordDart(selectedNumber, multiplier);
    }
    setShowMultiplier(false);
    setAnchorEl(null);
    setSelectedNumber(null);
    setIsHolding(false);
  };

  const recordDart = (baseNumber: number, multiplier: Multiplier) => {
    const value = baseNumber * multiplier;

    // Create the dart notation (e.g., "T20", "D16", "25")
    const notation = formatDartNotation({ baseNumber, multiplier, value });

    setCurrentDarts((prev) => [...prev, { baseNumber, multiplier, value }]);

    setDartNotations((prev) => [...prev, notation]);

    // Close the multiplier selector if it's open
    if (showMultiplier) {
      setShowMultiplier(false);
      setSelectedNumber(null);
    }
  };

  const handleSubmitDarts = async () => {
    if (currentDarts.length === 0) return;

    try {
      setIsSubmitting(true);
      console.log("Submitting darts:", dartNotations);

      // Calculate total score
      const totalScore = currentDarts.reduce(
        (sum, dart) => sum + dart.value,
        0
      );

      // Log for debugging
      console.log("Submitting dart notations:", dartNotations);

      // IMPORTANT: Always record dart notations, even outside of dart input mode
      // This ensures player stats are tracked across all games
      useStore.setState({ lastDartNotations: [...dartNotations] });

      // DEBUG: Log the current player's dartHits before recording
      if (currentGame) {
        const currentPlayer =
          currentGame.players[currentGame.currentPlayerIndex];
        console.log("BEFORE - Player dartHits:", { ...currentPlayer.dartHits });
        console.log(
          "Submitting darts:",
          dartNotations,
          "for total score:",
          totalScore
        );
      }

      // Add a small delay to ensure the state is updated before recordScore processes it
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Then record the score which will use these notations
      onScore(totalScore, currentDarts.length);

      // DEBUG: Log the current player's dartHits after recording
      setTimeout(() => {
        if (currentGame) {
          const currentPlayer =
            useStore.getState().currentGame?.players[
              currentGame.currentPlayerIndex
            ] || null;
          const prevPlayer =
            useStore.getState().currentGame?.players[
              (currentGame.currentPlayerIndex +
                useStore.getState().currentGame!.players.length -
                1) %
                useStore.getState().currentGame!.players.length
            ] || null;

          console.log(
            "AFTER - Previous Player dartHits:",
            prevPlayer ? { ...prevPlayer.dartHits } : "No previous player"
          );
          console.log(
            "AFTER - Current Player dartHits:",
            currentPlayer ? { ...currentPlayer.dartHits } : "No current player"
          );
          console.log("Darts that should have been recorded:", dartNotations);
        }
      }, 100);

      // Reset the local state
      setCurrentDarts([]);
      setDartNotations([]);
      setShowMultiplier(false);
      setSelectedNumber(null);
      setAnchorEl(null);

      // Force an immediate update of the favorite darts
      // This ensures the UI updates right after throwing
      setTimeout(() => {
        // This will trigger a re-render of the FrequentDartButtons component
        useStore.setState({ lastDartNotations: [] });
      }, 100);
    } catch (error) {
      console.error("Error submitting darts:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDarts = () => {
    setCurrentDarts([]);
    setDartNotations([]);
    setShowMultiplier(false);
    setSelectedNumber(null);
    setAnchorEl(null);
    setIsHolding(false);
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

  // Calculate the total score of all darts
  const totalScore = currentDarts.reduce((sum, dart) => sum + dart.value, 0);

  // Calculate the remaining score after the current darts
  const currentPlayerScore =
    currentGame?.players[currentGame.currentPlayerIndex].score || 0;
  const remainingScore = currentPlayerScore - totalScore;

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
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
          overflow: "auto",
          minHeight: "56px", // Ensure area is always visible even when empty
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
            />
          </>
        )}
      </Box>

      {/* Score Display */}
      <Box
        sx={{
          p: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {currentDarts.map((dart) => formatDartNotation(dart)).join(" + ") ||
              "None"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Scored: {totalScore}
            </Typography>
            <Typography
              variant="body1"
              color={
                remainingScore < 0 || remainingScore === 1
                  ? "error.main"
                  : "text.secondary"
              }
            >
              To go:{" "}
              {remainingScore > 0
                ? remainingScore
                : remainingScore < 0
                ? "Bust"
                : "Zero!"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleClearDarts}
            disabled={currentDarts.length === 0 || isSubmitting}
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmitDarts}
            disabled={currentDarts.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </Box>
      </Box>

      {/* Number Grid */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 1,
        }}
      >
        <Grid container spacing={1}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
            <Grid item xs={3} key={num}>
              <Button
                fullWidth
                size="small"
                variant={
                  selectedNumber === num && (isHolding || showMultiplier)
                    ? "contained"
                    : "outlined"
                }
                disabled={currentDarts.length >= 3}
                onMouseDown={(e) => handleStart(num, e)}
                onMouseUp={() => handleEnd()}
                onTouchStart={(e) => handleStart(num, e)}
                onTouchEnd={() => handleEnd()}
                sx={{
                  minHeight: { xs: "36px", sm: "38px" },
                  transition: "background-color 0.2s",
                }}
              >
                {num}
              </Button>
            </Grid>
          ))}

          <Grid item xs={12}>
            {/* Quick Action Buttons - Only shown in dart input mode */}
            <Box sx={{ display: "flex", mb: 2, width: "100%" }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  if (currentDarts.length < 3) {
                    recordDart(0, 1);
                  }
                }}
                sx={{
                  flex: 1,
                  mr: 0.5,
                  py: 1.5,
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
              >
                Miss
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  if (currentDarts.length < 3) {
                    recordDart(25, 1);
                  }
                }}
                sx={{
                  flex: 1,
                  mx: 0.5,
                  py: 1.5,
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
              >
                Bull (25)
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (currentDarts.length < 3) {
                    recordDart(50, 1);
                  }
                }}
                sx={{
                  flex: 1,
                  ml: 0.5,
                  py: 1.5,
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
              >
                D-Bull (50)
              </Button>
            </Box>
          </Grid>
        </Grid>
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
          >
            Double
          </Button>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => handleMultiplierSelect(3)}
            sx={{ minWidth: "80px" }}
          >
            Triple
          </Button>
        </Paper>
      </Popper>
    </Box>
  );
}

// Create a separate component to ensure it re-renders properly
function FrequentDartButtons({
  currentPlayerIndex,
  currentDartsLength,
  recordDart,
}: {
  currentPlayerIndex: number;
  currentDartsLength: number;
  recordDart: (baseNumber: number, multiplier: Multiplier) => void;
}) {
  const { currentGame, getPlayerMostFrequentDarts, lastDartNotations } =
    useStore();
  // Force re-render when lastDartNotations changes
  const [, forceUpdate] = useState<any>();
  const prevPlayerIndexRef = useRef(currentPlayerIndex);

  // Re-render when it's a different player's turn or when dart notations change
  useEffect(() => {
    // Force a re-render to update the buttons
    forceUpdate({});

    // Check if player has changed
    if (prevPlayerIndexRef.current !== currentPlayerIndex) {
      console.log("Player changed, updating favorite darts");
      prevPlayerIndexRef.current = currentPlayerIndex;
    }

    // No need for frequent polling - we'll update when it matters:
    // 1. When player changes (currentPlayerIndex)
    // 2. When darts are thrown (lastDartNotations)
  }, [lastDartNotations, currentPlayerIndex]);

  // Force a refresh when the component mounts
  useEffect(() => {
    forceUpdate({});

    // Also add a one-time refresh after a short delay
    // This helps ensure the component updates after any state changes
    const timeoutId = setTimeout(() => {
      forceUpdate({});
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!currentGame) return null;

  // Get the current player
  const currentPlayer = currentGame.players[currentPlayerIndex];

  // Log the current player's dartHits for debugging
  console.log(`Rendering favorite darts for player ${currentPlayer.name}:`, {
    ...currentPlayer.dartHits,
  });

  // Get frequent darts
  const frequentDarts = getPlayerMostFrequentDarts(currentPlayer.id);
  // Get hit counts for each dart
  const dartCounts: Record<string, number> = {};
  for (const notation of frequentDarts) {
    dartCounts[notation] = currentPlayer.dartHits[notation] || 0;
  }

  console.log(
    "FrequentDartButtons rendering with:",
    frequentDarts,
    "counts:",
    dartCounts
  );

  // Helper to handle favorite dart clicks
  const handleFavoriteDartClick = (notation: string) => {
    // Extract the base number and multiplier from the notation
    let multiplier: Multiplier = 1;
    if (notation.startsWith("T")) multiplier = 3;
    else if (notation.startsWith("D")) multiplier = 2;

    // Extract the base number
    let baseNumber = parseInt(notation.replace(/[DT]/g, ""));
    if (isNaN(baseNumber)) baseNumber = 25; // Default to bullseye if parsing fails

    console.log(
      `Clicked favorite dart: ${notation}, baseNumber: ${baseNumber}, multiplier: ${multiplier}`
    );

    // Directly record the dart with the correct multiplier
    recordDart(baseNumber, multiplier);
  };

  // Always show buttons - even common defaults for new players
  return (
    <>
      {frequentDarts.length === 0 ? (
        <Typography variant="caption" sx={{ color: "text.secondary", p: 1 }}>
          Your favorite darts will appear here
        </Typography>
      ) : (
        frequentDarts.map((notation, index) => {
          // Get the hit count for this notation

          let baseNumber = parseInt(notation.replace(/[DT]/g, ""));
          if (isNaN(baseNumber)) baseNumber = 25;

          return (
            <Button
              key={index}
              size="small"
              variant="contained"
              color="secondary"
              sx={{
                minWidth: "48px",
                minHeight: { xs: "40px", sm: "36px" },
                px: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                lineHeight: 1,
              }}
              disabled={currentDartsLength >= 3}
              onClick={() => handleFavoriteDartClick(notation)}
            >
              <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                {notation}
              </Typography>
            </Button>
          );
        })
      )}
    </>
  );
}
