import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";
import { useStore } from "../store/useStore";
import VibrationButton from "../components/VibrationButton";

const Players: React.FC = () => {
  const { players, addPlayer, editPlayer, removePlayer } = useStore();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const handleEditSubmit = () => {
    if (editingPlayer && editingPlayer.name.trim()) {
      editPlayer(editingPlayer.id, editingPlayer.name.trim());
      setEditingPlayer(null);
    }
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h4" gutterBottom>
          Players
        </Typography>

        <Box sx={{ mb: 3, display: "flex", gap: 1 }}>
          <TextField
            label="New Player Name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
          />
          <VibrationButton
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim()}
            vibrationPattern={100}
          >
            Add Player
          </VibrationButton>
        </Box>

        <List sx={{ width: "100%", flexGrow: 1, overflow: "auto" }}>
          {players.map((player) => (
            <ListItem
              key={player.id}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() =>
                      setEditingPlayer({ id: player.id, name: player.name })
                    }
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removePlayer(player.id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={player.name}
                secondary={`Games: ${player.games} | Average: ${player.average}`}
              />
            </ListItem>
          ))}
        </List>

        <Dialog open={!!editingPlayer} onClose={() => setEditingPlayer(null)}>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Player Name"
              fullWidth
              value={editingPlayer?.name || ""}
              onChange={(e) =>
                setEditingPlayer((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              onKeyPress={(e) => e.key === "Enter" && handleEditSubmit()}
            />
          </DialogContent>
          <DialogActions>
            <VibrationButton
              onClick={() => setEditingPlayer(null)}
              vibrationPattern={50}
            >
              Cancel
            </VibrationButton>
            <VibrationButton
              onClick={handleEditSubmit}
              color="primary"
              variant="contained"
              disabled={!editingPlayer?.name.trim()}
              vibrationPattern={100}
            >
              Save
            </VibrationButton>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Players;
