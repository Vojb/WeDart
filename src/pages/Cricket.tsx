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
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useCricketStore, updateCachedPlayers } from "../store/useCricketStore";
import PlayerSelector from "../components/PlayerSelector";
import VibrationButton from "../components/VibrationButton";

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
      id={`cricket-setup-tabpanel-${index}`}
      aria-labelledby={`cricket-setup-tab-${index}`}
      {...other}
      style={{
        height: "100%",
        display: value === index ? "flex" : "none",
        flexDirection: "column",
      }}
    >
      {value === index && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Cricket: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { updateGameSettings, gameSettings, startGame, setCricketPlayers } =
    useCricketStore();
  const [tabValue, setTabValue] = useState(0);

  // First level: Cricket mode selection
  const [cricketMode, setCricketMode] = useState<"cricket" | "hidden-cricket">("cricket");

  // Local state for form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [gameType, setGameType] = useState<
    "standard" | "cutthroat" | "no-score"
  >((gameSettings.gameType === "cutthroat" || gameSettings.gameType === "no-score") 
    ? gameSettings.gameType 
    : "standard");
  const [winCondition, setWinCondition] = useState<"first-closed" | "points">(
    gameSettings.winCondition || "points"
  );

  // Validation error state
  const [error, setError] = useState<string | null>(null);

  // Handle cricket mode change
  const handleCricketModeChange = (mode: "cricket" | "hidden-cricket") => {
    setCricketMode(mode);
    if (mode === "hidden-cricket") {
      navigate("/hidden-cricket");
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

    // Regular cricket modes
    // Set cricket players first to ensure they're cached
    setCricketPlayers(simplePlayers);
    updateCachedPlayers(simplePlayers);

    // Update game settings in store
    updateGameSettings({
      gameType: gameType as "standard" | "cutthroat" | "no-score",
      winCondition,
    });

    // Start a new game
    startGame(gameType as "standard" | "cutthroat" | "no-score", winCondition, selectedPlayerIds);

    // Navigate to game screen
    navigate("/cricket/game");
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, height: "100%" }}>
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          boxShadow: 3,
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

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Game Settings" />
          <Tab label="Select Players" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Stack spacing={2} sx={{ flex: 1 }}>
            {/* First Level: Cricket Mode Selection */}
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

            {/* Game Type Selection - Only show when Cricket is selected */}
            {cricketMode === "cricket" && (
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
            )}

            {/* Win Condition Selection - Only show when Cricket is selected */}
            {cricketMode === "cricket" && (
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
            )}
          </Stack>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setTabValue(1)}
            sx={{ mt: 2 }}
          >
            Next: Select Players
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
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
            sx={{
              mt: { xs: 1.5, sm: 2 },
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <VibrationButton
              variant="contained"
              color="primary"
              onClick={handleStartGame}
              disabled={selectedPlayerIds.length < 1}
              vibrationPattern={100}
              size="medium"
              fullWidth
            >
              Start Game
            </VibrationButton>

            <Button
              variant="outlined"
              onClick={() => setTabValue(0)}
              size="medium"
              fullWidth
            >
              Back to Game Settings
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Cricket;
