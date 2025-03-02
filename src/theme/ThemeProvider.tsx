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
  if (
    navigator.vibrate &&
    window.matchMedia("(prefers-reduced-motion: no-preference)").matches
  ) {
    navigator.vibrate(pattern);
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
