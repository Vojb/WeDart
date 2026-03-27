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
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "3.5rem", sm: "4.25rem" },
            lineHeight: 1.08,
            my: 0.5,
          }}
        >
          {target}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={500}
          sx={{ fontSize: { xs: "1.15rem", sm: "1.35rem" } }}
        >
          Select number of hits
        </Typography>
        {previewData && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography
              variant="body1"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: "1.1rem" }}
            >
              Current: {previewData.currentScore}
            </Typography>
            {previewData.isHalved ? (
              <Typography
                variant="h5"
                color="error"
                fontWeight={600}
                sx={{ fontSize: { xs: "1.15rem", sm: "1.3rem" } }}
              >
                Score Halved! {previewData.pointsGained > 0 ? "+" : ""}
                {previewData.pointsGained}
              </Typography>
            ) : (
              <Typography
                variant="h5"
                color="success.main"
                fontWeight={600}
                sx={{ fontSize: { xs: "1.15rem", sm: "1.3rem" } }}
              >
                +{previewData.pointsGained} points
              </Typography>
            )}
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", mt: 1, fontSize: { xs: "1.4rem", sm: "1.6rem" } }}
            >
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
              sx={{ height: "100%", fontSize: "1.55rem", fontWeight: 700 }}
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

