import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { useStore, predefinedThemes } from "../store/useStore";
import React from "react";
import VibrationButton from "../components/VibrationButton";

// Common color presets
const colorPresets = {
  primary: [
    "#1976d2", // MUI default blue
    "#2196f3", // Lighter blue
    "#0d47a1", // Dark blue
    "#3f51b5", // Indigo
    "#673ab7", // Deep Purple
    "#6200ea", // Purple
    "#8e24aa", // Purple
    "#c2185b", // Pink
    "#d81b60", // Pink
    "#880e4f", // Dark pink
    "#f50057", // Accent pink
    "#009688", // Teal
    "#00796b", // Dark teal
    "#4caf50", // Green
    "#1b5e20", // Dark green
    "#00c853", // Accent green
    "#ff5722", // Deep orange
    "#e64a19", // Dark orange
    "#f44336", // Red
    "#c62828", // Dark red
    "#d50000", // Accent red
  ],
  secondary: [
    "#9c27b0", // MUI default purple
    "#7b1fa2", // Dark purple
    "#e91e63", // Pink
    "#f44336", // Red
    "#d32f2f", // Light red
    "#ff9800", // Orange
    "#f57c00", // Dark orange
    "#ffa000", // Amber
    "#ffc107", // Light amber
    "#ffeb3b", // Yellow
    "#fdd835", // Dark yellow
    "#ffff00", // Bright yellow
    "#cddc39", // Lime
    "#c0ca33", // Dark lime
    "#64dd17", // Accent lime
    "#00695c", // Dark teal
    "#26a69a", // Teal
    "#689f38", // Light green
    "#558b2f", // Dark green
    "#8bc34a", // Light green
    "#4caf50", // Green
  ],
  success: [
    "#2e7d32", // MUI default green
    "#4caf50", // Light green
    "#43a047", // Green
    "#388e3c", // Mid green
    "#1b5e20", // Dark green
    "#00c853", // Bright green
    "#00e676", // Accent green
    "#66bb6a", // Light green
    "#2e7d32", // Dark green
    "#1b5e20", // Darker green
    "#8bc34a", // Light green
    "#689f38", // Darker light green
    "#558b2f", // Darker green
    "#33691e", // Very dark green
    "#76ff03", // Lime accent
    "#64dd17", // Light green accent
    "#00bfa5", // Teal accent
    "#00897b", // Teal
    "#004d40", // Dark teal
    "#81c784", // Light green
    "#a5d6a7", // Very light green
  ],
  error: [
    "#d32f2f", // MUI default red
    "#f44336", // Light red
    "#e53935", // Mid red
    "#c62828", // Red
    "#b71c1c", // Dark red
    "#ff1744", // Accent red
    "#ff5252", // Bright red
    "#ff8a80", // Light red
    "#ef5350", // Red 400
    "#e57373", // Red 300
    "#f44336", // Red 500
    "#d32f2f", // Red 700
    "#c62828", // Red 800
    "#b71c1c", // Red 900
    "#ff5722", // Deep orange
    "#e64a19", // Deep orange 700
    "#ff3d00", // Deep orange A400
    "#dd2c00", // Deep orange A700
    "#bf360c", // Deep orange 900
    "#ff6e40", // Deep orange A200
    "#ff9e80", // Deep orange A100
  ],
  background: [
    "#121212", // Standard dark background
    "#1e1e1e", // Standard dark paper
    "#000000", // Black
    "#0a0a0a", // Near black
    "#0d0221", // Deep purple background
    "#190a05", // Dark brown background
    "#002147", // Deep navy background
    "#1a1a2e", // Dark blue
    "#0f111a", // Dark blue-gray
    "#292929", // Dark gray
    "#1f1f1f", // Another dark gray
    "#1a1a1a", // Yet another dark gray
    "#222222", // And another dark gray
    "#123456", // Dark blue shade
    "#102030", // Navy blue
    "#111111", // Almost black
    "#1a1a2e", // Dark blue-violet
    "#1f2937", // Dark slate
    "#181818", // Another dark gray
    "#0f172a", // Dark blue
  ],
  paper: [
    "#1e1e1e", // Standard dark paper
    "#121212", // Standard dark background
    "#282828", // Dark gray
    "#1a1a1a", // Darker paper
    "#1a1a2e", // Dark blue paper
    "#251e18", // Dark brown paper
    "#0a3060", // Navy paper
    "#212121", // Gray
    "#303030", // Lighter gray
    "#2d3748", // Blue-gray
    "#1e293b", // Dark blue-gray
    "#1e1e30", // Dark blue
    "#242424", // Another gray
    "#2c2c2c", // Lighter gray
    "#1f2937", // Dark slate
    "#222222", // Yet another gray
    "#1e1e24", // Dark gray with blue hint
    "#2d2d2d", // Medium gray
    "#202020", // Standard gray
    "#262626", // Medium-dark gray
  ],
};

