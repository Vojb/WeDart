import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Dialog,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  SportsEsports as GameIcon,
  SportsBar as CricketIcon,
  VisibilityOff as HiddenCricketIcon,
  CallSplit as HalveItIcon,
  FitnessCenter as WarmupIcon,
} from "@mui/icons-material";

interface GamePickerDialogProps {
  open: boolean;
  onClose: () => void;
}

const GAME_OPTIONS = [
  { title: "X01", description: "301, 501, 701 or custom", path: "/x01", icon: <GameIcon /> },
  { title: "Cricket", description: "Close 15–20 and Bull", path: "/cricket", icon: <CricketIcon /> },
  { title: "Hidden Cricket", description: "Cricket with secret numbers", path: "/hidden-cricket", icon: <HiddenCricketIcon /> },
  { title: "Halve It", description: "Miss and your score is halved", path: "/halveit", icon: <HalveItIcon /> },
  { title: "Warmup", description: "Practice your targets", path: "/warmup", icon: <WarmupIcon /> },
];

const GamePickerDialog: React.FC<GamePickerDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Choose a game</DialogTitle>
      <List sx={{ pt: 0, pb: 1 }}>
        {GAME_OPTIONS.map((game) => (
          <ListItemButton key={game.path} onClick={() => handleSelect(game.path)}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: "primary.main", color: "white" }}>
                {game.icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={game.title} secondary={game.description} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
};

export default GamePickerDialog;
