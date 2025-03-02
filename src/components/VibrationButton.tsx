import React from "react";
import { Button, ButtonProps } from "@mui/material";
import { vibrateDevice } from "../theme/ThemeProvider";
import { useStore } from "../store/useStore";

// Extend ButtonProps with optional vibration settings
interface VibrationButtonProps extends ButtonProps {
  vibrationPattern?: number | number[]; // Duration in ms or pattern array
}

/**
 * Button component with haptic feedback (vibration) on click
 * Uses the Vibration API available on Android devices
 */
const VibrationButton: React.FC<VibrationButtonProps> = ({
  vibrationPattern = 50, // Default short vibration
  onClick,
  children,
  ...props
}) => {
  // Get vibration enabled setting from store
  const { vibrationEnabled } = useStore();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Debug vibration status
    console.log("Vibration button clicked");
    console.log("Vibration enabled:", vibrationEnabled);
    console.log("Vibration pattern:", vibrationPattern);
    console.log("Navigator.vibrate available:", !!navigator.vibrate);

    // Trigger vibration if enabled
    if (vibrationEnabled) {
      console.log("Attempting to vibrate...");
      // Use type assertion to resolve TypeScript error
      vibrateDevice(vibrationPattern as number);
    }

    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

export default VibrationButton;
