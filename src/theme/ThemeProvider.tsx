import React, { ReactNode, useMemo, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useStore } from "../store/useStore";

// Add vibration utility function
export const vibrateDevice = (pattern: number | number[] = 100) => {
  console.log("[Vibration] Vibration requested with pattern:", pattern);

  // Check if the device supports vibration
  if (typeof navigator.vibrate !== "function") {
    console.log(
      "[Vibration] Vibration API not supported in this browser/device"
    );
    return false;
  }

  // Chrome on Android requires the pattern to be an array
  // Convert single number to array if it's not already
  const vibrationPattern = Array.isArray(pattern) ? pattern : [pattern];

  try {
    // Attempt to vibrate with the processed pattern
    // Explicitly call with array pattern for better Android compatibility
    const result = navigator.vibrate(vibrationPattern);
    console.log("[Vibration] Vibration call result:", result);

    // Force a backup vibration approach as some Android devices need additional prompting
    setTimeout(() => {
      navigator.vibrate(0); // Stop any current vibration
      navigator.vibrate(vibrationPattern); // Try again
    }, 5);

    return result;
  } catch (error) {
    console.error("[Vibration] Error when trying to vibrate:", error);
    return false;
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { themeColors, themeMode } = useStore();

  // Verify theme loading on component mount (for debugging)
  useEffect(() => {
    // Check if theme colors were loaded from localStorage
    const storedTheme = localStorage.getItem("wedart-storage");
    if (storedTheme) {
      console.log("Theme successfully loaded from localStorage");
    } else {
      console.log("No stored theme found in localStorage, using defaults");
    }

    // Log the current theme values being applied
    console.log("Current theme mode:", themeMode);
    console.log("Current theme colors:", themeColors);
  }, []);

  // Add effect to detect PWA installation
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("PWA was installed");
      // Vibrate when app is installed (200ms vibration)
      vibrateDevice(200);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Create a theme instance with our custom colors and mode
  const theme = useMemo(() => {
    console.log("Creating theme with colors:", themeColors);

    const baseTheme = createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: themeColors?.primary || "#1976d2",
        },
        secondary: {
          main: themeColors?.secondary || "#9c27b0",
        },
        success: {
          main: themeColors?.success || "#2e7d32",
        },
        error: {
          main: themeColors?.error || "#d32f2f",
        },
        background: {
          default:
            themeColors?.background?.default ||
            (themeMode === "dark" ? "#121212" : "#f5f5f5"),
          paper:
            themeColors?.background?.paper ||
            (themeMode === "dark" ? "#1e1e1e" : "#ffffff"),
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
              borderRadius: 8,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            rounded: {
              borderRadius: 12,
            },
          },
        },
      },
    });

    // Make fonts responsive
    return responsiveFontSizes(baseTheme);
  }, [themeColors, themeMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
