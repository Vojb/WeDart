import { Grid, Button, IconButton, Typography, Box } from "@mui/material";
import { Backspace } from "@mui/icons-material";
import { useState } from "react";
import React from "react";

interface NumericInputProps {
  onScore: (score: number, darts: number) => void;
}

const NumericInput: React.FC<NumericInputProps> = ({ onScore }) => {
  const [currentInput, setCurrentInput] = useState<string>("");

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
      onScore(score, 3);
      setCurrentInput("");
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" align="center" sx={{ mb: 1 }}>
        {currentInput || "0"}
      </Typography>
      <Grid
        container
        spacing={1}
        sx={{
          flex: 1,
          alignContent: "flex-start",
        }}
      >
        {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((num) => (
          <Grid item xs={4} key={num}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNumericInput(num.toString())}
            >
              {num}
            </Button>
          </Grid>
        ))}
        <Grid item xs={4}>
          <IconButton onClick={handleBackspace} color="error">
            <Backspace />
          </IconButton>
        </Grid>
        <Grid item xs={8}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmitScore}
            disabled={!currentInput}
          >
            Enter
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NumericInput;
