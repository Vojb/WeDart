import {
  Grid,
  Button,
  Dialog,
  DialogContent,
  Box,
  Typography,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";

interface DartInputProps {
  onScore: (score: number, darts: number) => void;
}

type Multiplier = 1 | 2 | 3;

export default function DartInput({ onScore }: DartInputProps) {
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(1);
  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
  const pressTimer = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        window.clearTimeout(pressTimer.current);
      }
    };
  }, []);

  const handleTouchStart = (number: number, event: React.TouchEvent) => {
    event.preventDefault();
    if (currentDarts.length >= 3) return;
    setSelectedNumber(number);
    pressTimer.current = window.setTimeout(() => {
      setShowMultiplier(true);
      isDragging.current = true;
    }, 2000); // Changed to 2 seconds
  };

  const handleMouseDown = (number: number) => {
    if (currentDarts.length >= 3) return;
    setSelectedNumber(number);
    pressTimer.current = window.setTimeout(() => {
      setShowMultiplier(true);
      isDragging.current = true;
    }, 2000); // Changed to 2 seconds
  };

  const handleRelease = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (selectedNumber !== null && currentDarts.length < 3) {
      if (!isDragging.current) {
        // Quick press - single
        setCurrentDarts([...currentDarts, selectedNumber]);
      } else {
        // Long press - with multiplier
        setCurrentDarts([...currentDarts, selectedNumber * selectedMultiplier]);
      }
    }

    isDragging.current = false;
    setShowMultiplier(false);
    setSelectedNumber(null);
    setSelectedMultiplier(1);
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
  };

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography>
          Darts: {currentDarts.map((d) => d.toString()).join(" + ") || "0"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearDarts}
            disabled={currentDarts.length === 0}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitDarts}
            disabled={currentDarts.length === 0}
          >
            Enter
          </Button>
        </Box>
      </Box>

      <Grid
        container
        spacing={1}
        sx={{
          flex: 1,
          alignContent: "flex-start",
        }}
      >
        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
          <Grid item xs={3} key={num}>
            <Button
              fullWidth
              variant="outlined"
              disabled={currentDarts.length >= 3}
              onMouseDown={() => handleMouseDown(num)}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={(e) => handleTouchStart(num, e)}
              onTouchEnd={handleRelease}
            >
              {num}
            </Button>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="outlined"
            disabled={currentDarts.length >= 3}
            onMouseDown={() => handleMouseDown(25)}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
            onTouchStart={(e) => handleTouchStart(25, e)}
            onTouchEnd={handleRelease}
          >
            Bull (25)
          </Button>
        </Grid>
      </Grid>

      <Dialog
        open={showMultiplier}
        onClose={handleRelease}
        PaperProps={{
          sx: { pointerEvents: "none" },
        }}
      >
        <DialogContent>
          <Box
            id="multiplier-box"
            sx={{
              display: "flex",
              gap: 1,
              pointerEvents: "none",
              "& > div": {
                flex: 1,
                p: 2,
                textAlign: "center",
                borderRadius: 1,
              },
            }}
          >
            <Box
              sx={{
                bgcolor:
                  selectedMultiplier === 2 ? "primary.main" : "action.hover",
              }}
            >
              Double
            </Box>
            <Box
              sx={{
                bgcolor:
                  selectedMultiplier === 3 ? "primary.main" : "action.hover",
              }}
            >
              Triple
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
