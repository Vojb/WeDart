import { create } from "zustand";
import { PaletteMode } from "@mui/material";
import { persist } from "zustand/middleware";
import { Player } from "./useX01Store"; // Import player type from X01 store

// Define predefined theme options
export interface ThemeColors {
  // Dark mode colors
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning?: string;
  info?: string;
  background: {
    default: string;
    paper: string;
  };
  text?: {
    primary?: string;
    secondary?: string;
    disabled?: string;
  };
  divider?: string;

  // Light mode colors
  light?: {
    primary: string;
    secondary: string;
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    background: {
      default: string;
      paper: string;
    };
    text?: {
      primary?: string;
      secondary?: string;
      disabled?: string;
    };
    divider?: string;
  };
}

export interface ThemeOption {
  id: string;
  name: string;
  colors: ThemeColors;
}

// Predefined theme options
export const predefinedThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    colors: {
      primary: "#1976d2", // MUI default blue
      secondary: "#9c27b0", // MUI default purple
      success: "#2e7d32", // MUI default green
      error: "#d32f2f", // MUI default red
      background: {
        default: "#121212", // Dark background
        paper: "#1e1e1e", // Dark paper
      },
      // Light mode variant
      light: {
        primary: "#0d47a1", // Darker blue for light mode
        secondary: "#7b1fa2", // Darker purple for light mode
        success: "#2e7d32", // Same green for light mode
        error: "#c62828", // Slightly darker red for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  {
    id: "dartboard",
    name: "Dartboard",
    colors: {
      primary: "#1b5e20", // Dark green
      secondary: "#d32f2f", // Red
      success: "#33691e", // Very dark green
      error: "#b71c1c", // Dark red
      background: {
        default: "#0a0a0a", // Deeper dark background
        paper: "#1a1a1a", // Darker paper
      },
      // Light mode variant
      light: {
        primary: "#004d40", // Darker green for light mode
        secondary: "#b71c1c", // Darker red for light mode
        success: "#33691e", // Same very dark green
        error: "#b71c1c", // Same dark red
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  {
    id: "electric",
    name: "Electric",
    colors: {
      primary: "#6200ea", // Deep purple
      secondary: "#00bfa5", // Teal accent
      success: "#64dd17", // Light green accent
      error: "#ff1744", // Accent red
      background: {
        default: "#0d0221", // Deep purple background
        paper: "#1a1a2e", // Dark blue paper
      },
      // Light mode variant
      light: {
        primary: "#4a148c", // Darker purple for light mode
        secondary: "#00796b", // Darker teal for light mode
        success: "#33691e", // Darker green for light mode
        error: "#d50000", // Darker red for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      primary: "#ff9800", // Orange
      secondary: "#e91e63", // Pink
      success: "#8bc34a", // Light green
      error: "#f44336", // Red
      background: {
        default: "#190a05", // Dark brown background
        paper: "#251e18", // Dark brown paper
      },
      // Light mode variant
      light: {
        primary: "#e65100", // Darker orange for light mode
        secondary: "#c2185b", // Darker pink for light mode
        success: "#558b2f", // Darker green for light mode
        error: "#c62828", // Darker red for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      primary: "#00838f", // Teal
      secondary: "#00796b", // Dark teal
      success: "#00897b", // Teal
      error: "#e64a19", // Dark orange
      background: {
        default: "#002147", // Deep navy background
        paper: "#0a3060", // Navy paper
      },
      // Light mode variant
      light: {
        primary: "#006064", // Darker teal for light mode
        secondary: "#004d40", // Darker teal for light mode
        success: "#00695c", // Darker teal for light mode
        error: "#bf360c", // Darker orange for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  // New unicorn theme
  {
    id: "unicorn",
    name: "Magical Unicorn",
    colors: {
      primary: "#FF6AD5", // Bright pink
      secondary: "#8A2BE2", // Violet
      success: "#64FFDA", // Aqua
      error: "#FF4081", // Pink accent
      background: {
        default: "#2C0A37", // Deep purple background
        paper: "#3B1A4A", // Lighter purple paper
      },
      // Light mode variant
      light: {
        primary: "#C2185B", // Darker pink for light mode
        secondary: "#6A1B9A", // Darker violet for light mode
        success: "#00BFA5", // Darker aqua for light mode
        error: "#D81B60", // Darker pink for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  // New neon theme
  {
    id: "neon",
    name: "Neon Nights",
    colors: {
      primary: "#00FF9F", // Bright green
      secondary: "#FF00E4", // Bright pink
      success: "#00FFFF", // Cyan
      error: "#FF003C", // Bright red
      background: {
        default: "#000B14", // Very dark blue background
        paper: "#001524", // Dark blue paper
      },
      // Light mode variant
      light: {
        primary: "#00BFA5", // Darker neon green for light mode
        secondary: "#D500F9", // Darker neon pink for light mode
        success: "#00B8D4", // Darker cyan for light mode
        error: "#D50000", // Darker red for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  // New retro theme
  {
    id: "retro",
    name: "Retro Arcade",
    colors: {
      primary: "#FFD700", // Gold
      secondary: "#FF6347", // Tomato
      success: "#32CD32", // Lime green
      error: "#DC143C", // Crimson
      background: {
        default: "#000000", // Black background
        paper: "#1C1C1C", // Very dark gray paper
      },
      // Light mode variant
      light: {
        primary: "#FFC107", // Amber for light mode
        secondary: "#F4511E", // Darker tomato for light mode
        success: "#2E7D32", // Darker lime green for light mode
        error: "#B71C1C", // Darker crimson for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
  // New nature theme
  {
    id: "forest",
    name: "Enchanted Forest",
    colors: {
      primary: "#4CAF50", // Green
      secondary: "#8D6E63", // Brown
      success: "#81C784", // Light green
      error: "#E57373", // Light red
      background: {
        default: "#1B2D2A", // Dark forest green background
        paper: "#2D403C", // Lighter forest green paper
      },
      // Light mode variant
      light: {
        primary: "#2E7D32", // Darker green for light mode
        secondary: "#5D4037", // Darker brown for light mode
        success: "#388E3C", // Darker green for light mode
        error: "#C62828", // Darker red for light mode
        background: {
          default: "#f5f5f5", // Light background
          paper: "#ffffff", // White paper
        },
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
        },
        divider: "rgba(0, 0, 0, 0.12)",
      },
    },
  },
];

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
  themeMode: PaletteMode;
  toggleTheme: () => void;
  players: Player[];
  addPlayer: (name: string) => void;
  editPlayer: (id: number, name: string) => void;
  removePlayer: (id: number) => void;

  // Theme color management
  themeColors: ThemeColors;
  setThemeColors: (colors: ThemeColors) => void;

  // Current theme selection
  currentThemeId: string;
  setCurrentTheme: (themeId: string) => void;

  // Vibration settings
  vibrationEnabled: boolean;
  toggleVibration: () => void;

  // Sticky activation state - tracks if user has interacted with the page
  hasUserActivation: boolean;
  setUserActivation: (activated: boolean) => void;
}

// Restore persist middleware for saving data in localStorage
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      themeMode: "dark",
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "dark" ? "light" : "dark",
        })),
      players: [],
      addPlayer: (name: string) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              id: Date.now(),
              name,
              games: 0,
              average: 0,
              totalDartsThrown: 0,
              totalPointsScored: 0,
              dartHits: {}, // Initialize empty dart hits object
            },
          ],
        })),
      editPlayer: (id: number, name: string) =>
        set((state) => ({
          players: state.players.map((player) =>
            player.id === id ? { ...player, name } : player
          ),
        })),
      removePlayer: (id: number) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        })),

      themeColors: loadThemeColors() || {
        primary: "#1976d2", // Default MUI blue
        secondary: "#9c27b0", // Default MUI purple
        success: "#2e7d32", // Default MUI green
        error: "#d32f2f", // Default MUI red
        background: {
          default: "#121212", // Dark background
          paper: "#1e1e1e", // Dark paper
        },
      },

      setThemeColors: (colors: ThemeColors) => {
        // Save to localStorage for persistence
        localStorage.setItem("themeColors", JSON.stringify(colors));

        // Update the store
        set({ themeColors: colors });
      },

      // Initialize current theme ID (default or from saved theme)
      currentThemeId: loadCurrentThemeId() || "default",

      // Set current theme by ID
      setCurrentTheme: (themeId: string) => {
        // Find the theme by ID
        const theme = predefinedThemes.find((theme) => theme.id === themeId);

        if (theme) {
          // Save the theme ID
          localStorage.setItem("currentThemeId", themeId);

          // Update store with theme colors and ID
          set({
            currentThemeId: themeId,
            themeColors: theme.colors,
          });
        }
      },

      // Vibration settings - enabled by default
      vibrationEnabled: true,
      toggleVibration: () => {
        let newVibrationEnabled = false;

        set((state) => {
          newVibrationEnabled = !state.vibrationEnabled;
          return {
            ...state,
            vibrationEnabled: newVibrationEnabled,
          };
        });

        // Force a small test vibration when enabled to "wake up" the vibration API
        if (newVibrationEnabled && typeof navigator.vibrate === "function") {
          try {
            navigator.vibrate([1]);
            setTimeout(() => navigator.vibrate([10]), 50);
          } catch (e) {
            console.error("Failed to initialize vibration:", e);
          }
        }
      },

      // Sticky activation state - tracks if user has interacted with the page
      hasUserActivation: false,
      setUserActivation: (activated: boolean) =>
        set((state) => ({
          ...state,
          hasUserActivation: activated,
        })),
    }),
    {
      name: "wedart-main-storage",
      version: 1,
      partialize: (state) => ({
        // Only persist these items from the state
        themeMode: state.themeMode,
        players: state.players,
        themeColors: state.themeColors,
        currentThemeId: state.currentThemeId,
        vibrationEnabled: state.vibrationEnabled,
        hasUserActivation: state.hasUserActivation,
      }),
    }
  )
);

function loadThemeColors(): ThemeColors | null {
  try {
    const savedThemeColors = localStorage.getItem("themeColors");
    if (savedThemeColors) {
      return JSON.parse(savedThemeColors);
    }
  } catch (error) {
    console.error("Error loading theme colors from localStorage:", error);
  }
  return null;
}

function loadCurrentThemeId(): string | null {
  try {
    return localStorage.getItem("currentThemeId");
  } catch (error) {
    console.error("Error loading current theme ID from localStorage:", error);
  }
  return null;
}
