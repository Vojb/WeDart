import React from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  alpha,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { Player } from "../store/useX01Store";

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  minPlayers?: number;
  maxPlayers?: number;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerIds,
  onSelectionChange,
  minPlayers = 1,
  maxPlayers = 4,
}) => {
  // Handle player selection/deselection
  const togglePlayer = (playerId: number) => {
    const isSelected = selectedPlayerIds.includes(playerId);

    if (isSelected) {
      // If already selected, remove from selection
      const newSelection = selectedPlayerIds.filter((id) => id !== playerId);
      onSelectionChange(newSelection);
    } else {
      // If not selected and haven't reached max players, add to selection
      if (selectedPlayerIds.length < maxPlayers) {
        const newSelection = [...selectedPlayerIds, playerId];
        onSelectionChange(newSelection);
      }
    }
  };

  return (
    <Grid container spacing={2}>
      {players.length === 0 ? (
        <Grid item xs={12}>
          <Typography color="text.secondary">
            No players found. Please create players in the Players section.
          </Typography>
        </Grid>
      ) : (
        players.map((player) => {
          const isSelected = selectedPlayerIds.includes(player.id);

          return (
            <Grid item xs={6} sm={4} md={3} key={player.id}>
              <Card
                sx={{
                  border: isSelected ? 2 : 0,
                  borderColor: "primary.main",
                  bgcolor: isSelected
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : "background.paper",
                }}
              >
                <CardActionArea onClick={() => togglePlayer(player.id)}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <PersonIcon
                        color={isSelected ? "primary" : "action"}
                        sx={{ fontSize: 40, mb: 1 }}
                      />
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: isSelected ? "bold" : "normal" }}
                        align="center"
                      >
                        {player.name}
                      </Typography>
                      {player.games > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          align="center"
                        >
                          Avg: {player.average.toFixed(1)} • Games:{" "}
                          {player.games}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })
      )}

      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">
          {selectedPlayerIds.length} of {maxPlayers} players selected
          {minPlayers > 0 && ` (minimum ${minPlayers})`}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PlayerSelector;
