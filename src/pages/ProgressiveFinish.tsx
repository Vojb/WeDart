import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useProgressiveFinishStore } from "../store/useProgressiveFinishStore";
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
      id={`progressive-finish-setup-tabpanel-${index}`}
      aria-labelledby={`progressive-finish-setup-tab-${index}`}
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

const ProgressiveFinish: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { updateGameSettings, gameSettings, startGame, setPlayers } =
    useProgressiveFinishStore();
  const [tabValue, setTabValue] = useState(0);

  // Local state for form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingScore, setStartingScore] = useState(
    gameSettings.startingScore
  );
  const [maxFailures, setMaxFailures] = useState(gameSettings.maxFailures);
  const [dartLimit, setDartLimit] = useState(gameSettings.dartLimit);

  // Validation error state
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle form submission
  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    console.log("Starting 40 up game with players:", selectedPlayerIds);

    // Filter and prepare selected players
    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );

    console.log("Selected players:", selectedPlayers);

    if (selectedPlayers.length === 0) {
      setError("Error selecting players. Please try again.");
      return;
    }

    // Update game settings
    updateGameSettings({
      startingScore,
      maxFailures,
      dartLimit,
    });

    // Save selected players - create ProgressiveFinishPlayer objects
    const progressiveFinishPlayers = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      currentScore: 0,
      dartsThrown: 0,
      levelsCompleted: 0,
      totalDartsUsed: 0,
      scores: [],
      avgPerDart: 0,
      avgPerLevel: 0,
    }));
    setPlayers(progressiveFinishPlayers);

    // Start a new game
    startGame(selectedPlayerIds);

    // Navigate to game screen
    navigate("/progressive-finish/game");
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
          Progressive Finish Setup
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
            {/* Game Rules */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Typography variant="h6" gutterBottom>
                  How to Play
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="All players work together to reach the target score"
                      secondary="Each player's score reduces the remaining amount needed"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Progressive scoring - scores accumulate toward the target"
                      secondary="Success advances to next level (+10), failure decreases target by 1"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Dart limit increases at higher levels"
                      secondary="6 darts until level 100+, then 9 darts per level"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Game ends after too many failures"
                      secondary="Track your highest level reached as your score"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Game Settings
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Starting Score"
                    type="number"
                    value={startingScore}
                    onChange={(e) =>
                      setStartingScore(parseInt(e.target.value) || 40)
                    }
                    inputProps={{ min: 1, max: 100 }}
                    size="small"
                    helperText="Initial target score (default: 40)"
                  />
                  <TextField
                    label="Max Failures"
                    type="number"
                    value={maxFailures}
                    onChange={(e) =>
                      setMaxFailures(parseInt(e.target.value) || 3)
                    }
                    inputProps={{ min: 1, max: 10 }}
                    size="small"
                    helperText="Game ends after this many consecutive failures"
                  />
                  <TextField
                    label="Dart Limit"
                    type="number"
                    value={dartLimit}
                    onChange={(e) =>
                      setDartLimit(parseInt(e.target.value) || 6)
                    }
                    inputProps={{ min: 3, max: 12 }}
                    size="small"
                    helperText="Darts allowed per attempt (increases at level 100+)"
                  />
                </Stack>
              </CardContent>
            </Card>
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

export default ProgressiveFinish;
