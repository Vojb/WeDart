import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NewGame() {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState("501");
  const [players, setPlayers] = useState("1");

  const handleGameTypeChange = (event: SelectChangeEvent) => {
    setGameType(event.target.value);
  };

  const handlePlayersChange = (event: SelectChangeEvent) => {
    setPlayers(event.target.value);
  };

  const handleStartGame = () => {
    // TODO: Initialize game state and navigate to game page
    navigate("/x01/game");
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Typography variant="h4" gutterBottom>
          New Game
        </Typography>
        <Stack spacing={3} sx={{ maxWidth: 400, mt: 3 }}>
          <FormControl fullWidth>
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

          <FormControl fullWidth>
            <InputLabel id="players-label">Players</InputLabel>
            <Select
              labelId="players-label"
              id="players"
              value={players}
              label="Players"
              onChange={handlePlayersChange}
            >
              <MenuItem value="1">1 Player</MenuItem>
              <MenuItem value="2">2 Players</MenuItem>
              <MenuItem value="3">3 Players</MenuItem>
              <MenuItem value="4">4 Players</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="large"
            onClick={handleStartGame}
            sx={{ mt: 2 }}
          >
            Start Game
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
