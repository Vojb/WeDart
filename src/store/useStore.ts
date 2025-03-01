import { create } from "zustand";
import { PaletteMode } from "@mui/material";
import { persist } from "zustand/middleware";
import { Player } from "./useX01Store"; // Import player type from X01 store

// Define predefined theme options
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  background: {
    default: string;
    paper: string;
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
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      primary: "#0d47a1", // Dark blue
      secondary: "#00796b", // Dark teal
      success: "#00897b", // Teal
      error: "#e64a19", // Dark orange
      background: {
        default: "#002147", // Deep navy background
        paper: "#0a3060", // Navy paper
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
