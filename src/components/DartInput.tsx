// Add console logging at the top of the file
console.log("DartInput component file loaded");

import { Grid, Button, Box, Typography, Paper, Popper } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useX01Store } from "../store/useX01Store";
import { alpha } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";
import React from "react";

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

// Remove the checkout guide object from here as it's now imported from the utils file

const DartInput: React.FC<DartInputProps> = ({ onScore }) => {
  console.log("DartInput component rendering");

  const { currentGame, lastDartNotations } = useX01Store();

  console.log("Current game from store:", currentGame);

  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentDarts, setCurrentDarts] = useState<DartScore[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isSubmitting] = useState(false);

  useEffect(() => {
    console.log("DartInput mounted or updated");
    return () => {
      console.log("DartInput unmounting");
      if (pressTimer.current) {
        window.clearTimeout(pressTimer.current);
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
    console.log(`Recording dart: ${baseNumber} × ${multiplier}`);
    const dartValue = baseNumber * multiplier;
    setCurrentDarts((prevDarts) => [
      ...prevDarts,
      { baseNumber, multiplier, value: dartValue },
    ]);

    // Track dart notations for player stats
    const notation = formatDartNotation({
      baseNumber,
      multiplier,
      value: dartValue,
    });

    // Update from useStore to useX01Store
    useX01Store.setState({
      lastDartNotations: [...lastDartNotations, notation],
    });

    console.log(`Added notation: ${notation}`);
  };

  const handleSubmitDarts = async () => {
    try {
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

      // Call the onScore callback to update the game state
      onScore(totalScore, currentDarts.length);

      // Reset current darts after submission
      setCurrentDarts([]);
      console.log("Darts submitted and reset");
    } catch (err) {
      console.error("Error submitting darts:", err);
    }
  };

  const handleClearDarts = () => {
    setCurrentDarts([]);
    // Reset dart notations in store
    useX01Store.setState({
      lastDartNotations: [],
    });
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
    currentGame?.players[currentGame.currentPlayerIndex]?.score || 0;
  const remainingScore = currentPlayerScore - totalScore;

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
          p: 1,
          borderBottom: 1,
          borderColor: "divider",
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

      {/* Number Grid - Updated to fill remaining space */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 1,
          height: "100%",
          overflow: "hidden", // Add overflow hidden to prevent scrolling
        }}
      >
        <Grid
          container
          spacing={1}
          sx={{
            height: "100%", // Set full height
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Number buttons 1-20 */}
          <Grid
            item
            xs={12}
            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Grid container spacing={1} sx={{ flex: 1 }}>
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
                    onTouchStart={(e) => handleStart(num, e)}
                    onTouchEnd={() => handleEnd()}
                    onMouseLeave={() => isHolding && handleEnd()}
                    sx={{
                      height: "100%",
                      transition: "background-color 0.2s",
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                    }}
                  >
                    {num}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {/* Quick Action Buttons - Now positioned below the numbers */}
            <Box sx={{ display: "flex", width: "100%", mt: 1 }}>
              <Button
                variant="contained"
                color="error"
                disabled={currentDarts.length >= 3}
                onClick={() => {
                  if (currentDarts.length < 3) {
                    recordDart(0, 1);
                  }
                }}
                sx={{
                  flex: 1,
                  mr: 0.5,
                  py: 2,
                  fontWeight: "bold",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
                Miss
              </Button>
              <Button
                disabled={currentDarts.length >= 3}
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
                  py: 2,
                  fontWeight: "bold",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
                Bull (25)
              </Button>
              <Button
                variant="contained"
                disabled={currentDarts.length >= 3}
                color="primary"
                onClick={() => {
                  if (currentDarts.length < 3) {
                    recordDart(50, 1);
                  }
                }}
                sx={{
                  flex: 1,
                  ml: 0.5,
                  py: 2,
                  fontWeight: "bold",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
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
};

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
    // Process the notation to extract the base number and multiplier
    let multiplier: Multiplier = 1;
    let baseNumber = 0;

    if (notation.startsWith("T")) {
      multiplier = 3;
      baseNumber = Number(notation.substring(1));
    } else if (notation.startsWith("D")) {
      multiplier = 2;
      baseNumber = Number(notation.substring(1));
    } else {
      baseNumber = Number(notation);
    }

    if (!isNaN(baseNumber) && baseNumber > 0) {
      recordDart(baseNumber, multiplier);
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
        <Grid container spacing={1} columns={5}>
          {frequentDarts.slice(0, 5).map((notation, index) => {
            // Get the hit count for this notation
            const hitCount = dartCounts[notation] || 0;

            let baseNumber = parseInt(notation.replace(/[DT]/g, ""));
            if (isNaN(baseNumber)) baseNumber = 25;

            return (
              <Grid item xs={1} key={index}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  color="secondary"
                  sx={{
                    height: { xs: "46px", sm: "42px" },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    lineHeight: 1,
                    p: 0.5,
                  }}
                  disabled={currentDartsLength >= 3}
                  onClick={() => handleFavoriteDartClick(notation)}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {notation}
                  </Typography>
                  {hitCount > 0 && (
                    <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                      {hitCount}
                    </Typography>
                  )}
                </Button>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}

export default DartInput;
