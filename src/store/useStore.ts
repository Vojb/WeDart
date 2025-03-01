import { create } from "zustand";
import { PaletteMode } from "@mui/material";
import { persist } from "zustand/middleware";
import { Player } from "./useX01Store"; // Import player type from X01 store

interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
}

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
      },

      setThemeColors: (colors: ThemeColors) => {
        // Save to localStorage for persistence
        localStorage.setItem("themeColors", JSON.stringify(colors));

        // Update the store
        set({ themeColors: colors });
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
    return null;
  } catch (error) {
    console.error("Failed to load theme colors from localStorage:", error);
    return null;
  }
}
