import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  alpha,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Person as PersonIcon, Add as AddIcon } from "@mui/icons-material";
import { Player } from "../store/useX01Store";
import { useStore } from "../store/useStore";
import VibrationButton from "./VibrationButton";

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
  const { addPlayer } = useStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const creatingPlayerRef = useRef<string | null>(null);

  // Auto-select newly created player
  useEffect(() => {
    if (creatingPlayerRef.current && players.length > 0) {
      const newPlayer = players.find(
        (p) => p.name === creatingPlayerRef.current && !selectedPlayerIds.includes(p.id)
      );
      if (newPlayer && selectedPlayerIds.length < maxPlayers) {
        const newSelection = [...selectedPlayerIds, newPlayer.id];
        onSelectionChange(newSelection);
        creatingPlayerRef.current = null;
      }
    }
  }, [players, selectedPlayerIds, maxPlayers, onSelectionChange]);

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

  const handleCreatePlayer = () => {
    if (newPlayerName.trim()) {
      const playerName = newPlayerName.trim();
      creatingPlayerRef.current = playerName;
      addPlayer(playerName);
      setNewPlayerName("");
      setShowCreateDialog(false);
    }
  };

  const handleOpenCreateDialog = () => {
    if (selectedPlayerIds.length < maxPlayers) {
      setShowCreateDialog(true);
    }
  };

  return (
    <>
      <Grid container spacing={1}>
        {players.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No players found. Create a new player below or go to the Players section.
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

        {/* Create New Player Card */}
        {selectedPlayerIds.length < maxPlayers && (
          <Grid item xs={3} sm={4} md={4}>
            <Card
              sx={{
                border: 2,
                borderColor: "primary.main",
                borderStyle: "dashed",
                bgcolor: "background.paper",
                opacity: 0.7,
                "&:hover": {
                  opacity: 1,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <CardActionArea onClick={handleOpenCreateDialog}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <AddIcon
                      color="primary"
                      sx={{ fontSize: 24, mb: 1 }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 1,
                        color: "primary.main",
                        fontWeight: "medium",
                      }}
                      align="center"
                    >
                      Create New Player
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            {selectedPlayerIds.length} of {maxPlayers} players selected
            {minPlayers > 0 && ` (minimum ${minPlayers})`}
          </Typography>
        </Grid>
      </Grid>

      {/* Create Player Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setNewPlayerName("");
        }}
        aria-labelledby="create-player-dialog-title"
      >
        <DialogTitle id="create-player-dialog-title">
          Create New Player
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            fullWidth
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newPlayerName.trim()) {
                handleCreatePlayer();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <VibrationButton
            onClick={() => {
              setShowCreateDialog(false);
              setNewPlayerName("");
            }}
            vibrationPattern={50}
          >
            Cancel
          </VibrationButton>
          <VibrationButton
            onClick={handleCreatePlayer}
            color="primary"
            variant="contained"
            disabled={!newPlayerName.trim()}
            vibrationPattern={100}
          >
            Create
          </VibrationButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlayerSelector;
