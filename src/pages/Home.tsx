import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardActionArea,
  Button,
  useTheme,
} from "@mui/material";
import {
  SportsEsports as GameIcon,
  History as HistoryIcon,
  EmojiEvents as HighscoreIcon,
  People as PlayersIcon,
  Settings as SettingsIcon,
  SportsBar as CricketIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import React, { useState, useEffect } from "react";
import { VERSION } from "../constants/version";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { players } = useStore();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload the background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
    img.src =
      "https://images.unsplash.com/photo-1570303278474-fa99155c82c2?ixlib=rb-4.0.3&auto=format&fit=crop&q=80";
  }, []);

  const menuItems = [
    {
      title: "Play X01",
      description: "Start a new X01 dart game",
      icon: (
        <GameIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      path: "/x01",
    },
    {
      title: "Play Cricket",
      description: "Start a new Cricket dart game",
      icon: (
        <CricketIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      path: "/cricket",
    },
    {
      title: "Game History",
      description: "View your recent games",
      icon: (
        <HistoryIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      path: "/history",
    },
    {
      title: "Highscores",
      description: "Check out the best performances",
      icon: (
        <HighscoreIcon
          sx={{ fontSize: 40, color: theme.palette.primary.main }}
        />
      ),
      path: "/highscore",
    },
    {
      title: "Players",
      description: `Manage ${players.length} player${
        players.length !== 1 ? "s" : ""
      }`,
      icon: (
        <PlayersIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      path: "/players",
    },
    {
      title: "Settings",
      description: "Customize your experience",
      icon: (
        <SettingsIcon
          sx={{ fontSize: 40, color: theme.palette.primary.main }}
        />
      ),
      path: "/settings",
    },
  ];

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      <Paper
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          ...(imageLoaded
            ? {
                backgroundImage:
                  "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(https://images.unsplash.com/photo-1570303278474-fa99155c82c2?ixlib=rb-4.0.3&auto=format&fit=crop&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `linear-gradient(to bottom right, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
              }),
        }}
      >
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
          >
            WeDart
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Your digital dart scoring companion
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/x01")}
            sx={{
              px: 4,
              py: 1,
              fontSize: "1.1rem",
              mb: 4,
              fontWeight: "bold",
            }}
          >
            Start Playing
          </Button>
        </Box>

        <Grid container spacing={2}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(item.path)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    p: 2,
                  }}
                >
                  <Box sx={{ display: "flex", width: "100%", mb: 1 }}>
                    {item.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="body2"
          sx={{ mt: "auto", pt: 4, textAlign: "center", opacity: 0.7 }}
        >
          WeDart - Your Digital Dart Companion
        </Typography>
        <Typography
          variant="caption"
          sx={{ mt: 1, textAlign: "center", opacity: 0.5 }}
        >
          {VERSION}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