interface SimpleColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
}

// Simple Color Picker component
const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({
  value,
  onChange,
  presets,
}) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
          pb: 1,
        }}
      >
        {presets.map((color) => (
          <Box
            key={color}
            onClick={() => onChange(color)}
            sx={{
              width: 32,
              height: 32,
              bgcolor: color,
              borderRadius: 1,
              cursor: "pointer",
              border: "2px solid",
              borderColor: value === color ? "white" : "transparent",
              boxShadow: value === color ? 3 : 1,
              "&:hover": {
                opacity: 0.8,
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease-in-out",
              flexShrink: 0,
            }}
          />
        ))}
      </Box>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "divider",
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <Box
              sx={{
                width: 24,
                height: 24,
                bgcolor: value,
                borderRadius: "4px",
                mr: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          ),
        }}
      />
    </Box>
  );
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const {
    setThemeColors,
    themeColors,
    themeMode,
    toggleTheme,
    currentThemeId,
    setCurrentTheme,
  } = useStore();

  // State for color values
  const [primaryColor, setPrimaryColor] = useState(
    themeColors?.primary || "#1976d2"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    themeColors?.secondary || "#9c27b0"
  );
  const [successColor, setSuccessColor] = useState(
    themeColors?.success || "#2e7d32"
  );
  const [errorColor, setErrorColor] = useState(themeColors?.error || "#d32f2f");

  // State for background colors
  const [backgroundDefaultColor, setBackgroundDefaultColor] = useState(
    themeColors?.background?.default || "#121212"
  );
  const [backgroundPaperColor, setBackgroundPaperColor] = useState(
    themeColors?.background?.paper || "#1e1e1e"
  );

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // State for tracking if we're using a custom theme (not a predefined one)
  const [isCustomTheme, setIsCustomTheme] = useState(
    currentThemeId === "custom"
  );

  // Accordion expanded states
  const [expandedThemeMode, setExpandedThemeMode] = useState<boolean>(true);
  const [expandedThemeSelection, setExpandedThemeSelection] =
    useState<boolean>(true);
  const [expandedCustomColors, setExpandedCustomColors] =
    useState<boolean>(false);
  const [expandedPreview, setExpandedPreview] = useState<boolean>(false);

  // Helper function to determine text color based on background
  const getTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance - standard formula for perceived brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return white for dark backgrounds, black for light backgrounds
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  // Initialize colors from store
  useEffect(() => {
    if (themeColors) {
      setPrimaryColor(themeColors.primary || "#1976d2");
      setSecondaryColor(themeColors.secondary || "#9c27b0");
      setSuccessColor(themeColors.success || "#2e7d32");
      setErrorColor(themeColors.error || "#d32f2f");
      setBackgroundDefaultColor(themeColors.background?.default || "#121212");
      setBackgroundPaperColor(themeColors.background?.paper || "#1e1e1e");
    }
  }, [themeColors]);

  // Update theme when colors change
  const updatePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    updateThemeColors({ ...themeColors, primary: color });
    // When manually changing a color, we're in custom theme mode
    setIsCustomTheme(true);
  };

  const updateSecondaryColor = (color: string) => {
    setSecondaryColor(color);
    updateThemeColors({ ...themeColors, secondary: color });
    setIsCustomTheme(true);
  };

  const updateSuccessColor = (color: string) => {
    setSuccessColor(color);
    updateThemeColors({ ...themeColors, success: color });
    setIsCustomTheme(true);
  };

  const updateErrorColor = (color: string) => {
    setErrorColor(color);
    updateThemeColors({ ...themeColors, error: color });
    setIsCustomTheme(true);
  };

  // Update background colors
  const updateBackgroundDefaultColor = (color: string) => {
    setBackgroundDefaultColor(color);
    updateThemeColors({
      ...themeColors,
      background: {
        ...(themeColors.background || {}),
        default: color,
      },
    });
    setIsCustomTheme(true);
  };

  const updateBackgroundPaperColor = (color: string) => {
    setBackgroundPaperColor(color);
    updateThemeColors({
      ...themeColors,
      background: {
        ...(themeColors.background || {}),
        paper: color,
      },
    });
    setIsCustomTheme(true);
  };

  // Update theme colors with debounce
  const updateThemeColors = (colors: typeof themeColors) => {
    setThemeColors(colors);
    // When manually updating colors, mark as custom theme
    localStorage.setItem("currentThemeId", "custom");
    // No need to explicitly save to localStorage here,
    // our Zustand store should handle that
  };

  // Handle theme selection
  const handleThemeSelect = (themeId: string) => {
    setCurrentTheme(themeId);
    setIsCustomTheme(themeId === "custom");
    setSnackbarMessage(
      `Theme "${
        predefinedThemes.find((t) => t.id === themeId)?.name || "Custom"
      }" applied!`
    );
    setSnackbarOpen(true);
  };

  // Save theme colors to store
  const handleSaveTheme = () => {
    setSnackbarMessage("Theme colors saved successfully!");
    setSnackbarOpen(true);
    // Theme is already saved by the updateThemeColors function
  };

  // Reset to default theme
  const handleResetTheme = () => {
    const defaultColors = {
      primary: "#1976d2", // Default MUI blue
      secondary: "#9c27b0", // Default MUI purple
      success: "#2e7d32", // Default MUI green
      error: "#d32f2f", // Default MUI red
      background: {
        default: "#121212", // Dark background
        paper: "#1e1e1e", // Dark paper
      },
    };

    setPrimaryColor(defaultColors.primary);
    setSecondaryColor(defaultColors.secondary);
    setSuccessColor(defaultColors.success);
    setErrorColor(defaultColors.error);
    setBackgroundDefaultColor(defaultColors.background.default);
    setBackgroundPaperColor(defaultColors.background.paper);

    setThemeColors(defaultColors);
    handleThemeSelect("default");
    setSnackbarMessage("Colors reset to default values");
    setSnackbarOpen(true);
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
      </Box>

      {/* Theme Mode Accordion */}
      <Accordion
        expanded={expandedThemeMode}
        onChange={() => setExpandedThemeMode(!expandedThemeMode)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="theme-mode-content"
          id="theme-mode-header"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">Theme Mode</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
            <LightModeIcon sx={{ mr: 1, color: "text.secondary" }} />
            <FormControlLabel
              control={
                <Switch
                  checked={themeMode === "dark"}
                  onChange={toggleTheme}
                  color="primary"
                />
              }
              label=""
            />
            <DarkModeIcon sx={{ ml: 1, color: "text.secondary" }} />
            <Typography sx={{ ml: 2 }}>
              {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Theme Selection Accordion */}
      <Accordion
        expanded={expandedThemeSelection}
        onChange={() => setExpandedThemeSelection(!expandedThemeSelection)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="theme-selection-content"
          id="theme-selection-header"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">Theme Selection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose from predefined themes or customize your own colors below.
          </Typography>

          <Grid container spacing={2}>
            {predefinedThemes.map((theme) => (
              <Grid item xs={6} sm={4} key={theme.id}>
                <Card
                  sx={{
                    height: "100%",
                    position: "relative",
                    border: currentThemeId === theme.id ? 2 : 0,
                    borderColor: "primary.main",
                  }}
                >
                  <CardActionArea
                    onClick={() => handleThemeSelect(theme.id)}
                    sx={{ height: "100%" }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {currentThemeId === theme.id && (
                          <CheckCircleIcon color="primary" />
                        )}
                        <Typography variant="subtitle1" component="div">
                          {theme.name}
                        </Typography>
                      </Stack>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: theme.colors.primary,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: theme.colors.secondary,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: theme.colors.success,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: theme.colors.error,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "4px",
                            bgcolor: theme.colors.background.default,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "4px",
                            bgcolor: theme.colors.background.paper,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Backgrounds
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
            <Grid item xs={6} sm={4}>
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  border: isCustomTheme ? 2 : 0,
                  borderColor: "primary.main",
                }}
              >
                <CardActionArea
                  onClick={() => setIsCustomTheme(true)}
                  sx={{ height: "100%" }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      {isCustomTheme && <CheckCircleIcon color="primary" />}
                      <Typography variant="subtitle1" component="div">
                        Custom
                      </Typography>
                    </Stack>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: primaryColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: secondaryColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: successColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: errorColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "4px",
                          bgcolor: backgroundDefaultColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "4px",
                          bgcolor: backgroundPaperColor,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        Backgrounds
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Theme Colors Accordion */}
      <Accordion
        expanded={expandedCustomColors}
        onChange={() => setExpandedCustomColors(!expandedCustomColors)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="custom-colors-content"
          id="custom-colors-header"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">Custom Theme Colors</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fine-tune your own custom theme by adjusting individual color
            components. Colors update automatically as you change them.
          </Typography>

          {/* Primary Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="primary-color-content"
              id="primary-color-header"
            >
              <Typography variant="subtitle1">Primary Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={primaryColor}
                  onChange={updatePrimaryColor}
                  presets={colorPresets.primary}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: primaryColor,
                  color: getTextColor(primaryColor),
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography>Primary Button</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Secondary Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="secondary-color-content"
              id="secondary-color-header"
            >
              <Typography variant="subtitle1">Secondary Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={secondaryColor}
                  onChange={updateSecondaryColor}
                  presets={colorPresets.secondary}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: secondaryColor,
                  color: getTextColor(secondaryColor),
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography>Secondary Button</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Success Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="success-color-content"
              id="success-color-header"
            >
              <Typography variant="subtitle1">Success Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={successColor}
                  onChange={updateSuccessColor}
                  presets={colorPresets.success}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: successColor,
                  color: getTextColor(successColor),
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography>Success Button</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Error Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="error-color-content"
              id="error-color-header"
            >
              <Typography variant="subtitle1">Error Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={errorColor}
                  onChange={updateErrorColor}
                  presets={colorPresets.error}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: errorColor,
                  color: getTextColor(errorColor),
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography>Error Button</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Background Default Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="background-color-content"
              id="background-color-header"
            >
              <Typography variant="subtitle1">Background Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={backgroundDefaultColor}
                  onChange={updateBackgroundDefaultColor}
                  presets={colorPresets.background}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: backgroundDefaultColor,
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                  color: getTextColor(backgroundDefaultColor),
                }}
              >
                <Typography>Page Background</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Background Paper Color Accordion */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel-color-content"
              id="panel-color-header"
            >
              <Typography variant="subtitle1">Panel Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  height: "auto",
                  overflow: "visible",
                }}
              >
                <SimpleColorPicker
                  value={backgroundPaperColor}
                  onChange={updateBackgroundPaperColor}
                  presets={colorPresets.paper}
                />
              </Paper>
              <Box
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: backgroundPaperColor,
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                  color: getTextColor(backgroundPaperColor),
                }}
              >
                <Typography>Panel Background</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <VibrationButton
              variant="outlined"
              color="error"
              onClick={handleResetTheme}
              vibrationPattern={[50, 100, 50]}
            >
              Reset to Default
            </VibrationButton>
            <VibrationButton
              variant="contained"
              color="primary"
              onClick={handleSaveTheme}
              vibrationPattern={100}
            >
              Save Theme
            </VibrationButton>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Preview section */}
      <Accordion
        expanded={expandedPreview}
        onChange={() => setExpandedPreview(!expandedPreview)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="preview-content"
          id="preview-header"
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">Theme Preview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <VibrationButton
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                vibrationPattern={50}
              >
                Primary Button
              </VibrationButton>
              <VibrationButton
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                vibrationPattern={50}
              >
                Primary Outlined
              </VibrationButton>
            </Grid>
            <Grid item xs={12} sm={6}>
              <VibrationButton
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ mb: 2 }}
                vibrationPattern={75}
              >
                Secondary Button
              </VibrationButton>
              <VibrationButton
                variant="outlined"
                color="secondary"
                fullWidth
                sx={{ mb: 2 }}
                vibrationPattern={75}
              >
                Secondary Outlined
              </VibrationButton>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
