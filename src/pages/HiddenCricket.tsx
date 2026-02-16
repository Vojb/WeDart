import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Card,
  CardContent,
  Stack,
  Button,
  Switch,
  Stepper,
  Step,
  StepLabel,
  TextField,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  useHiddenCricketStore,
  updateHiddenCricketCachedPlayers,
} from "../store/useHiddenCricketStore";
import PlayerSelector from "../components/PlayerSelector";
import VibrationButton from "../components/VibrationButton";

const HiddenCricket: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const {
    updateGameSettings,
    gameSettings,
    startGame,
    setHiddenCricketPlayers,
  } = useHiddenCricketStore();
  const [activeStep, setActiveStep] = useState(0);

  // First level: Cricket mode selection
  const [cricketMode, setCricketMode] = useState<"cricket" | "hidden-cricket">("hidden-cricket");

  // Local state for form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  // Default to "cutthroat" - only use saved value if it's "no-score", otherwise always default to "cutthroat"
  const [gameType, setGameType] = useState<
    "standard" | "cutthroat" | "no-score"
  >(gameSettings.gameType === "no-score" ? "no-score" : "cutthroat");
  const [winCondition, setWinCondition] = useState<"first-closed" | "points">(
    gameSettings.winCondition || "points"
  );
  const [lastBull, setLastBull] = useState<boolean>(
    gameSettings.lastBull || false
  );
  const [numberOfLegs, setNumberOfLegs] = useState<number>(
    gameSettings.defaultLegs || 1
  );

  // Validation error state
  const [error, setError] = useState<string | null>(null);

  // Wizard steps
  const steps = ["Game Mode", "Game Type", "Win Condition & Bull", "Select Players"];

  // Handle cricket mode change
  const handleCricketModeChange = (mode: "cricket" | "hidden-cricket") => {
    setCricketMode(mode);
    if (mode === "cricket") {
      navigate("/cricket");
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate game mode selection
      if (!cricketMode) {
        setError("Please select a game mode");
        return;
      }
    } else if (activeStep === 1) {
      // Validate game type
      if (!gameType) {
        setError("Please select a game type");
        return;
      }
    } else if (activeStep === 2) {
      // Validate win condition
      if (!winCondition) {
        setError("Please select a win condition");
        return;
      }
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle form submission
  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    console.log("Starting Hidden Cricket game with players:", selectedPlayerIds);

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

    // Set hidden cricket players first to ensure they're cached
    setHiddenCricketPlayers(simplePlayers);
    updateHiddenCricketCachedPlayers(simplePlayers);

    // Update game settings in store
    updateGameSettings({
      gameType,
      winCondition,
      lastBull,
      defaultLegs: numberOfLegs,
    });

    // Start a new game
    startGame(gameType, winCondition, lastBull, selectedPlayerIds, numberOfLegs);

    // Navigate to game screen
    navigate("/hidden-cricket/game");
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <FormControl component="fieldset" sx={{ width: "100%" }}>
                  <FormLabel
                    component="legend"
                    sx={{ mb: 1, fontWeight: "medium", fontSize: "0.9rem" }}
                  >
                    Cricket Mode
                  </FormLabel>
                  <RadioGroup
                    value={cricketMode}
                    onChange={(e) => handleCricketModeChange(e.target.value as "cricket" | "hidden-cricket")}
                  >
                    <FormControlLabel
                      value="cricket"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Cricket
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Standard cricket with visible target numbers
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 0.5 }}
                    />
                    <FormControlLabel
                      value="hidden-cricket"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Hidden Cricket
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Target numbers are randomly selected and hidden
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <FormControl
                  component="fieldset"
                  sx={{ width: "100%" }}
                >
                  <FormLabel
                    component="legend"
                    sx={{ mb: 0.5, fontWeight: "medium", fontSize: "0.9rem" }}
                  >
                    Game Type
                  </FormLabel>
                  <RadioGroup
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value as any)}
                  >
                    <FormControlLabel
                      value="standard"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Normal Cricket
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Players score points on open numbers
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 0.5 }}
                    />
                    <FormControlLabel
                      value="cutthroat"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Cutthroat Cricket
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Scoring adds points to opponents (lowest score wins)
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 0.5 }}
                    />
                    <FormControlLabel
                      value="no-score"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            No-Score Cricket
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            First to close all numbers wins (no points)
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <FormControl component="fieldset" sx={{ width: "100%" }}>
                  <FormLabel
                    component="legend"
                    sx={{ mb: 0.5, fontWeight: "medium", fontSize: "0.9rem" }}
                  >
                    Win Condition
                  </FormLabel>
                  <RadioGroup
                    value={winCondition}
                    onChange={(e) => setWinCondition(e.target.value as any)}
                  >
                    <FormControlLabel
                      value="points"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Points
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {gameType === "cutthroat"
                              ? "Lowest score after all numbers are closed wins"
                              : "Highest score after all numbers are closed wins"}
                          </Typography>
                        </Box>
                      }
                      disabled={gameType === "no-score"}
                      sx={{ mb: 0.5 }}
                    />
                    <FormControlLabel
                      value="first-closed"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            First to Close
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            First player to close all numbers wins
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={lastBull}
                      onChange={(e) => setLastBull(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Last Bull
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bull doesn't count until all other 5 numbers are closed
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 0,
                    width: "100%",
                  }}
                >
                  <IconButton
                    aria-label="Decrease legs"
                    onClick={() =>
                      setNumberOfLegs((prev) => Math.max(1, prev - 1))
                    }
                    disabled={numberOfLegs <= 1}
                    sx={{ mt: 1 }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    label="Number of Legs"
                    type="number"
                    value={numberOfLegs}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0) {
                        setNumberOfLegs(value);
                      }
                    }}
                    inputProps={{ min: 1 }}
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-root": { borderRadius: 0 },
                    }}
                  />
                  <IconButton
                    aria-label="Increase legs"
                    onClick={() => setNumberOfLegs((prev) => prev + 1)}
                    sx={{ mt: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  How to Play
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  In Hidden Cricket, 6 random numbers from 1-20 plus Bull are
                  randomly selected and hidden. Select numbers 1-20 or Bull,
                  and if it's a valid target, choose single, double, or triple.
                  You need to close all 7 targets (6 numbers + Bull) to win.
                </Typography>
              </CardContent>
            </Card>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        );

      case 3:
        return (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              minHeight: 0,
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
        );

      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          boxShadow: 3,
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ mb: { xs: 1, sm: 2 } }}
        >
          Cricket Setup
        </Typography>

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          orientation="horizontal"
          sx={{
            mb: 3,
            "& .MuiStepLabel-label": {
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            mb: 2,
            minHeight: 0,
          }}
        >
          {renderStepContent(activeStep)}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            size="medium"
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <VibrationButton
              variant="contained"
              color="primary"
              onClick={handleStartGame}
              disabled={selectedPlayerIds.length < 1}
              vibrationPattern={100}
              size="medium"
            >
              Start Game
            </VibrationButton>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              size="medium"
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default HiddenCricket;

