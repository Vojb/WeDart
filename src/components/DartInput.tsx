import { Grid, Button, Box, Typography, Paper, Popper } from "@mui/material";
import { useState, useRef, useEffect } from "react";

interface DartInputProps {
  onScore: (score: number, darts: number) => void;
}

type Multiplier = 1 | 2 | 3;

export default function DartInput({ onScore }: DartInputProps) {
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
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
    event.preventDefault(); // Prevent default to avoid text selection
    if (currentDarts.length >= 3) return;

    const element = event.currentTarget as HTMLElement;
    setSelectedNumber(number);
    setAnchorEl(element);
    setIsHolding(true);

    pressTimer.current = window.setTimeout(() => {
      setShowMultiplier(true);
    }, 500); // Reduced to 500ms for better UX
  };

  const handleEnd = (clearMultiplier: boolean = true) => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (selectedNumber !== null && currentDarts.length < 3 && !showMultiplier) {
      // Single score
      setCurrentDarts([...currentDarts, selectedNumber]);
    }

    if (clearMultiplier) {
      setShowMultiplier(false);
      setAnchorEl(null);
    }

    setIsHolding(false);
    if (!showMultiplier) {
      setSelectedNumber(null);
    }
  };

  const handleMultiplierSelect = (multiplier: Multiplier) => {
    if (selectedNumber !== null && currentDarts.length < 3) {
      setCurrentDarts([...currentDarts, selectedNumber * multiplier]);
    }
    setShowMultiplier(false);
    setAnchorEl(null);
    setSelectedNumber(null);
    setIsHolding(false);
  };

  const handleSubmitDarts = () => {
    if (currentDarts.length > 0) {
      const totalScore = currentDarts.reduce((sum, score) => sum + score, 0);
      onScore(totalScore, currentDarts.length);
      setCurrentDarts([]);
    }
  };

  const handleClearDarts = () => {
    setCurrentDarts([]);
    setShowMultiplier(false);
    setSelectedNumber(null);
    setAnchorEl(null);
    setIsHolding(false);
  };

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
        <Typography variant="body2">
          Darts: {currentDarts.map((d) => d.toString()).join(" + ") || "0"}
        </Typography>
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
                  selectedNumber === num && isHolding ? "contained" : "outlined"
                }
                disabled={currentDarts.length >= 3}
                onMouseDown={(e) => handleStart(num, e)}
                onMouseUp={() => handleEnd()}
                onMouseLeave={() => handleEnd()}
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
                selectedNumber === 25 && isHolding ? "contained" : "outlined"
              }
              disabled={currentDarts.length >= 3}
              onMouseDown={(e) => handleStart(25, e)}
              onMouseUp={() => handleEnd()}
              onMouseLeave={() => handleEnd()}
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
