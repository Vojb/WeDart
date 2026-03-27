import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, Chip } from "@mui/material";
import { Backspace, CheckCircle } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";

interface PointsInputProps {
  roundType: "scoring" | "double" | "treble";
  onSubmit: (points: number) => void;
  previewData?: {
    currentScore: number;
    pointsGained: number;
    newScore: number;
    isHalved: boolean;
  } | null;
  disabled?: boolean;
}

const PointsInput: React.FC<PointsInputProps> = ({
  roundType,
  onSubmit,
  previewData,
  disabled = false,
}) => {
  const [currentInput, setCurrentInput] = useState<string>("");
  const [hits, setHits] = useState<Array<number | string>>([]);

  // Reset hits when round type changes
  useEffect(() => {
    setHits([]);
  }, [roundType]);

  const handleNumericInput = (num: string) => {
    if (currentInput.length < 3) {
      setCurrentInput(currentInput + num);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handleSubmit = () => {
    const points = parseInt(currentInput) || 0;
    if (points >= 0 && points <= 180) {
      onSubmit(points);
      setCurrentInput("");
    }
  };

  const handleNumberClick = (number: number | string) => {
    // For double/treble rounds, add to hits (max 3)
    if (roundType === "double" || roundType === "treble") {
      if (hits.length < 3) {
        const newHits = [...hits, number];
        setHits(newHits);

        // Calculate total points
        const multiplier = roundType === "double" ? 2 : 3;
        const totalPoints = newHits.reduce(
          (sum: number, num: number | string) => {
            const baseValue: number =
              num === "Bull" ? 25 : typeof num === "number" ? num : 0;
            return sum + baseValue * multiplier;
          },
          0,
        );

        // Auto-submit after 3 hits
        if (newHits.length === 3) {
          setTimeout(() => {
            onSubmit(totalPoints);
            setHits([]);
          }, 100);
        }
      }
    }
  };

  const handleRemoveHit = (index: number) => {
    const newHits = hits.filter((_, i) => i !== index);
    setHits(newHits);
  };

  const handleClearHits = () => {
    setHits([]);
  };

  const getRoundLabel = () => {
    switch (roundType) {
      case "scoring":
        return "Scoring";
      case "double":
        return "Double";
      case "treble":
        return "Treble";
      default:
        return "";
    }
  };

  const displayValue = currentInput || "0";
  const isValid = parseInt(currentInput) >= 0 && parseInt(currentInput) <= 180;

  // For double/treble rounds, show number selector
  if (roundType === "double" || roundType === "treble") {
    const numbers = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      "Bull",
    ];
    const multiplier = roundType === "double" ? 2 : 3;
    const canAddMore = hits.length < 3;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          p: 2,
          gap: 2,
        }}
      >
        <Paper
          sx={{
            p: 3,
            textAlign: "center",
            flex: "0.3 1 0%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
          >
            {getRoundLabel()}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            fontWeight={500}
            gutterBottom
            sx={{ fontSize: { xs: "1.1rem", sm: "1.2rem" } }}
          >
            Select number hit ({hits.length}/3)
          </Typography>
          {hits.length > 0 && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "center",
              }}
            >
              {hits.map((hit, index) => {
                const baseValue =
                  hit === "Bull" ? 25 : typeof hit === "number" ? hit : 0;
                const points = baseValue * multiplier;
                return (
                  <Chip
                    key={index}
                    label={`${hit} = ${points}`}
                    onDelete={() => handleRemoveHit(index)}
                    color="primary"
                    variant="outlined"
                    sx={{
                      "& .MuiChip-label": { fontSize: "1.2rem", fontWeight: 600 },
                    }}
                  />
                );
              })}
            </Box>
          )}
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
                  sx={{ fontSize: { xs: "1.15rem", sm: "1.25rem" } }}
                >
                  Score Halved! {previewData.pointsGained > 0 ? "+" : ""}
                  {previewData.pointsGained}
                </Typography>
              ) : (
                <Typography
                  variant="h5"
                  color="success.main"
                  fontWeight={600}
                  sx={{ fontSize: { xs: "1.15rem", sm: "1.25rem" } }}
                >
                  +{previewData.pointsGained} points
                </Typography>
              )}
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", mt: 1, fontSize: { xs: "1.35rem", sm: "1.5rem" } }}
              >
                New Total: {previewData.newScore}
              </Typography>
            </Box>
          )}
        </Paper>

        <Grid container spacing={1} sx={{ flex: "1 1 0%", minHeight: 0 }}>
          {numbers.map((num) => {
            return (
              <Grid item xs={3} key={num}>
                <VibrationButton
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleNumberClick(num)}
                  disabled={!canAddMore || disabled}
                  vibrationPattern={100}
                  sx={{ height: "100%", fontSize: "1.45rem", fontWeight: 700 }}
                >
                  {num}
                </VibrationButton>
              </Grid>
            );
          })}
          {hits.length === 0 && (
            <Grid item xs={9}>
              <VibrationButton
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => onSubmit(0)}
                disabled={disabled}
                vibrationPattern={100}
                sx={{ height: "100%", fontSize: "1.35rem", fontWeight: 700 }}
              >
                Miss
              </VibrationButton>
            </Grid>
          )}
          {hits.length > 0 && (
            <Grid item xs={3}>
              <VibrationButton
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleClearHits}
                disabled={disabled}
                vibrationPattern={[20, 30]}
                sx={{ height: "100%", fontSize: "1.35rem", fontWeight: 700 }}
              >
                Clear All
              </VibrationButton>
            </Grid>
          )}
          {hits.length > 0 && hits.length < 3 && (
            <Grid item xs={3}>
              <VibrationButton
                fullWidth
                variant="contained"
                color="success"
                onClick={() => {
                  const multiplier = roundType === "double" ? 2 : 3;
                  const totalPoints = hits.reduce(
                    (sum: number, num: number | string) => {
                      const baseValue: number =
                        num === "Bull" ? 25 : typeof num === "number" ? num : 0;
                      return sum + baseValue * multiplier;
                    },
                    0,
                  );
                  onSubmit(totalPoints);
                  setHits([]);
                }}
                disabled={disabled}
                vibrationPattern={100}
                sx={{ height: "100%", fontSize: "1.35rem", fontWeight: 700 }}
              >
                Submit
              </VibrationButton>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  // For scoring rounds, show manual input
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        p: 2,
        gap: 2,
      }}
    >
      <Paper
        sx={{
          p: 3,
          textAlign: "center",
          flex: "0.3 1 0%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.85rem" } }}
        >
          {getRoundLabel()}
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "3.85rem", sm: "4.75rem" },
            lineHeight: 1.08,
            my: 0.5,
          }}
        >
          {displayValue}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={500}
          sx={{ fontSize: { xs: "1.15rem", sm: "1.3rem" } }}
        >
          Enter points scored
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

      <Grid container spacing={1} sx={{ flex: "1 1 0%", minHeight: 0 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Grid item xs={4} key={num}>
            <VibrationButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => handleNumericInput(num.toString())}
              disabled={disabled}
              vibrationPattern={30}
              sx={{ height: "100%", fontSize: "1.55rem", fontWeight: 700 }}
            >
              {num}
            </VibrationButton>
          </Grid>
        ))}
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="error"
            onClick={handleBackspace}
            disabled={!currentInput || disabled}
            vibrationPattern={[20, 30]}
            sx={{
              height: "100%",
              "& .MuiSvgIcon-root": { fontSize: "2.1rem" },
            }}
          >
            <Backspace />
          </VibrationButton>
        </Grid>
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="error"
            onClick={() => handleNumericInput("0")}
            disabled={disabled}
            vibrationPattern={30}
            sx={{ height: "100%", fontSize: "1.55rem", fontWeight: 700 }}
          >
            0
          </VibrationButton>
        </Grid>
        <Grid item xs={4}>
          <VibrationButton
            fullWidth
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={!isValid || !currentInput || disabled}
            vibrationPattern={100}
            sx={{
              height: "100%",
              "& .MuiSvgIcon-root": { fontSize: "2.1rem" },
            }}
          >
            <CheckCircle />
          </VibrationButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PointsInput;
