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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Stack,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ mb: 3 }}
        >
          Cricket Setup
        </Typography>

        <Stepper
          activeStep={1}
          alternativeLabel={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{ mb: 4 }}
        >
          <Step completed>
            <StepLabel>Select Game Type</StepLabel>
          </Step>
          <Step active>
            <StepLabel>Choose Players</StepLabel>
          </Step>
          <Step>
            <StepLabel>Play Game</StepLabel>
          </Step>
        </Stepper>

        <Grid container spacing={3}>
          {/* Game Options Section */}
          <Grid item xs={12} md={5}>
            <Stack
              spacing={3}
              direction={{ xs: "row", sm: "column" }}
              sx={{
                overflowX: { xs: "auto", sm: "visible" },
                pb: { xs: 2, sm: 0 },
              }}
            >
              {/* Game Type Selection */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  minWidth: { xs: "260px", sm: "auto" },
                  flex: { xs: "0 0 auto", sm: 1 },
                }}
              >
                <CardContent>
                  <FormControl component="fieldset" sx={{ width: "100%" }}>
                    <FormLabel
                      component="legend"
                      sx={{ mb: 2, fontWeight: "medium" }}
                    >
                      Game Type
                    </FormLabel>
                    <RadioGroup
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value as any)}
                    >
                      <FormControlLabel
                        value="standard"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Standard Cricket
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Players score points on open numbers
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="cutthroat"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Cutthroat Cricket
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Scoring adds points to opponents (lowest score
                              wins)
                            </Typography>
                          </Box>
                        }
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="no-score"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              No-Score Cricket
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              First to close all numbers wins (no points)
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>

              {/* Win Condition Selection */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  minWidth: { xs: "260px", sm: "auto" },
                  flex: { xs: "0 0 auto", sm: 1 },
                }}
              >
                <CardContent>
                  <FormControl component="fieldset" sx={{ width: "100%" }}>
                    <FormLabel
                      component="legend"
                      sx={{ mb: 2, fontWeight: "medium" }}
                    >
                      Win Condition
                    </FormLabel>
                    <RadioGroup
                      value={winCondition}
                      onChange={(e) => setWinCondition(e.target.value as any)}
                    >
                      <FormControlLabel
                        value="points"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              Points
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {gameType === "cutthroat"
                                ? "Lowest score after all numbers are closed wins"
                                : "Highest score after all numbers are closed wins"}
                            </Typography>
                          </Box>
                        }
                        disabled={gameType === "no-score"}
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel
                        value="first-closed"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              First to Close
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              First player to close all numbers wins
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Player Selection */}
          <Grid item xs={12} md={7}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "auto",
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="medium">
                  Select Players
                </Typography>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  <PlayerSelector
                    players={players}
                    selectedPlayerIds={selectedPlayerIds}
                    onSelectionChange={setSelectedPlayerIds}
                    minPlayers={1}
                    maxPlayers={8}
                  />
                </Box>

                {error && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 4,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <VibrationButton
            variant="outlined"
            onClick={() => navigate("/")}
            vibrationPattern={50}
            size="large"
          >
            Back to Menu
          </VibrationButton>
          <VibrationButton
            variant="contained"
            color="primary"
            onClick={handleStartGame}
            disabled={selectedPlayerIds.length < 1}
            vibrationPattern={100}
            size="large"
          >
            Start Game
          </VibrationButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Cricket;
