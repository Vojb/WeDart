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
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add, Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  useWarmupStore,
  WarmupTarget,
  WarmupConfig,
} from "../store/useWarmupStore";
import PlayerSelector from "../components/PlayerSelector";
import VibrationButton from "../components/VibrationButton";

const Warmup: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { startGame, savedConfigs, saveConfig, deleteConfig, setPlayers } =
    useWarmupStore();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [dartCount, setDartCount] = useState<33 | 66 | 99>(33);
  const [targetMode, setTargetMode] = useState<"bull" | "custom">("bull");
  const [customTargets, setCustomTargets] = useState<WarmupTarget[]>([]);
  const [loadedConfig, setLoadedConfig] = useState<WarmupConfig | null>(null);
  const [newTargetNumber, setNewTargetNumber] = useState<string>("");
  const [newTargetZone, setNewTargetZone] = useState<"T" | "D" | "S">("S");
  const [configName, setConfigName] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine steps based on whether config is loaded
  const steps = loadedConfig
    ? ["Number of Darts", "Load Configuration", "Select Players"]
    : ["Number of Darts", "Load Configuration", "Target Configuration", "Select Players"];

  const handleNext = () => {
    if (activeStep === 0) {
      // Step 1: Just need dart count selected (always has a default)
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Step 2: Load Configuration
      if (loadedConfig) {
        // Skip target configuration, go to players (step 2 in shortened steps)
        setActiveStep(2);
      } else {
        // Go to target configuration (step 2 in full steps)
        setActiveStep(2);
      }
    } else if (activeStep === 2) {
      // Step 3: Target Configuration (only if no config loaded) or Select Players
      if (loadedConfig) {
        // Already at Select Players (step 2), validate
        if (selectedPlayerIds.length < 1) {
          setError("Please select at least one player");
          return;
        }
        // This shouldn't happen as we're at the last step
      } else {
        // Need target configuration validation
        if (targetMode === "bull") {
          setActiveStep(3);
        } else if (targetMode === "custom" && customTargets.length > 0) {
          setActiveStep(3);
        } else {
          setError("Please configure targets or load a saved configuration");
          return;
        }
      }
    }
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleAddTarget = () => {
    const num = parseInt(newTargetNumber);
    if (isNaN(num) || num < 1 || num > 20) {
      setError("Please enter a number between 1 and 20");
      return;
    }
    // Check if this number+zone combination already exists
    if (customTargets.some((t) => t.number === num && t.zone === newTargetZone)) {
      setError("This target is already added");
      return;
    }

    const newTarget: WarmupTarget = {
      number: num,
      zone: newTargetZone,
      order: customTargets.length,
    };
    setCustomTargets([...customTargets, newTarget]);
    setNewTargetNumber("");
    setError(null);
  };

  const handleAddBull = () => {
    if (customTargets.some((t) => t.number === "Bull")) {
      setError("Bull is already added");
      return;
    }
    const newTarget: WarmupTarget = {
      number: "Bull",
      order: customTargets.length,
    };
    setCustomTargets([...customTargets, newTarget]);
    setError(null);
  };

  const handleRemoveTarget = (order: number) => {
    const updated = customTargets
      .filter((t) => t.order !== order)
      .map((t, idx) => ({ ...t, order: idx }));
    setCustomTargets(updated);
  };

  const handleMoveTarget = (order: number, direction: "up" | "down") => {
    const newOrder = direction === "up" ? order - 1 : order + 1;
    if (newOrder < 0 || newOrder >= customTargets.length) return;

    const updated = [...customTargets];
    const temp = updated[order];
    updated[order] = updated[newOrder];
    updated[newOrder] = temp;
    updated[order].order = order;
    updated[newOrder].order = newOrder;
    setCustomTargets(updated);
  };

  const handleUpdateTargetZone = (order: number, zone: "T" | "D" | "S") => {
    const updated = customTargets.map((t) =>
      t.order === order ? { ...t, zone } : t
    );
    setCustomTargets(updated);
  };

  const handleLoadConfig = (config: WarmupConfig) => {
    setLoadedConfig(config);
    setDartCount(
      config.dartCount === 33 || config.dartCount === 66 || config.dartCount === 99
        ? config.dartCount
        : 33,
    );
    setCustomTargets(config.targets);
    setTargetMode("custom");
    setError(null);
  };

  const handleClearLoadedConfig = () => {
    setLoadedConfig(null);
    setCustomTargets([]);
    setTargetMode("bull");
  };

  const handleSaveConfig = () => {
    if (!configName.trim()) {
      setError("Please enter a name for this configuration");
      return;
    }

    const targets =
      targetMode === "bull"
        ? [{ number: "Bull" as const, order: 0 }]
        : customTargets;

    if (targets.length === 0) {
      setError("Please add at least one target");
      return;
    }

    saveConfig({
      name: configName,
      targets,
      dartCount,
    });

    setConfigName("");
    setSaveDialogOpen(false);
    setError(null);
  };

  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    const targets = loadedConfig
      ? loadedConfig.targets
      : targetMode === "bull"
        ? [{ number: "Bull" as const, order: 0 }]
        : customTargets;

    if (targets.length === 0) {
      setError("Please configure at least one target");
      return;
    }

    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id),
    );

    if (selectedPlayers.length === 0) {
      setError("Error selecting players. Please try again.");
      return;
    }

    const simplePlayers = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    // Set players in cache for future use
    setPlayers(simplePlayers);

    // Start the game with players passed directly
    startGame(dartCount, targets, selectedPlayerIds, simplePlayers);

    // Small delay to ensure state is set
    setTimeout(() => {
      const gameState = useWarmupStore.getState();

      if (!gameState.currentGame) {
        setError("Failed to start game. Please try again.");
        return;
      }

      // Navigate to game page
      navigate("/warmup/game");
    }, 10);
  };

  const getTargetDisplay = (target: WarmupTarget): string => {
    if (target.number === "Bull") {
      return "Bull";
    }
    const zonePrefix = target.zone || "S";
    return `${zonePrefix}${target.number}`;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Stack spacing={2} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                  }}
                >
                  <FormControl
                    component="fieldset"
                    sx={{ width: "100%", mb: 2 }}
                  >
                    <FormLabel
                      component="legend"
                      sx={{ mb: 1, fontWeight: "medium", fontSize: "0.9rem" }}
                    >
                      Number of Darts
                    </FormLabel>
                    <RadioGroup
                      value={dartCount}
                      onChange={(e) =>
                        setDartCount(parseInt(e.target.value) as 33 | 66 | 99)
                      }
                    >
                      <FormControlLabel
                        value={33}
                        control={<Radio size="small" />}
                        label="33 darts (11 rounds)"
                      />
                      <FormControlLabel
                        value={66}
                        control={<Radio size="small" />}
                        label="66 darts (22 rounds)"
                      />
                      <FormControlLabel
                        value={99}
                        control={<Radio size="small" />}
                        label="99 darts (33 rounds)"
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        );

      case 1:
        return (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Stack spacing={2} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
              {savedConfigs.length > 0 && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                    }}
                  >
                    <FormControl component="fieldset" sx={{ width: "100%", mb: 2 }}>
                      <FormLabel
                        component="legend"
                        sx={{ mb: 1, fontWeight: "medium", fontSize: "0.9rem" }}
                      >
                        Load Saved Configuration
                      </FormLabel>
                      {savedConfigs.map((config) => (
                        <Box
                          key={config.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                            p: 1,
                            border: 1,
                            borderColor:
                              loadedConfig?.id === config.id
                                ? "primary.main"
                                : "divider",
                            borderRadius: 1,
                            bgcolor:
                              loadedConfig?.id === config.id
                                ? "action.selected"
                                : "transparent",
                          }}
                        >
                          <ListItemText
                            primary={config.name}
                            secondary={`${config.dartCount} darts, ${config.targets.length} targets`}
                            sx={{ flex: 1 }}
                          />
                          <Button
                            size="small"
                            variant={
                              loadedConfig?.id === config.id
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() => handleLoadConfig(config)}
                          >
                            {loadedConfig?.id === config.id ? "Loaded" : "Load"}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => deleteConfig(config.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                    </FormControl>
                    {loadedConfig && (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleClearLoadedConfig}
                        sx={{ mt: 1 }}
                      >
                        Clear Loaded Configuration
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {savedConfigs.length === 0 && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No saved configurations. Configure targets in the next step.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        );

      case 2:
        // If config is loaded, this step is "Select Players", otherwise "Target Configuration"
        if (loadedConfig) {
          return (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <PlayerSelector
                  players={players}
                  selectedPlayerIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                  minPlayers={1}
                  maxPlayers={8}
                />
              </Box>
            </Box>
          );
        }
        return (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Stack spacing={2} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
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
                      Target Configuration
                    </FormLabel>
                    <RadioGroup
                      value={targetMode}
                      onChange={(e) => {
                        const newMode = e.target.value as "bull" | "custom";
                        setTargetMode(newMode);
                        if (newMode === "bull") {
                          setCustomTargets([]);
                        }
                      }}
                    >
                      <FormControlLabel
                        value="bull"
                        control={<Radio size="small" />}
                        label="Bull only"
                      />
                      <FormControlLabel
                        value="custom"
                        control={<Radio size="small" />}
                        label="Custom targets"
                      />
                    </RadioGroup>
                  </FormControl>

                  {targetMode === "custom" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Add targets (1-20 or Bull):
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <TextField
                          size="small"
                          placeholder="Number (1-20)"
                          value={newTargetNumber}
                          onChange={(e) => setNewTargetNumber(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddTarget();
                            }
                          }}
                          sx={{ flex: 1 }}
                        />
                        <Select
                          size="small"
                          value={newTargetZone}
                          onChange={(e) =>
                            setNewTargetZone(e.target.value as "T" | "D" | "S")
                          }
                          sx={{ minWidth: 80 }}
                        >
                          <MenuItem value="S">Single</MenuItem>
                          <MenuItem value="D">Double</MenuItem>
                          <MenuItem value="T">Triple</MenuItem>
                        </Select>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleAddTarget}
                          startIcon={<Add />}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleAddBull}
                        >
                          Add Bull
                        </Button>
                      </Box>

                      {customTargets.length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {customTargets
                            .sort((a, b) => a.order - b.order)
                            .map((target) => (
                              <Box
                                key={target.order}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  p: 1,
                                  border: 1,
                                  borderColor: "divider",
                                  borderRadius: 1,
                                }}
                              >
                                <Chip
                                  label={getTargetDisplay(target)}
                                  size="small"
                                  sx={{ minWidth: 60 }}
                                />
                                {target.number !== "Bull" && (
                                  <Select
                                    size="small"
                                    value={target.zone || "S"}
                                    onChange={(e) =>
                                      handleUpdateTargetZone(
                                        target.order,
                                        e.target.value as "T" | "D" | "S"
                                      )
                                    }
                                    sx={{ minWidth: 100 }}
                                  >
                                    <MenuItem value="S">Single</MenuItem>
                                    <MenuItem value="D">Double</MenuItem>
                                    <MenuItem value="T">Triple</MenuItem>
                                  </Select>
                                )}
                                <Box sx={{ flex: 1 }} />
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleMoveTarget(target.order, "up")
                                  }
                                  disabled={target.order === 0}
                                >
                                  <ArrowUpward fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleMoveTarget(target.order, "down")
                                  }
                                  disabled={
                                    target.order === customTargets.length - 1
                                  }
                                >
                                  <ArrowDownward fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleRemoveTarget(target.order)
                                  }
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {(targetMode === "bull" ||
                    (targetMode === "custom" && customTargets.length > 0)) && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setSaveDialogOpen(true)}
                      >
                        Save Current Configuration
                      </Button>
                    </Box>
                  )}

                  {error && (
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      {error}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Box>
        );

      case 3:
        return (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <PlayerSelector
                players={players}
                selectedPlayerIds={selectedPlayerIds}
                onSelectionChange={setSelectedPlayerIds}
                minPlayers={1}
                maxPlayers={8}
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ p: { xs: 1, sm: 1.5 }, height: "100%" }}>
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
          Warmup Setup
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
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
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

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Configuration Name"
            fullWidth
            variant="outlined"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            sx={{ mt: 1 }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Warmup;
