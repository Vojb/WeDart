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

// Add microphone permission settings interface
export interface PermissionSettings {
  microphone: {
    enabled: boolean;
    lastChecked: number | null;
  };
}

// Predefined theme options
export const predefinedThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Dark Dartboard",
    colors: {
      primary: "#da8f11", // Brass gold - dartboard trim
      secondary: "#2f9b4f", // Dartboard green
      success: "#4fb86a", // Lighter green for success feedback
      error: "#c2412d", // Dartboard red
      warning: "#d2b36a", // Warm gold highlight
      info: "#a67c52", // Bronze accent
      background: {
        default: "#0b0b0b", // Deep black background
        paper: "#151515", // Dark charcoal paper
      },
      text: {
        primary: "#f2e5cf", // Warm ivory text
        secondary: "#c6b79a",
        disabled: "#8c8270",
      },
      divider: "#3b2f1f",
      // Light mode variant
      light: {
        primary: "#9b7a35", // Warm gold for light mode
        secondary: "#2f7d4e", // Rich green for light mode
        success: "#2e7d32", // Mature green for light mode
        error: "#b23c2c", // Deep red for light mode
        warning: "#c7a24d", // Gold highlight for light mode
        info: "#8a6a44", // Bronze accent for light mode
        background: {
          default: "#f6f1e7", // Warm light background
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
      primary: "#4caf50", // Vibrant green - dartboard green
      secondary: "#ff5722", // Orange-red - complements green
      success: "#66bb6a", // Lighter green - success feedback
      error: "#f44336", // Bright red - clear error indication
      background: {
        default: "#0a0a0a", // Deeper dark background
        paper: "#1a1a1a", // Darker paper
      },
      // Light mode variant
      light: {
        primary: "#2e7d32", // Mature green for light mode
        secondary: "#e64a19", // Darker orange-red for light mode
        success: "#388e3c", // Distinct green for success
        error: "#c62828", // Darker red for error
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
      primary: "#7c4dff", // Bright purple - electric vibe
      secondary: "#00e5ff", // Cyan - complements purple
      success: "#00e676", // Bright green - electric success
      error: "#ff1744", // Bright red - clear error
      background: {
        default: "#0d0221", // Deep purple background
        paper: "#1a1a2e", // Dark blue paper
      },
      // Light mode variant
      light: {
        primary: "#6200ea", // Deep purple for light mode
        secondary: "#00acc1", // Darker cyan for light mode
        success: "#00c853", // Mature green for success
        error: "#d50000", // Darker red for error
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
      primary: "#ff6f00", // Warm orange - sunset color
      secondary: "#ff4081", // Pink - complements orange
      success: "#ffb300", // Amber - warm success color
      error: "#ff5252", // Coral red - warm error
      background: {
        default: "#1a0f0a", // Warm dark background
        paper: "#2a1f18", // Warm dark paper
      },
      // Light mode variant
      light: {
        primary: "#e65100", // Deep orange for light mode
        secondary: "#c2185b", // Deep pink for light mode
        success: "#f57c00", // Amber for success
        error: "#d32f2f", // Mature red for error
        background: {
          default: "#fff8f0", // Warm light background
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
      primary: "#00acc1", // Bright teal - ocean blue
      secondary: "#00897b", // Teal green - complements primary
      success: "#26a69a", // Aqua green - distinct success
      error: "#ff6f00", // Coral orange - warm contrast
      background: {
        default: "#001a33", // Deep ocean background
        paper: "#003d66", // Ocean blue paper
      },
      // Light mode variant
      light: {
        primary: "#00838f", // Classic teal for light mode
        secondary: "#00695c", // Deep teal for secondary
        success: "#00796b", // Distinct teal for success
        error: "#e64a19", // Warm orange for error
        background: {
          default: "#e0f7fa", // Light ocean background
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
      primary: "#e91e63", // Magical pink
      secondary: "#9c27b0", // Purple - complements pink
      success: "#00bcd4", // Cyan - magical accent
      error: "#f50057", // Bright pink-red - distinct from primary
      background: {
        default: "#2C0A37", // Deep purple background
        paper: "#3B1A4A", // Lighter purple paper
      },
      // Light mode variant
      light: {
        primary: "#c2185b", // Deep pink for light mode
        secondary: "#7b1fa2", // Deep purple for light mode
        success: "#0097a7", // Darker cyan for success
        error: "#d81b60", // Distinct pink-red for error
        background: {
          default: "#fce4ec", // Light pink background
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
      primary: "#00e676", // Neon green - vibrant
      secondary: "#e91e63", // Neon pink - complements green
      success: "#00e5ff", // Bright cyan - distinct success
      error: "#ff1744", // Neon red - clear error
      background: {
        default: "#000510", // Very dark background
        paper: "#001122", // Dark blue-gray paper
      },
      // Light mode variant
      light: {
        primary: "#00c853", // Mature green for light mode
        secondary: "#c2185b", // Deep pink for light mode
        success: "#00acc1", // Teal for success
        error: "#d50000", // Deep red for error
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
      primary: "#ffc107", // Amber gold - retro feel
      secondary: "#ff5722", // Deep orange - complements gold
      success: "#4caf50", // Vibrant green - arcade success
      error: "#f44336", // Bright red - arcade error
      background: {
        default: "#000000", // Black background
        paper: "#1a1a1a", // Very dark gray paper
      },
      // Light mode variant
      light: {
        primary: "#ff8f00", // Deep amber for light mode
        secondary: "#e64a19", // Deep orange for light mode
        success: "#388e3c", // Mature green for success
        error: "#c62828", // Deep red for error
        background: {
          default: "#fffde7", // Light yellow background
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
      primary: "#66bb6a", // Forest green - vibrant
      secondary: "#8d6e63", // Earth brown - complements green
      success: "#81c784", // Light green - natural success
      error: "#ef5350", // Coral red - warm error
      background: {
        default: "#1a2523", // Dark forest background
        paper: "#2d403c", // Forest green paper
      },
      // Light mode variant
      light: {
        primary: "#388e3c", // Deep green for light mode
        secondary: "#6d4c41", // Rich brown for secondary
        success: "#4caf50", // Vibrant green for success
        error: "#d32f2f", // Mature red for error
        background: {
          default: "#e8f5e9", // Light green background
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

  // Permission settings
  permissionSettings: PermissionSettings;
  setMicrophoneEnabled: (enabled: boolean) => void;
  updateMicrophoneLastChecked: () => void;

  // Game settings
  countdownDuration: number; // Duration in seconds for countdown timers
  setCountdownDuration: (duration: number) => void;

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
        primary: "#c7a24d", // Brass gold - dartboard trim
        secondary: "#2f9b4f", // Dartboard green
        success: "#4fb86a", // Lighter green for success feedback
        error: "#c2412d", // Dartboard red
        warning: "#d2b36a", // Warm gold highlight
        info: "#a67c52", // Bronze accent
        background: {
          default: "#0b0b0b", // Deep black background
          paper: "#151515", // Dark charcoal paper
        },
        text: {
          primary: "#f2e5cf", // Warm ivory text
          secondary: "#c6b79a",
          disabled: "#8c8270",
        },
        divider: "#3b2f1f",
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

      // Vibration settings
      vibrationEnabled: true,
      toggleVibration: () =>
        set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),

      // Permission settings
      permissionSettings: {
        microphone: {
          enabled: false,
          lastChecked: null,
        },
      },
      setMicrophoneEnabled: (enabled: boolean) =>
        set((state) => ({
          permissionSettings: {
            ...state.permissionSettings,
            microphone: {
              ...state.permissionSettings.microphone,
              enabled,
            },
          },
        })),
      updateMicrophoneLastChecked: () =>
        set((state) => ({
          permissionSettings: {
            ...state.permissionSettings,
            microphone: {
              ...state.permissionSettings.microphone,
              lastChecked: Date.now(),
            },
          },
        })),

      // Game settings
      countdownDuration: 3, // Default 3 seconds
      setCountdownDuration: (duration: number) =>
        set({ countdownDuration: Math.max(1, Math.min(30, duration)) }), // Clamp between 1 and 30 seconds

      // Sticky activation state
      hasUserActivation: false,
      setUserActivation: (activated: boolean) =>
        set({ hasUserActivation: activated }),
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
        permissionSettings: state.permissionSettings,
        countdownDuration: state.countdownDuration,
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
