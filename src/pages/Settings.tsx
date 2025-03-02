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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
          maxHeight: "120px",
          overflowY: "auto",
          pb: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0,0,0,0.05)",
          },
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
    vibrationEnabled,
    toggleVibration,
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

      {/* Theme Mode Toggle */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Mode
        </Typography>
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
      </Paper>

      {/* Theme Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Selection
        </Typography>
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
      </Paper>

      {/* Theme Colors */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          minHeight: { xs: "auto", sm: "auto" },
          overflow: "auto",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Custom Theme Colors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fine-tune your own custom theme by adjusting individual color
          components. Colors update automatically as you change them.
        </Typography>

        <Grid container spacing={4}>
          {/* Primary Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Primary Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
                borderRadius: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography>Primary Button</Typography>
            </Box>
          </Grid>

          {/* Secondary Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Secondary Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
                borderRadius: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography>Secondary Button</Typography>
            </Box>
          </Grid>

          {/* Success Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Success Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
                borderRadius: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography>Success Button</Typography>
            </Box>
          </Grid>

          {/* Error Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Error Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
                borderRadius: 1,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography>Error Button</Typography>
            </Box>
          </Grid>

          {/* Background Default Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Background Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
              }}
            >
              <Typography>Page Background</Typography>
            </Box>
          </Grid>

          {/* Background Paper Color */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Panel Color
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "200px",
                overflow: "auto",
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
                color: "#fff",
              }}
            >
              <Typography>Panel Background</Typography>
            </Box>
          </Grid>
        </Grid>

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
      </Paper>

      {/* Preview section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Preview
        </Typography>

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
          <Grid item xs={12} sm={6}>
            <VibrationButton
              variant="contained"
              color="success"
              fullWidth
              sx={{ mb: 2 }}
              vibrationPattern={80}
            >
              Success Button
            </VibrationButton>
          </Grid>
          <Grid item xs={12} sm={6}>
            <VibrationButton
              variant="contained"
              color="error"
              fullWidth
              sx={{ mb: 2 }}
              vibrationPattern={[50, 100, 50]}
            >
              Error Button
            </VibrationButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Vibration Settings */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Haptic Feedback
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control vibration feedback for button presses. This feature only works
          on Android devices when using the app as a PWA. It has no effect on
          iOS devices or desktop browsers.
        </Typography>

        <FormControlLabel
          control={
            <Switch checked={vibrationEnabled} onChange={toggleVibration} />
          }
          label={`Vibration feedback is ${
            vibrationEnabled ? "enabled" : "disabled"
          }`}
        />

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Test vibration patterns:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
            <VibrationButton
              variant="outlined"
              color="primary"
              size="small"
              vibrationPattern={50}
            >
              Short
            </VibrationButton>
            <VibrationButton
              variant="outlined"
              color="secondary"
              size="small"
              vibrationPattern={100}
            >
              Medium
            </VibrationButton>
            <VibrationButton
              variant="outlined"
              color="error"
              size="small"
              vibrationPattern={[50, 100, 50]}
            >
              Pattern
            </VibrationButton>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
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
