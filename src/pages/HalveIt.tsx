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
import { useHalveItStore, updateCachedHalveItPlayers } from "../store/useHalveItStore";
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
      id={`halveit-setup-tabpanel-${index}`}
      aria-labelledby={`halveit-setup-tab-${index}`}
      {...other}
      style={{
        height: "100%",
        display: value !== index ? "none" : "flex",
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

const HalveIt: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { startGame, setHalveItPlayers } = useHalveItStore();
  const [tabValue, setTabValue] = useState(0);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [mode, setMode] = useState<"default" | "41">("default");
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );

    if (selectedPlayers.length === 0) {
      setError("Error selecting players. Please try again.");
      return;
    }

    const simplePlayers = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    setHalveItPlayers(simplePlayers);
    updateCachedHalveItPlayers(simplePlayers);

    startGame(mode, selectedPlayerIds);

    navigate("/halveit/game");
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
          Halve It Setup
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
                    Game Mode
                  </FormLabel>
                  <RadioGroup
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "default" | "41")}
                  >
                    <FormControlLabel
                      value="default"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            Default
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            10 rounds: Scoring, 15, 16, Double, 17, 18, Treble, 19, 20, Bullseye
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 0.5 }}
                    />
                    <FormControlLabel
                      value="41"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            41
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            8 rounds: 19, 18, Double, 17, Target Score 41, Treble, 20, Bulls
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
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

export default HalveIt;


