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
} from "@mui/icons-material";
import { useStore } from "../store/useStore";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const { themeMode, toggleTheme } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  const menuItems = [
    { text: "Home", icon: <Home />, path: "/" },
    { text: "X01", icon: <SportsEsports />, path: "/x01" },
    { text: "Players", icon: <People />, path: "/players" },
    { text: "History", icon: <History />, path: "/history", disabled: true },
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
    <Box sx={{ width: "100vw" }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            disabled={item.disabled}
            selected={location.pathname === item.path}
            sx={{
              color: "text.primary",
              textDecoration: "none",
              py: 2,
              "&.Mui-selected": {
                bgcolor: "primary.main",
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
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: "h6",
                sx: item.disabled ? { color: "text.disabled" } : {},
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar>
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              WeDart
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 0, mr: 4 }}
            >
              WeDart
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexGrow: 1 }}>
              {menuItems.map((item) => (
                <Typography
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: "inherit",
                    textDecoration: "none",
                    opacity: item.disabled ? 0.5 : 1,
                    pointerEvents: item.disabled ? "none" : "auto",
                  }}
                >
                  {item.text}
                </Typography>
              ))}
            </Box>
          </>
        )}
        <IconButton onClick={toggleTheme} color="inherit">
          {themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        PaperProps={{
          sx: {
            width: "100vw",
            bgcolor: "background.default",
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}
