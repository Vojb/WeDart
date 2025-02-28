import { Grid, Button, Box, Typography, Paper, Popper } from "@mui/material";
import { useState, useRef, useEffect } from "react";

interface DartInputProps {
  onScore: (score: number, darts: number) => void;
}

type Multiplier = 1 | 2 | 3;

export default function DartInput({ onScore }: DartInputProps) {
  const [showMultiplier, setShowMultiplier] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(2);
  const [currentDarts, setCurrentDarts] = useState<number[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pressTimer = useRef<number | null>(null);

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
    if (currentDarts.length >= 3) return;

    const element = event.currentTarget as HTMLElement;
    setSelectedNumber(number);
    setAnchorEl(element);

    pressTimer.current = window.setTimeout(() => {
      setShowMultiplier(true);
    }, 2000);
  };

  const handleEnd = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (selectedNumber !== null && currentDarts.length < 3 && !showMultiplier) {
      setCurrentDarts([...currentDarts, selectedNumber]);
    }
  };

  const handleMultiplierSelect = (multiplier: Multiplier) => {
    if (selectedNumber !== null) {
      setSelectedMultiplier(multiplier);
      setCurrentDarts([...currentDarts, selectedNumber * multiplier]);
    }
    setShowMultiplier(false);
    setSelectedNumber(null);
    setAnchorEl(null);
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
              onMouseDown={(e) => handleStart(num, e)}
              onMouseUp={handleEnd}
              onMouseLeave={() => {
                handleEnd();
                setShowMultiplier(false);
                setAnchorEl(null);
              }}
              onTouchStart={(e) => handleStart(num, e)}
              onTouchEnd={handleEnd}
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
            onMouseDown={(e) => handleStart(25, e)}
            onMouseUp={handleEnd}
            onMouseLeave={() => {
              handleEnd();
              setShowMultiplier(false);
              setAnchorEl(null);
            }}
            onTouchStart={(e) => handleStart(25, e)}
            onTouchEnd={handleEnd}
          >
            Bull (25)
          </Button>
        </Grid>
      </Grid>

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
            variant="contained"
            onClick={() => handleMultiplierSelect(2)}
            color={selectedMultiplier === 2 ? "primary" : "inherit"}
          >
            Double
          </Button>
          <Button
            variant="contained"
            onClick={() => handleMultiplierSelect(3)}
            color={selectedMultiplier === 3 ? "primary" : "inherit"}
          >
            Triple
          </Button>
        </Paper>
      </Popper>
    </Box>
  );
}
