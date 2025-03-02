import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useCricketStore, updateCachedPlayers } from "../store/useCricketStore";
import PlayerSelector from "../components/PlayerSelector";
import VibrationButton from "../components/VibrationButton";

const Cricket: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { updateGameSettings, gameSettings, startGame, setCricketPlayers } =
    useCricketStore();

  // Local state for form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [gameType, setGameType] = useState<
    "standard" | "cutthroat" | "no-score"
  >(gameSettings.gameType);
  const [winCondition, setWinCondition] = useState<"first-closed" | "points">(
    gameSettings.winCondition
  );

  // Validation error state
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    console.log("Starting Cricket game with players:", selectedPlayerIds);

    // Filter and prepare selected players
    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );

    console.log("Selected players:", selectedPlayers);

    if (selectedPlayers.length === 0) {
      setError("Error selecting players. Please try again.");
      return;
    }

    // First update cached players in the store
    const simplePlayers = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    // Set cricket players first to ensure they're cached
    setCricketPlayers(simplePlayers);
    updateCachedPlayers(simplePlayers);

    // Update game settings in store
    updateGameSettings({
      gameType,
      winCondition,
    });

    // Start a new game
    startGame(gameType, winCondition, selectedPlayerIds);

    // Navigate to game screen
    navigate("/cricket/game");
  };

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      <Paper
        sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Cricket Setup
        </Typography>

        <Grid container spacing={4}>
          {/* Game Type Selection */}
          <Grid item xs={12} md={2}>
            <FormControl component="fieldset" sx={{ mb: 1 }}>
              <FormLabel component="legend">Game Type</FormLabel>
              <RadioGroup
                value={gameType}
                onChange={(e) => setGameType(e.target.value as any)}
              >
                <FormControlLabel
                  value="standard"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Standard Cricket</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Players score points on open numbers
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="cutthroat"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Cutthroat Cricket</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scoring adds points to opponents (lowest score wins)
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="no-score"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">No-Score Cricket</Typography>
                      <Typography variant="body2" color="text.secondary">
                        First to close all numbers wins (no points)
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Win Condition Selection */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" sx={{ mb: 1 }}>
              <FormLabel component="legend">Win Condition</FormLabel>
              <RadioGroup
                value={winCondition}
                onChange={(e) => setWinCondition(e.target.value as any)}
              >
                <FormControlLabel
                  value="points"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Points</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {gameType === "cutthroat"
                          ? "Lowest score after all numbers are closed wins"
                          : "Highest score after all numbers are closed wins"}
                      </Typography>
                    </Box>
                  }
                  disabled={gameType === "no-score"}
                />
                <FormControlLabel
                  value="first-closed"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">First to Close</Typography>
                      <Typography variant="body2" color="text.secondary">
                        First player to close all numbers wins
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Player Selection */}
        <Box
          sx={{
            mb: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <PlayerSelector
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onSelectionChange={setSelectedPlayerIds}
            minPlayers={1}
            maxPlayers={8}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>

        <Box
          sx={{ mt: "auto", display: "flex", justifyContent: "space-between" }}
        >
          <VibrationButton
            variant="outlined"
            onClick={() => navigate("/")}
            vibrationPattern={50}
          >
            Back to Menu
          </VibrationButton>
          <VibrationButton
            variant="contained"
            color="primary"
            onClick={handleStartGame}
            disabled={selectedPlayerIds.length < 1}
            vibrationPattern={100}
          >
            Start Game
          </VibrationButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Cricket;
