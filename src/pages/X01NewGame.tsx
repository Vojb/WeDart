import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useX01Store } from "../store/useX01Store";
import React from "react";
import VibrationButton from "../components/VibrationButton";

const X01NewGame: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { gameSettings, updateGameSettings, startGame, setPlayers } =
    useX01Store();
  const [gameType, setGameType] = useState("501");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Update X01Store with players from main store
  useEffect(() => {
    setPlayers(players);
  }, [players, setPlayers]);

  const handleGameTypeChange = (event: SelectChangeEvent) => {
    setGameType(event.target.value);
  };

  const handlePlayersChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedPlayers(
      typeof event.target.value === "string"
        ? event.target.value.split(",")
        : event.target.value
    );
  };

  const handleStartGame = () => {
    startGame(
      gameType as "301" | "501" | "701",
      selectedPlayers.map((id) => parseInt(id))
    );
    navigate("/x01/game");
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 2, height: "100%" }}>
        <Typography variant="h5" gutterBottom>
          New X01 Game
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: "100%",
            width: "100%",
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel id="game-type-label">Game Type</InputLabel>
              <Select
                labelId="game-type-label"
                id="game-type"
                value={gameType}
                label="Game Type"
                onChange={handleGameTypeChange}
              >
                <MenuItem value="301">301</MenuItem>
                <MenuItem value="501">501</MenuItem>
                <MenuItem value="701">701</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 2 }}>
              <InputLabel id="players-label">Players</InputLabel>
              <Select
                labelId="players-label"
                id="players"
                multiple
                value={selectedPlayers}
                label="Players"
                onChange={handlePlayersChange}
              >
                {players.map((player) => (
                  <MenuItem key={player.id} value={player.id.toString()}>
                    {player.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "flex-start",
            }}
          >
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
          </Box>

          <VibrationButton
            variant="contained"
            size="large"
            onClick={handleStartGame}
            disabled={selectedPlayers.length === 0}
            sx={{ mt: 1 }}
            vibrationPattern={100}
          >
            Start Game
          </VibrationButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default X01NewGame;
