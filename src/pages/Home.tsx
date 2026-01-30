import {
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Divider,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import {
  SportsEsports as GameIcon,
  History as HistoryIcon,
  EmojiEvents as HighscoreIcon,
  People as PlayersIcon,
  Settings as SettingsIcon,
  SportsBar as CricketIcon,
  CallSplit as HalveItIcon,
  FitnessCenter as WarmupIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import React from "react";
import { VERSION } from "../constants/version";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { players } = useStore();

  const gameModes = [
    {
      title: "X01",
      description: "Classic X01 dart game",
      icon: <GameIcon />,
      path: "/x01",
      color: "primary",
    },
    {
      title: "Cricket",
      description: "Strategic Cricket game",
      icon: <CricketIcon />,
      path: "/cricket",
      color: "secondary",
    },
    {
      title: "Halve It",
      description: "Challenge yourself",
      icon: <HalveItIcon />,
      path: "/halveit",
      color: "success",
    },
    {
      title: "Warmup",
      description: "Practice and improve",
      icon: <WarmupIcon />,
      path: "/warmup",
      color: "info",
    },
  ];

  const menuItems = [
    {
      title: "Game History",
      description: "View your recent games",
      icon: <HistoryIcon />,
      path: "/history",
    },
    {
      title: "Highscores",
      description: "Check out the best performances",
      icon: <HighscoreIcon />,
      path: "/highscore",
    },
    {
      title: "Players",
      description: `Manage ${players.length} player${
        players.length !== 1 ? "s" : ""
      }`,
      icon: <PlayersIcon />,
      path: "/players",
    },
    {
      title: "Settings",
      description: "Customize your experience",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: "100%" }}>
      <Stack spacing={4} sx={{ height: "100%" }}>
        {/* Game Modes Section */}
        <Box>
          <Grid container spacing={3}>
            {gameModes.map((game, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "all 0.3s ease-in-out",
                    border: `2px solid ${alpha(
                      game.color === "primary"
                        ? theme.palette.primary.main
                        : game.color === "secondary"
                          ? theme.palette.secondary.main
                          : theme.palette.success.main,
                      0.1,
                    )}`,
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 8,
                      borderColor:
                        game.color === "primary"
                          ? theme.palette.primary.main
                          : game.color === "secondary"
                            ? theme.palette.secondary.main
                            : theme.palette.success.main,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(game.path)}
                    sx={{ height: "100%", p: 0 }}
                  >
                    <CardContent
                      sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        minHeight: 200,
                        justifyContent: "center",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          mb: 2,
                          bgcolor: `${game.color}.main`,
                          color: "white",
                        }}
                      >
                        {game.icon}
                      </Avatar>
                      <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {game.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {game.description}
                      </Typography>
                      <Chip
                        label="Play"
                        color={
                          game.color as "primary" | "secondary" | "success"
                        }
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider />

        {/* Menu Items Section */}
        <Box>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ mb: 3, fontWeight: 600 }}
          >
            More Options
          </Typography>
          <Grid container spacing={2}>
            {menuItems.map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card
                  sx={{
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate(item.path)}>
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2.5,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          width: 48,
                          height: 48,
                        }}
                      >
                        {item.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: "auto",
            pt: 3,
            textAlign: "center",
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            WeDart - Your Digital Dart Companion
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {VERSION}
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
};

export default Home;
