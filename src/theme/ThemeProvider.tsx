import React, { ReactNode, useMemo, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { useStore } from "../store/useStore";

// Update the vibrateDevice function to use sticky activation
export const vibrateDevice = (pattern: number | number[]): boolean => {
  console.log("[Vibration] Requested pattern:", pattern);

  // Get store state directly (can't use hooks outside components)
  // @ts-ignore - Accessing the store directly
  const state = window.__ZUSTAND_STATE__?.state;
  const vibrationEnabled = state?.vibrationEnabled !== false; // Default to true if can't access state
  const hasActivation = state?.hasUserActivation === true;

  console.log("[Vibration] Vibration enabled:", vibrationEnabled);
  console.log("[Vibration] Has user activation:", hasActivation);

  // Skip if vibration is disabled in settings
  if (!vibrationEnabled) {
    console.log("[Vibration] Vibration disabled in settings");
    return false;
  }

  // Check if the device supports vibration
  if (typeof navigator.vibrate !== "function") {
    console.log(
      "[Vibration] Vibration API not supported in this browser/device"
    );
    return false;
  }

  // Chrome on Android requires the pattern to be an array
  const vibrationPattern = Array.isArray(pattern) ? pattern : [pattern];

  try {
    const result = navigator.vibrate(vibrationPattern);
    console.log("[Vibration] Vibration call result:", result);

    // Try a slightly delayed follow-up vibration (helps on some Android devices)
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
  const { themeColors, themeMode, setUserActivation, hasUserActivation } =
    useStore();

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

  // Setup sticky activation detection
  useEffect(() => {
    // List of events that would trigger user activation
    const activatingEvents = ["click", "keydown", "touchstart", "pointerdown"];

    // Handler to set sticky activation state
    const activationHandler = () => {
      if (!hasUserActivation) {
        console.log(
          "[Activation] User activation detected - enabling sticky activation"
        );
        setUserActivation(true);

        // Try to wake up the vibration API with a minimal vibration (will only work on Android)
        if (typeof navigator.vibrate === "function") {
          try {
            navigator.vibrate(1);
          } catch (e) {
            console.error("[Activation] Failed to test vibration:", e);
          }
        }

        // Remove event listeners after first activation
        activatingEvents.forEach((eventType) => {
          window.removeEventListener(eventType, activationHandler);
        });
      }
    };

    // Add activation event listeners
    activatingEvents.forEach((eventType) => {
      window.addEventListener(eventType, activationHandler, { passive: true });
    });

    // Cleanup
    return () => {
      activatingEvents.forEach((eventType) => {
        window.removeEventListener(eventType, activationHandler);
      });
    };
  }, [hasUserActivation, setUserActivation]);

  // Add effect to handle service worker and offline status
  useEffect(() => {
    // Check if service worker is active
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log("Service Worker is ready:", registration.active?.state);

          // When the service worker is ready, we can notify that the app is offline-ready
          if (registration.active) {
            setTimeout(() => {
              // Send message to components that care about offline status
              window.dispatchEvent(new CustomEvent("offlineReady"));
            }, 1000);
          }
        })
        .catch((err) => {
          console.error("Service Worker error:", err);
        });

      // Handle online/offline status
      const handleOnlineStatus = () => {
        console.log("Network status changed. Online:", navigator.onLine);
      };

      window.addEventListener("online", handleOnlineStatus);
      window.addEventListener("offline", handleOnlineStatus);

      return () => {
        window.removeEventListener("online", handleOnlineStatus);
        window.removeEventListener("offline", handleOnlineStatus);
      };
    }
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
