import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import VibrationButton from "../VibrationButton";

interface HitCounterInputProps {
  target: number | string;
  onSubmit: (hits: number) => void;
  maxHits?: number;
  previewData?: {
    currentScore: number;
    pointsGained: number;
    newScore: number;
    isHalved: boolean;
  } | null;
  disabled?: boolean;
}

const HitCounterInput: React.FC<HitCounterInputProps> = ({
  target,
  onSubmit,
  maxHits = 9,
  previewData,
  disabled = false,
}) => {
  const handleNumberClick = (num: number) => {
    if (num <= maxHits) {
      onSubmit(num);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Paper sx={{ p: 3, mb: 2, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          {target}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select number of hits
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <Grid item xs={num === 0 ? 12 : 4} key={num}>
            <VibrationButton
              fullWidth
              variant="contained"
              color={num === 0 ? "error" : "primary"}
              onClick={() => handleNumberClick(num)}
              disabled={num > maxHits || disabled}
              vibrationPattern={100}
              sx={{ height: "100%" }}
            >
              {num}
            </VibrationButton>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HitCounterInput;

