import { Grid, Button, Box, Typography, Paper, Popper } from "@mui/material";
import { useState, useRef, useEffect } from "react";

interface DartInputProps {
  onScore: (score: number, darts: number) => void;
}

type Multiplier = 1 | 2 | 3;

// Define a type to track both the score and how it was achieved
interface DartScore {
  baseNumber: number;
  multiplier: Multiplier;
  value: number; // The actual score value (baseNumber × multiplier)
}

export default function DartInput({ onScore }: DartInputProps) {
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentDarts, setCurrentDarts] = useState<DartScore[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pressTimer = useRef<number | null>(null);
  const [isHolding, setIsHolding] = useState(false);

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
      setCurrentDarts([
        ...currentDarts,
        {
          baseNumber: selectedNumber,
          multiplier: 1,
          value: selectedNumber,
        },
      ]);
      setSelectedNumber(null);
    }

    setIsHolding(false);
  };

  const handleMultiplierSelect = (multiplier: Multiplier) => {
    if (selectedNumber !== null && currentDarts.length < 3) {
      setCurrentDarts([
        ...currentDarts,
        {
          baseNumber: selectedNumber,
          multiplier: multiplier,
          value: selectedNumber * multiplier,
        },
      ]);
    }
    setShowMultiplier(false);
    setAnchorEl(null);
    setSelectedNumber(null);
    setIsHolding(false);
  };

  const handleSubmitDarts = () => {
    if (currentDarts.length > 0) {
      const totalScore = currentDarts.reduce(
        (sum, dart) => sum + dart.value,
        0
      );
      onScore(totalScore, currentDarts.length);
      setCurrentDarts([]);
      setShowMultiplier(false);
      setSelectedNumber(null);
      setAnchorEl(null);
    }
  };

  const handleClearDarts = () => {
    setCurrentDarts([]);
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

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
          <Typography variant="body1" fontWeight="bold">
            Total: {totalScore}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleClearDarts}
            disabled={currentDarts.length === 0}
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmitDarts}
            disabled={currentDarts.length === 0}
          >
            Enter ({currentDarts.length})
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
                  minHeight: { xs: "48px", sm: "40px" },
                  transition: "background-color 0.2s",
                }}
              >
                {num}
              </Button>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              fullWidth
              size="small"
              variant={
                selectedNumber === 25 && (isHolding || showMultiplier)
                  ? "contained"
                  : "outlined"
              }
              disabled={currentDarts.length >= 3}
              onMouseDown={(e) => handleStart(25, e)}
              onMouseUp={() => handleEnd()}
              onTouchStart={(e) => handleStart(25, e)}
              onTouchEnd={() => handleEnd()}
              sx={{
                minHeight: { xs: "48px", sm: "40px" },
                transition: "background-color 0.2s",
              }}
            >
              Bull (25)
            </Button>
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
