import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Container,
  Avatar,
  Button,
  alpha,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Home,
  SportsEsports,
  EmojiEvents,
  People,
  Settings,
  Close,
} from "@mui/icons-material";
import { useStore } from "../store/useStore";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import React from "react";
import VibrationButton from "./VibrationButton";

const Navbar: React.FC = () => {
  const { themeMode, toggleTheme } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

  const menuItems: Array<{
    text: string;
    icon: React.ReactElement;
    path: string;
    disabled?: boolean;
  }> = [
    { text: "Home", icon: <Home />, path: "/" },
    { text: "X01", icon: <SportsEsports />, path: "/x01" },
    { text: "Cricket", icon: <SportsEsports />, path: "/cricket" },
    { text: "Halve It", icon: <SportsEsports />, path: "/halveit" },
    { text: "Players", icon: <People />, path: "/players" },
    {
      text: "Leaderboards",
      icon: <EmojiEvents />,
      path: "/highscore",
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              fontWeight: "bold",
            }}
          >
            W
          </Avatar>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            WeDart
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} edge="end">
          <Close />
        </IconButton>
      </Box>

      {/* Menu Items */}
      <List sx={{ pt: 2, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={item.disabled ? "div" : Link}
            {...(item.disabled ? {} : { to: item.path })}
            onClick={() => !item.disabled && handleDrawerToggle()}
            sx={{
              py: 1.5,
              px: 3,
              color: "text.primary",
              textDecoration: "none",
              opacity: item.disabled ? 0.5 : 1,
              pointerEvents: item.disabled ? "none" : "auto",
              borderRadius: "8px",
              mx: 1,
              mb: 0.5,
              transition: "all 0.2s",
              bgcolor:
                location.pathname === item.path
                  ? (theme) =>
                      theme.palette.mode === "light"
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.2)
                  : "transparent",
              "&:hover": {
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.main, 0.15),
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === item.path ? "primary.main" : "inherit",
                minWidth: 40,
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: "body1",
                sx: {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color:
                    location.pathname === item.path
                      ? "primary.main"
                      : "inherit",
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Drawer Footer */}
      <Box sx={{ mt: "auto", p: 2, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            startIcon={themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
            onClick={toggleTheme}
            fullWidth
            variant="outlined"
            sx={{ mr: 1 }}
          >
            {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            startIcon={<Settings />}
            component={Link}
            to="/settings"
            fullWidth
            variant="outlined"
            sx={{ ml: 1 }}
            onClick={handleDrawerToggle}
          >
            Settings
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
          }}
        >
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  flexGrow: 1,
                  color: "inherit",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                WeDart
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  mr: 4,
                  color: "inherit",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                WeDart
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: { sm: 1, md: 2 },
                  flexGrow: 1,
                }}
              >
                {menuItems.map((item) => (
                  <VibrationButton
                    key={item.text}
                    component={item.disabled ? "button" : Link}
                    {...(item.disabled ? {} : { to: item.path })}
                    disabled={item.disabled}
                    startIcon={item.icon}
                    color={
                      location.pathname === item.path ? "primary" : "inherit"
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      opacity: item.disabled ? 0.5 : 1,
                    }}
                    vibrationPattern={50}
                  >
                    {item.text}
                  </VibrationButton>
                ))}
              </Box>
            </>
          )}
          <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
            {themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton
            color="inherit"
            component={Link}
            to="/settings"
            aria-label="settings"
            sx={{ ml: 1 }}
          >
            <Settings />
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: "100%",
            bgcolor: "background.default",
            transition: "0.3s ease-in-out",
            overflowX: "hidden",
          },
        }}
        sx={{
          "& .MuiDrawer-paper": {
            borderRadius: 0,
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
