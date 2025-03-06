import { PaletteMode } from "@mui/material";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { ThemeColors } from "../store/useStore";

// Define common typography settings
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontWeight: 500,
    fontSize: "2.5rem",
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 500,
    fontSize: "2rem",
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 500,
    fontSize: "1.75rem",
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 500,
    fontSize: "1.5rem",
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 500,
    fontSize: "1.25rem",
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 500,
    fontSize: "1rem",
    lineHeight: 1.4,
  },
  subtitle1: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
  },
};

// Define common shape settings
const shape = {
  borderRadius: 8,
};

// Create the light theme palette
const getLightPalette = (themeColors: ThemeColors) => {
  // Use light mode colors if available, otherwise fall back to dark mode colors
  const lightColors = themeColors.light || {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    success: themeColors.success,
    error: themeColors.error,
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  };

  return {
    mode: "light" as PaletteMode,
    primary: {
      main: lightColors.primary,
      light: "#4791db",
      dark: "#002171",
      contrastText: "#ffffff",
    },
    secondary: {
      main: lightColors.secondary,
      light: "#d05ce3",
      dark: "#6a0080",
      contrastText: "#ffffff",
    },
    success: {
      main: lightColors.success || themeColors.success,
      light: "#60ad5e",
      dark: "#005005",
      contrastText: "#ffffff",
    },
    error: {
      main: lightColors.error || themeColors.error,
      light: "#ef5350",
      dark: "#c62828",
      contrastText: "#ffffff",
    },
    warning: {
      main: lightColors.warning || themeColors.warning || "#ed6c02",
      light: "#ff9800",
      dark: "#e65100",
      contrastText: "#ffffff",
    },
    info: {
      main: lightColors.info || themeColors.info || "#0288d1",
      light: "#03a9f4",
      dark: "#01579b",
      contrastText: "#ffffff",
    },
    background: {
      default: lightColors.background.default,
      paper: lightColors.background.paper,
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.6)",
      disabled: "rgba(0, 0, 0, 0.38)",
    },
    divider:
      lightColors.divider || themeColors.divider || "rgba(0, 0, 0, 0.12)",
  };
};

// Create the dark theme palette
const getDarkPalette = (themeColors: ThemeColors) => ({
  mode: "dark" as PaletteMode,
  primary: {
    main: themeColors.primary,
    light: "#4791db",
    dark: "#115293",
    contrastText: "#ffffff",
  },
  secondary: {
    main: themeColors.secondary,
    light: "#d05ce3",
    dark: "#6a0080",
    contrastText: "#ffffff",
  },
  success: {
    main: themeColors.success,
    light: "#60ad5e",
    dark: "#005005",
    contrastText: "#ffffff",
  },
  error: {
    main: themeColors.error,
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
  warning: {
    main: themeColors.warning || "#ff9800",
    light: "#ffb74d",
    dark: "#f57c00",
    contrastText: "rgba(0, 0, 0, 0.87)",
  },
  info: {
    main: themeColors.info || "#0288d1",
    light: "#03a9f4",
    dark: "#01579b",
    contrastText: "#ffffff",
  },
  background: {
    default: themeColors.background.default,
    paper: themeColors.background.paper,
  },
  text: {
    primary: themeColors.text?.primary || "#ffffff",
    secondary: themeColors.text?.secondary || "rgba(255, 255, 255, 0.7)",
    disabled: themeColors.text?.disabled || "rgba(255, 255, 255, 0.5)",
  },
  divider: themeColors.divider || "rgba(255, 255, 255, 0.12)",
});

// Create the theme based on mode and colors
export const createAppTheme = (mode: PaletteMode, themeColors: ThemeColors) => {
  // Select the appropriate palette based on mode
  const palette =
    mode === "light"
      ? getLightPalette(themeColors)
      : getDarkPalette(themeColors);

  // Create the base theme
  const baseTheme = createTheme({
    palette,
    typography,
    shape,
  });

  // Add component overrides
  const themeWithComponents = createTheme(baseTheme, {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
          },
          contained: {
            boxShadow: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            color: "#ffffff",
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            color: "#ffffff",
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
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            color: mode === "light" ? "rgba(0, 0, 0, 0.87)" : "#ffffff",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: mode === "light" ? "rgba(0, 0, 0, 0.87)" : "#ffffff",
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: mode === "light" ? "rgba(0, 0, 0, 0.87)" : "#ffffff",
          },
          secondary: {
            color:
              mode === "light"
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.7)",
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            color: mode === "light" ? "rgba(0, 0, 0, 0.87)" : "#ffffff",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });

  // Make fonts responsive
  return responsiveFontSizes(themeWithComponents);
};
