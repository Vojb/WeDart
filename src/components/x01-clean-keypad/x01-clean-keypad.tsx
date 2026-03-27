import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Backspace, CheckCircle } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";

const btnSx = {
  flex: "1 1 30%",
  minWidth: 0,
  minHeight: 48,
  fontSize: "1.25rem",
  fontWeight: 700,
};

interface X01CleanKeypadProps {
  playerNames: [string, string];
  playerScores: [number, number];
  currentPlayerIndex: number;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const X01CleanKeypad: React.FC<X01CleanKeypadProps> = ({
  playerNames,
  playerScores,
  currentPlayerIndex,
  inputValue,
  onInputChange,
  onSubmit,
  disabled = false,
}) => {
  const handleNum = (n: string) => {
    if (inputValue.length < 3) onInputChange(inputValue + n);
  };

  const handleBackspace = () => onInputChange(inputValue.slice(0, -1));

  const handleEnter = () => {
    const score = parseInt(inputValue, 10) || 0;
    if (score > 180) return;
    onSubmit();
  };

  const canSubmit =
    inputValue.length > 0 && parseInt(inputValue, 10) <= 180 && !disabled;

  return (
    <Box
      sx={{
        flex: "1 1 0",
        minHeight: 0,
        p: 1.5,
        pb: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", flex: 1, gap: 1, mb: 1, py: 1 }}>
        <Paper
          variant="outlined"
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 1,
            px: 1,
            borderWidth: currentPlayerIndex === 0 ? 3 : 1,
            borderColor: currentPlayerIndex === 0 ? "primary.main" : "divider",
          }}
        >
          <Typography variant="h3" color="text.secondary">
            {playerNames[0].toUpperCase()}
          </Typography>
          <Typography variant="h1" component="div" fontWeight={700}>
            {playerScores[0]}
          </Typography>
        </Paper>
        <Paper
          variant="outlined"
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 1,
            px: 1,
            borderWidth: currentPlayerIndex === 1 ? 3 : 1,
            borderColor: currentPlayerIndex === 1 ? "primary.main" : "divider",
          }}
        >
          <Typography variant="h3" color="text.secondary">
            {playerNames[1].toUpperCase()}
          </Typography>
          <Typography variant="h1" component="div" fontWeight={700}>
            {playerScores[1]}
          </Typography>
        </Paper>
      </Box>
      <Box
        sx={{ display: "flex", flex: 3, gap: 0.75, flexWrap: "wrap", mb: 0.75 }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <VibrationButton
            key={n}
            variant="contained"
            color="primary"
            onClick={() => handleNum(String(n))}
            disabled={disabled}
            vibrationPattern={30}
            sx={btnSx}
          >
            {n}
          </VibrationButton>
        ))}
      </Box>
      <Box sx={{ display: "flex", flex: 1, gap: 0.75, flexWrap: "wrap" }}>
        <VibrationButton
          variant="contained"
          color="error"
          onClick={handleBackspace}
          disabled={!inputValue || disabled}
          vibrationPattern={[20, 30]}
          sx={btnSx}
        >
          <Backspace />
        </VibrationButton>
        <VibrationButton
          variant="contained"
          color="info"
          onClick={() => handleNum("0")}
          disabled={disabled}
          vibrationPattern={30}
          sx={btnSx}
        >
          0
        </VibrationButton>
        <VibrationButton
          variant="contained"
          color="success"
          onClick={handleEnter}
          disabled={!canSubmit}
          vibrationPattern={100}
          sx={btnSx}
        >
          <CheckCircle />
        </VibrationButton>
      </Box>
    </Box>
  );
};

export default X01CleanKeypad;
