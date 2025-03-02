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
  const { vibrationEnabled, hasUserActivation, setUserActivation } = useStore();

  // Use a ref to check if the first vibration attempt failed
  const isAndroid = /android/i.test(navigator.userAgent);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Always set sticky activation on click
    if (!hasUserActivation) {
      setUserActivation(true);
    }

    // Debug vibration status
    console.log("Vibration button clicked");
    console.log("Vibration enabled:", vibrationEnabled);
    console.log("Vibration pattern:", vibrationPattern);
    console.log("Is Android device:", isAndroid);
    console.log("Has user activation:", hasUserActivation);
    console.log(
      "Navigator.vibrate available:",
      typeof navigator.vibrate === "function"
    );

    // Trigger vibration if enabled
    if (vibrationEnabled) {
      console.log("Attempting to vibrate...");
      // Prioritize pattern vibration for Android compatibility
      vibrateDevice(vibrationPattern);

      // Some Android devices require a double trigger
      if (isAndroid) {
        setTimeout(() => {
          vibrateDevice(vibrationPattern);
        }, 10);
      }
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
