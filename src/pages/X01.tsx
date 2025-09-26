import { Box, Typography, Paper, Stack, Chip, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import React from "react";
import VibrationButton from "../components/VibrationButton";
import { useX01Store } from "../store/useX01Store";

const X01: React.FC = () => {
  const navigate = useNavigate();
  const { gameSettings } = useX01Store();

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Typography variant="h4" gutterBottom>
          X01 Game
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Settings
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Chip label={`${gameSettings.defaultGameType}`} color="primary" />
            <Chip label={`${gameSettings.defaultLegs} legs`} color="primary" />
            {gameSettings.isDoubleOut && (
              <Chip label="Double Out" color="secondary" />
            )}
            {gameSettings.isDoubleIn && (
              <Chip label="Double In" color="secondary" />
            )}
          </Stack>
        </Box>

        <Stack spacing={2}>
          <VibrationButton
            variant="contained"
            size="large"
            onClick={() => navigate("/x01/new")}
            vibrationPattern={100}
            fullWidth
          >
            Start with Current Settings
          </VibrationButton>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/x01/new")}
            fullWidth
          >
            Change Settings
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default X01;
