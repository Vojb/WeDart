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
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Home,
  SportsEsports,
  History,
  EmojiEvents,
  People,
  Settings,
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

  const menuItems = [
    { text: "Home", icon: <Home />, path: "/" },
    { text: "X01", icon: <SportsEsports />, path: "/x01" },
    { text: "Cricket", icon: <SportsEsports />, path: "/cricket" },
    { text: "Cricket Half", icon: <SportsEsports />, path: "/cricket-half" },
    { text: "Half It", icon: <SportsEsports />, path: "/halfit" },
    { text: "Players", icon: <People />, path: "/players" },
    { text: "History", icon: <History />, path: "/history" },
    {
      text: "Highscore",
      icon: <EmojiEvents />,
      path: "/highscore",
      disabled: true,
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={item.disabled ? "div" : Link}
            {...(item.disabled ? {} : { to: item.path })}
            onClick={() => !item.disabled && handleDrawerToggle()}
            sx={{
              py: 2,
              px: 3,
              color: "text.primary",
              textDecoration: "none",
              opacity: item.disabled ? 0.5 : 1,
              pointerEvents: item.disabled ? "none" : "auto",
              "&.Mui-selected": {
                bgcolor: (theme) => theme.palette.primary.main,
                color: "primary.contrastText",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === item.path
                    ? "primary.contrastText"
                    : "inherit",
                minWidth: { xs: 40, sm: 56 },
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: "body1",
                sx: (theme) => ({
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: item.disabled
                    ? theme.palette.text.disabled
                    : "inherit",
                }),
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "light"
            ? "#fff"
            : theme.palette.background.default,
      }}
    >
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
            width: { xs: "100%", sm: 320 },
            bgcolor: "background.default",
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
