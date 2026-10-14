import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { ExitToApp } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";

interface LeaveGameDialogProps {
  open: boolean;
  onCancel: () => void;
  onSaveAndLeave: () => void;
  onDelete: () => void;
}

const LeaveGameDialog: React.FC<LeaveGameDialogProps> = ({
  open,
  onCancel,
  onSaveAndLeave,
  onDelete,
}) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
      <ExitToApp color="warning" sx={{ mr: 1 }} />
      Leave Game?
    </DialogTitle>
    <DialogContent>
      <Typography variant="body1">
        The game is saved, so you can continue it later from Ongoing games.
        Delete it if you don't want to finish it.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
      <VibrationButton onClick={onCancel} vibrationPattern={50}>
        Cancel
      </VibrationButton>
      <VibrationButton
        onClick={onDelete}
        color="error"
        vibrationPattern={[50, 100, 50]}
      >
        Delete game
      </VibrationButton>
      <VibrationButton
        onClick={onSaveAndLeave}
        variant="contained"
        vibrationPattern={50}
      >
        Save & leave
      </VibrationButton>
    </DialogActions>
  </Dialog>
);

export default LeaveGameDialog;
