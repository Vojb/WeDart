import { Grid, Typography, Box, Paper, CircularProgress } from "@mui/material";
import { Backspace, CheckCircle } from "@mui/icons-material";
import { useState } from "react";
import React from "react";
import VibrationButton from "./VibrationButton";

interface NumericInputProps {
  onScore: (score: number, darts: number, lastDartMultiplier?: number) => void;
}

const NumericInput: React.FC<NumericInputProps> = ({ onScore }) => {
  const [currentInput, setCurrentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumericInput = (num: string) => {
    if (currentInput.length < 3) {
      setCurrentInput(currentInput + num);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handleSubmitScore = () => {
    const score = parseInt(currentInput) || 0;
    if (score <= 180) {
      setIsSubmitting(true);

      // Add a small delay to show the submission state
      setTimeout(() => {
        onScore(score, 3, 1);
        setCurrentInput("");
        setIsSubmitting(false);
      }, 150);
    }
  };

  // Calculate if the input is valid
  const isValidScore = parseInt(currentInput) <= 180;
  const hasInput = currentInput.length > 0;
  const displayValue = hasInput ? currentInput : "0";

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1,
      }}
    >
      {/* Score display area */}
      <Paper
        elevation={2}
        sx={{
          mb: 2,
          p: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[100],
          position: "relative",
        }}
      >
        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: "500",
            color: !isValidScore && hasInput ? "error.main" : "text.primary",
          }}
        >
          {displayValue}
        </Typography>
        {!isValidScore && hasInput && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 8,
              color: "error.main",
              fontWeight: "bold",
            }}
          >
            Maximum score is 180
          </Typography>
        )}
      </Paper>

      {/* Numeric keypad */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Grid
          container
          spacing={1.5}
          sx={{
            flex: 1,
            height: "100%",
          }}
        >
          {/* Number buttons */}
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <Grid item xs={4} key={num} sx={{ height: "25%" }}>
              <VibrationButton
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleNumericInput(num.toString())}
                sx={{
                  height: "100%",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
                vibrationPattern={30}
              >
                {num}
              </VibrationButton>
            </Grid>
          ))}

          {/* Bottom row with 0, backspace, and submit */}
          <Grid item xs={4} sx={{ height: "25%" }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => handleNumericInput("0")}
              sx={{
                height: "100%",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
              vibrationPattern={30}
            >
              0
            </VibrationButton>
          </Grid>

          <Grid item xs={4} sx={{ height: "25%" }}>
            <VibrationButton
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleBackspace}
              disabled={!hasInput}
              sx={{
                height: "100%",
                fontSize: { xs: "1.2rem", sm: "1.4rem" },
              }}
              vibrationPattern={[20, 30]}
            >
              <Backspace fontSize="inherit" />
            </VibrationButton>
          </Grid>

          <Grid item xs={4} sx={{ height: "25%" }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="success"
              onClick={handleSubmitScore}
              disabled={!hasInput || !isValidScore || isSubmitting}
              sx={{
                height: "100%",
                fontSize: { xs: "1.2rem", sm: "1.4rem" },
              }}
              vibrationPattern={100}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <CheckCircle sx={{ mr: 1 }} fontSize="inherit" />
                  Enter
                </>
              )}
            </VibrationButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default NumericInput;
