import React from "react";
import { Box, Typography, Switch, FormControlLabel } from "@mui/material";
import VibrationButton from "./VibrationButton";
import { useStore } from "../store/useStore";

const VibrationButtonExample: React.FC = () => {
  const { vibrationEnabled, toggleVibration } = useStore();

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Vibration Feedback Examples</Typography>

      <FormControlLabel
        control={
          <Switch checked={vibrationEnabled} onChange={toggleVibration} />
        }
        label={`Vibration feedback is ${
          vibrationEnabled ? "enabled" : "disabled"
        }`}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Note: Vibration feedback only works on Android devices when using the
        PWA. It has no effect on iOS devices or desktop browsers.
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <VibrationButton
          variant="contained"
          color="primary"
          vibrationPattern={50}
        >
          Short Vibration (50ms)
        </VibrationButton>

        <VibrationButton
          variant="contained"
          color="secondary"
          vibrationPattern={100}
        >
          Medium Vibration (100ms)
        </VibrationButton>

        <VibrationButton
          variant="contained"
          color="error"
          vibrationPattern={200}
        >
          Long Vibration (200ms)
        </VibrationButton>

        <VibrationButton
          variant="contained"
          color="success"
          vibrationPattern={[50, 100, 50]}
        >
          Pattern Vibration
        </VibrationButton>
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        To use vibration feedback in your app, replace standard Material-UI
        Button components with the VibrationButton component. All regular Button
        props are supported.
      </Typography>
    </Box>
  );
};

export default VibrationButtonExample;
