import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useX01Store } from "../store/useX01Store";
import React from "react";
import VibrationButton from "../components/VibrationButton";
import PlayerSelector from "../components/PlayerSelector";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`game-setup-tabpanel-${index}`}
      aria-labelledby={`game-setup-tab-${index}`}
      {...other}
      style={{ padding: "16px 0" }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const X01NewGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { players } = useStore();
  const { gameSettings, updateGameSettings, startGame, setPlayers } =
    useX01Store();
  const [gameType, setGameType] = useState("501");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [customValue, setCustomValue] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [numberOfLegs, setNumberOfLegs] = useState(gameSettings.defaultLegs);

  // Update X01Store with players from main store
  useEffect(() => {
    setPlayers(players);
  }, [players, setPlayers]);

  // Load saved preferences
  useEffect(() => {
    if (!isCustom) {
      setGameType(gameSettings.defaultGameType);
    } else if (gameSettings.lastCustomGameType) {
      // Load last custom game type if available
      setCustomValue(gameSettings.lastCustomGameType);
      setGameType(gameSettings.lastCustomGameType);
    }
    setNumberOfLegs(gameSettings.defaultLegs);
  }, [gameSettings, isCustom]);

  // Save preferences when they change
  useEffect(() => {
    if (!isCustom) {
      updateGameSettings({
        defaultGameType: gameType,
      });
    } else if (customValue) {
      // Save custom game type
      updateGameSettings({
        lastCustomGameType: customValue,
      });
    }
    updateGameSettings({ defaultLegs: numberOfLegs });
  }, [gameType, numberOfLegs, isCustom, customValue, updateGameSettings]);

  // Handle back button navigation
  useEffect(() => {
    // Save the current history state
    const handleBackButton = (e: PopStateEvent) => {
      // Prevent the default back navigation
      e.preventDefault();
      // Show the confirmation dialog
      setShowExitDialog(true);
    };

    // Add event listener for popstate (back button)
    window.addEventListener("popstate", handleBackButton);

    // Push a new state to the history to enable popstate detection
    window.history.pushState({ page: "x01-new-game" }, "", location.pathname);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [location.pathname]);

  const handlePlayersChange = (selectedIds: number[]) => {
    // Maintain the order of selection by using the array as is
    setSelectedPlayers(selectedIds.map((id) => id.toString()));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCustomValueChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setCustomValue(value);
      if (value) {
        setGameType(value);
      } else {
        setGameType("501"); // Default back to 501 if custom value is cleared
      }
    }
  };

  const selectGameType = (type: string) => {
    setGameType(type);
    setIsCustom(type === "custom");
    if (type !== "custom") {
      setCustomValue("");
    } else if (gameSettings.lastCustomGameType) {
      // Load last custom game type if available
      setCustomValue(gameSettings.lastCustomGameType);
      setGameType(gameSettings.lastCustomGameType);
    }
  };

  const handleStartGame = () => {
    // Use the custom value if it's set, otherwise use the selected game type
    const finalGameType = isCustom && customValue ? customValue : gameType;

    // Convert strings back to numbers while maintaining order
    const orderedPlayerIds = selectedPlayers.map((id) => parseInt(id));

    // Start game with ordered player IDs and number of legs
    startGame(finalGameType, orderedPlayerIds, numberOfLegs);
    navigate("/x01/game");
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    // Navigate back to the previous page
    navigate(-1);
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
    // Push state again to maintain our back button trap
    window.history.pushState({ page: "x01-new-game" }, "", location.pathname);
  };

  const gameTypeOptions = [
    { value: "301", label: "301" },
    { value: "501", label: "501" },
    { value: "701", label: "701" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper
        sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          New X01 Game
        </Typography>

        <Stepper
          activeStep={tabValue}
          alternativeLabel
          orientation="horizontal"
          sx={{
            mb: 2,
            "& .MuiStepLabel-label": {
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            },
          }}
        >
          <Step>
            <StepLabel>Game Settings</StepLabel>
          </Step>
          <Step>
            <StepLabel>Select Players</StepLabel>
          </Step>
          <Step>
            <StepLabel>Play Game</StepLabel>
          </Step>
        </Stepper>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Game Settings" />
          <Tab label="Players" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Game Type
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 2, flexWrap: "wrap" }}
              >
                {gameTypeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => selectGameType(option.value)}
                    color={
                      (isCustom && option.value === "custom") ||
                      (!isCustom && gameType === option.value)
                        ? "primary"
                        : "default"
                    }
                    variant={
                      (isCustom && option.value === "custom") ||
                      (!isCustom && gameType === option.value)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>

              {isCustom && (
                <TextField
                  fullWidth
                  label="Custom X01 Value"
                  variant="outlined"
                  value={customValue}
                  onChange={handleCustomValueChange}
                  placeholder="Enter a custom value"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">01</InputAdornment>
                    ),
                  }}
                  helperText="Enter a number (e.g. 301, 501, 701, 901, etc.)"
                />
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Game Rules
              </Typography>
              <Stack spacing={2}>
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
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={gameSettings.isDoubleOut}
                      onChange={(e) =>
                        updateGameSettings({ isDoubleOut: e.target.checked })
                      }
                    />
                  }
                  label="Double Out"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={gameSettings.isDoubleIn}
                      onChange={(e) =>
                        updateGameSettings({ isDoubleIn: e.target.checked })
                      }
                    />
                  }
                  label="Double In"
                />
              </Stack>
            </CardContent>
          </Card>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => setTabValue(1)}
            sx={{ mt: 1 }}
          >
            Next: Select Players
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Select Players
          </Typography>

          <PlayerSelector
            players={players}
            selectedPlayerIds={selectedPlayers.map((id) => parseInt(id))}
            onSelectionChange={handlePlayersChange}
            minPlayers={1}
            maxPlayers={4}
          />

          <Box sx={{ mt: 3 }}>
            <VibrationButton
              variant="contained"
              size="large"
              onClick={handleStartGame}
              disabled={
                selectedPlayers.length === 0 || (isCustom && !customValue)
              }
              fullWidth
              vibrationPattern={100}
            >
              Start Game
            </VibrationButton>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setTabValue(0)}
              sx={{ mt: 1 }}
            >
              Back to Game Settings
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={handleExitCancel}
        aria-labelledby="exit-dialog-title"
        aria-describedby="exit-dialog-description"
      >
        <DialogTitle id="exit-dialog-title">Leave Game Setup?</DialogTitle>
        <DialogContent>
          <DialogContentText id="exit-dialog-description">
            Are you sure you want to leave? Your game setup progress will be
            lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExitCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleExitConfirm} color="error" autoFocus>
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default X01NewGame;
