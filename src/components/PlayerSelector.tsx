import React from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  alpha,
  Badge,
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
      // If already selected, remove from selection and maintain order of remaining players
      const newSelection = selectedPlayerIds.filter((id) => id !== playerId);
      onSelectionChange(newSelection);
    } else {
      // If not selected and haven't reached max players, add to selection at the end
      if (selectedPlayerIds.length < maxPlayers) {
        // Append to the end to maintain selection order
        const newSelection = [...selectedPlayerIds, playerId];
        onSelectionChange(newSelection);
      }
    }
  };

  return (
    <Grid container spacing={1}>
      {players.length === 0 ? (
        <Grid item xs={4}>
          <Typography color="text.secondary">
            No players found. Please create players in the Players section.
          </Typography>
        </Grid>
      ) : (
        players.map((player) => {
          const isSelected = selectedPlayerIds.includes(player.id);
          // Get the index in the selection array to show correct order
          const selectionIndex = selectedPlayerIds.indexOf(player.id);

          return (
            <Grid item xs={3} sm={4} md={4} key={player.id}>
              <Card
                sx={{
                  border: isSelected ? 2 : 0,
                  borderColor: "primary.main",
                  bgcolor: isSelected
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : "background.paper",
                  position: "relative",
                }}
              >
                <CardActionArea onClick={() => togglePlayer(player.id)}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {isSelected ? (
                        <Badge
                          badgeContent={selectionIndex + 1}
                          color="secondary"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "1rem",
                              height: "24px",
                              width: "24px",
                              borderRadius: "12px",
                            },
                          }}
                        >
                          <PersonIcon
                            color="primary"
                            sx={{ fontSize: 24, mb: 1 }}
                          />
                        </Badge>
                      ) : (
                        <PersonIcon
                          color="action"
                          sx={{ fontSize: 24, mb: 1 }}
                        />
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: isSelected ? "bold" : "normal",
                          mt: 1,
                        }}
                        align="center"
                      >
                        {player.name}
                        {isSelected && (
                          <Typography
                            component="span"
                            color="primary"
                            sx={{
                              ml: 0.5,
                              fontSize: "0.8em",
                              fontWeight: "normal",
                            }}
                          >
                            (#{selectionIndex + 1})
                          </Typography>
                        )}
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

      <Grid item xs={4}>
        <Typography variant="caption" color="text.secondary">
          {selectedPlayerIds.length} of {maxPlayers} players selected
          {minPlayers > 0 && ` (minimum ${minPlayers})`}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PlayerSelector;
