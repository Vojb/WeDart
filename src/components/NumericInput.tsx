import {
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import {
  Backspace,
  CheckCircle,
  LooksOne,
  LooksTwo,
  Looks3,
} from "@mui/icons-material";
import { useState } from "react";
import React from "react";
import VibrationButton from "./VibrationButton";

interface NumericInputProps {
  onScore: (score: number, darts: number, lastDartMultiplier?: number) => void;
  currentPlayerScore?: number; // Add optional currentPlayerScore prop
  doubleOutRequired?: boolean; // Add flag for double out requirement
}

const NumericInput: React.FC<NumericInputProps> = ({
  onScore,
  currentPlayerScore,
}) => {
  const [currentInput, setCurrentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dartCountDialogOpen, setDartCountDialogOpen] = useState(false);
  const [recentScores, setRecentScores] = useState<number[]>([
    60, 45, 41, 26, 57,
  ]);

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
      // Add to recent scores if not already there
      setRecentScores((prev) => {
        // Skip if already in list
        if (prev.includes(score)) {
          return prev;
        }
        // Add new score at beginning, keep only 5 total
        const newScores = [
          score,
          ...prev.filter((s) => s !== score).slice(0, 4),
        ];
        return newScores;
      });

      // Calculate remaining score
      const remaining =
        currentPlayerScore !== undefined
          ? currentPlayerScore - score
          : undefined;

      // Check if player is finishing (reaching exactly 0)
      const isFinishing = remaining !== undefined && remaining === 0;

      // Check if this would be a bust
      const wouldBust = remaining !== undefined && remaining < 0;

      if (wouldBust) {
        // For bust, pass score as 0 (no points)
        setIsSubmitting(true);
        setTimeout(() => {
          onScore(0, 3, 1); // No points scored on bust
          setCurrentInput("");
          setIsSubmitting(false);
        }, 150);
      } else if (isFinishing) {
        // Reset multiplier when opening dialog
        // Open dialog to ask for dart count only on finish
        setDartCountDialogOpen(true);
      } else {
        // Not finishing, use default 3 darts
        setIsSubmitting(true);

        // Add a small delay to show the submission state
        setTimeout(() => {
          onScore(score, 3, 1);
          setCurrentInput("");
          setIsSubmitting(false);
        }, 150);
      }
    }
  };

  const handleQuickScore = (score: number) => {
    // Instead of submitting, just set the current input
    setCurrentInput(score.toString());
  };

  const handleDartCountSelection = (dartCount: number) => {
    const score = parseInt(currentInput) || 0;

    // No double out validation for numeric input
    setIsSubmitting(true);

    // Add a small delay to show the submission state
    setTimeout(() => {
      onScore(score, dartCount, 1); // Always use multiplier 1 for numeric input
      setCurrentInput("");
      setIsSubmitting(false);
      setDartCountDialogOpen(false);
    }, 150);
  };

  // Calculate if the input is valid
  const isValidScore = parseInt(currentInput) <= 180;
  const hasInput = currentInput.length > 0;
  const displayValue = hasInput ? currentInput : "0";

  // Calculate remaining score if currentPlayerScore is provided
  const score = parseInt(currentInput) || 0;
  const remainingScore =
    currentPlayerScore !== undefined && hasInput
      ? currentPlayerScore - score
      : undefined;

  // Determine if this would be a bust (score < 0)
  const isBust = remainingScore !== undefined && remainingScore < 0;

  // Check if it's a valid checkout
  const isCheckout = remainingScore !== undefined && remainingScore === 0;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 0.5, sm: 1 },
      }}
    >
      {/* Score display area */}
      <Paper
        elevation={2}
        sx={{
          mb: { xs: 1, sm: 2 },
          p: { xs: 1, sm: 2 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          minHeight: { xs: 80, sm: 110 },
          position: "relative",
        }}
      >
        {/* Remaining score indicator in top-right corner */}
        {remainingScore !== undefined && !isBust && (
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: 8,
              right: 12,
              opacity: 0.5,
              fontWeight: "bold",
              fontSize: "1rem",
              color: isCheckout ? "success.main" : "text.secondary",
            }}
          >
            {Math.max(0, remainingScore)}
          </Typography>
        )}

        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: "500",
            color: !isValidScore || isBust ? "error.main" : "text.primary",
          }}
        >
          {displayValue}
        </Typography>

        {/* Remaining or status display */}
        {remainingScore !== undefined && (
          <Typography
            variant="body1"
            sx={{
              mt: 0.5,
              fontWeight: "bold",
              color: isBust
                ? "error.main"
                : isCheckout
                ? "success.main"
                : "text.secondary",
            }}
          >
            {isBust ? "Bust!" : isCheckout ? "Checkout!" : ``}
          </Typography>
        )}

        {!isBust && !isValidScore && hasInput && (
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

      {/* Recent scores */}
      <Box sx={{ mb: { xs: 1, sm: 2 } }}>
        <Stack
          direction="row"
          sx={{
            display: "flex",
            width: "100%",
            gap: 0.5,
            "& > *": { mb: 0.5 },
          }}
          minHeight={40}
        >
          {recentScores.map((score, index) => (
            <VibrationButton
              key={index}
              color="secondary"
              variant="contained"
              onClick={() => handleQuickScore(score)}
              sx={{
                fontSize: { xs: "0.9rem", sm: "1.1rem" },
                fontWeight: 500,
                flex: 1,
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: { xs: 0.3, sm: 0.5 },
                px: 0,
              }}
            >
              {score}
            </VibrationButton>
          ))}
        </Stack>
      </Box>

      {/* Numeric keypad */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Grid
          container
          spacing={0.75}
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
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  fontWeight: "bold",
                  p: { xs: 0.5, sm: 1 },
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
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
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                fontWeight: "bold",
                p: { xs: 0.5, sm: 1 },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              vibrationPattern={30}
            >
              0
            </VibrationButton>
          </Grid>

          <Grid item xs={4} sx={{ height: "25%" }}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="error"
              onClick={handleBackspace}
              disabled={!hasInput}
              sx={{
                height: "100%",
                fontSize: { xs: "1.2rem", sm: "1.4rem" },
                p: { xs: 0.5, sm: 1 },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
                p: { xs: 0.5, sm: 1 },
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
                  <CheckCircle
                    sx={{ mr: { xs: 0.5, sm: 1 } }}
                    fontSize="inherit"
                  />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Enter
                  </Box>
                </>
              )}
            </VibrationButton>
          </Grid>
        </Grid>
      </Box>

      {/* Dialog to select number of darts used */}
      <Dialog
        open={dartCountDialogOpen}
        onClose={() => setDartCountDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: "90%",
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, textAlign: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            How many darts for checkout?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              my: 1,
              gap: 2,
            }}
          >
            <VibrationButton
              onClick={() => handleDartCountSelection(1)}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 2, borderRadius: 2 }}
              vibrationPattern={50}
              startIcon={<LooksOne />}
            >
              1 Dart
            </VibrationButton>
            <VibrationButton
              onClick={() => handleDartCountSelection(2)}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 2, borderRadius: 2 }}
              vibrationPattern={50}
              startIcon={<LooksTwo />}
            >
              2 Darts
            </VibrationButton>
            <VibrationButton
              onClick={() => handleDartCountSelection(3)}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 2, borderRadius: 2 }}
              vibrationPattern={50}
              startIcon={<Looks3 />}
            >
              3 Darts
            </VibrationButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => setDartCountDialogOpen(false)}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NumericInput;
