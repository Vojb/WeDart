import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useHalfItStore } from "../store/useHalfItStore";
import PlayerSelector from "../components/PlayerSelector";
import VibrationButton from "../components/VibrationButton";

const HalfIt: React.FC = () => {
  const navigate = useNavigate();
  const { players } = useStore();
  const { startGame, customSequence, setHalfItPlayers } = useHalfItStore();

  // Local state for form values
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);

  // Validation error state
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleStartGame = () => {
    if (selectedPlayerIds.length < 1) {
      setError("Please select at least one player");
      return;
    }

    console.log("Starting Half-It game with players:", selectedPlayerIds);

    // Filter and prepare selected players
    const selectedPlayers = players.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );

    console.log("Selected players:", selectedPlayers);

    if (selectedPlayers.length === 0) {
      setError("Error selecting players. Please try again.");
      return;
    }

    // Save selected players
    const simplePlayers = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
    }));
    setHalfItPlayers(simplePlayers);

    // Start a new game with the selected players
    startGame(selectedPlayerIds);

    // Navigate to game screen
    navigate("/halfit/game");
  };

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      <Paper
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Half-It Setup
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          In Half-It, players aim at a sequence of targets. Miss the target and
          your score is halved!
        </Typography>

        {/* Game Sequence */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Game Sequence
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                You'll play the following sequence:
              </Typography>
              <List dense>
                {customSequence.map((round, index) => (
                  <ListItem
                    key={index}
                    divider={index < customSequence.length - 1}
                  >
                    <ListItemText
                      primary={`Round ${index + 1}: ${round.description}`}
                      secondary={
                        round.multiplier > 1
                          ? `Score ${round.multiplier}x the number you hit`
                          : undefined
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Player Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Players
          </Typography>
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

export default HalfIt;
