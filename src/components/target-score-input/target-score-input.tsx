import React, { useState } from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { Backspace, CheckCircle } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";

interface TargetScoreInputProps {
  targetScore: number;
  onSubmit: (totalScore: number) => void;
  previewData?: {
    currentScore: number;
    pointsGained: number;
    newScore: number;
    isHalved: boolean;
  } | null;
}

const TargetScoreInput: React.FC<TargetScoreInputProps> = ({
  targetScore,
  onSubmit,
  previewData,
}) => {
  const [currentInput, setCurrentInput] = useState<string>("");

  const handleNumericInput = (num: string) => {
    if (currentInput.length < 3) {
      setCurrentInput(currentInput + num);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handleSubmit = () => {
    const totalScore = parseInt(currentInput) || 0;
    if (totalScore >= 0 && totalScore <= 180) {
      onSubmit(totalScore);
      setCurrentInput("");
    }
  };

  const displayValue = currentInput || "0";
  const isValid = parseInt(currentInput) >= 0 && parseInt(currentInput) <= 180;
  const isExactMatch = parseInt(currentInput) === targetScore;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Paper sx={{ p: 3, mb: 2, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Target Score
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
          {targetScore}
        </Typography>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: "bold",
            color: isExactMatch ? "success.main" : "text.primary"
          }}
        >
          {displayValue}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isExactMatch
            ? "Exact match! +41 points"
            : "Must total exactly 41, otherwise score is halved"}
        </Typography>
        {previewData && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current: {previewData.currentScore}
            </Typography>
            {previewData.isHalved ? (
              <Typography variant="body1" color="error">
                Score Halved! {previewData.pointsGained > 0 ? "+" : ""}{previewData.pointsGained}
              </Typography>
            ) : (
              <Typography variant="body1" color="success.main">
                +{previewData.pointsGained} points
              </Typography>
            )}
            <Typography variant="h6" sx={{ fontWeight: "bold", mt: 1 }}>
              New Total: {previewData.newScore}
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={1} sx={{ flex: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Grid item xs={4} key={num}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => handleNumericInput(num.toString())}
              vibrationPattern={30}
              sx={{ height: "100%" }}
            >
              {num}
            </VibrationButton>
          </Grid>
        ))}
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => handleNumericInput("0")}
            vibrationPattern={30}
            sx={{ height: "100%" }}
          >
            0
          </VibrationButton>
        </Grid>
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="error"
            onClick={handleBackspace}
            disabled={!currentInput}
            vibrationPattern={[20, 30]}
            sx={{ height: "100%" }}
          >
            <Backspace />
          </VibrationButton>
        </Grid>
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={!isValid || !currentInput}
            vibrationPattern={100}
            sx={{ height: "100%" }}
          >
            <CheckCircle />
          </VibrationButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TargetScoreInput;

