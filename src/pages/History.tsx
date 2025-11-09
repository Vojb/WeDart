import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Chip,
  ListItemText,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import {
  AccessTime,
  CalendarToday,
  EmojiEvents,
  Person,
  SportsCricket,
  FunctionsOutlined,
  KeyboardArrowRight,
  SportsScore,
  GpsFixed,
} from "@mui/icons-material";
import React, { useState } from "react";
import {
  useHistoryStore,
  CompletedGame,
  isX01Game,
  isCricketGame,
  GameType,
} from "../store/useHistoryStore";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import VibrationButton from "../components/VibrationButton";

const History: React.FC = () => {
  const { completedGames, clearHistory, getGamesByType } = useHistoryStore();
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | "all">("all");

  // Get filtered games based on the selected game type
  const filteredGames =
    gameTypeFilter === "all"
      ? completedGames
      : getGamesByType(gameTypeFilter as GameType);

  // Handle clear history confirmation
  const handleClearHistory = () => {
    clearHistory();
    setConfirmDialogOpen(false);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Format duration from seconds to minutes:seconds
  const formatDuration = (durationSeconds: number) => {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Find winner name
  const getWinnerName = (game: CompletedGame) => {
    if (!game.winnerId) return "No winner";
    const winner = game.players.find((p) => p.id === game.winnerId);
    return winner ? winner.name : "Unknown";
  };

  // Get game icon based on game type
  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case "301":
      case "501":
      case "701":
        return <SportsScore fontSize="small" />;
      case "cricket":
        return <GpsFixed fontSize="small" />;
      default:
        return <SportsCricket fontSize="small" />;
    }
  };

  // Find a selected game by ID
  const getSelectedGame = () => {
    if (!selectedGame) return null;
    return completedGames.find((game) => game.id === selectedGame) || null;
  };

  // Open game details dialog
  const handleViewGameDetails = (gameId: string) => {
    setSelectedGame(gameId);
    setGameDetailsOpen(true);
  };

  // Handle filter change
  const handleFilterChange = (
    _event: React.SyntheticEvent,
    newValue: GameType | "all"
  ) => {
    setGameTypeFilter(newValue);
  };

  const renderX01GameDetails = (game: CompletedGame) => {
    if (!isX01Game(game)) return null;

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Game Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SportsScore fontSize="small" color="primary" />
                <Typography variant="body2">Game: {game.gameType}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTime fontSize="small" color="primary" />
                <Typography variant="body2">
                  Duration: {formatDuration(game.duration)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FunctionsOutlined fontSize="small" color="primary" />
                <Typography variant="body2">
                  Double Out: {game.isDoubleOut ? "Yes" : "No"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FunctionsOutlined fontSize="small" color="primary" />
                <Typography variant="body2">
                  Double In: {game.isDoubleIn ? "Yes" : "No"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Player Performance
        </Typography>
        <Grid container spacing={2}>
          {game.players.map((player) => (
            <Grid item xs={12} sm={6} md={4} key={player.id}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor:
                    player.id === game.winnerId
                      ? (theme) => alpha(theme.palette.success.main, 0.1)
                      : "background.paper",
                  borderColor:
                    player.id === game.winnerId ? "success.main" : "divider",
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor:
                          player.id === game.winnerId
                            ? "success.main"
                            : "primary.main",
                      }}
                    >
                      {player.name.charAt(0)}
                    </Avatar>
                  }
                  title={player.name}
                  subheader={
                    player.id === game.winnerId
                      ? "Winner"
                      : `Score: ${player.finalScore}`
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Average per dart: {player.avgPerDart?.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      Darts thrown: {player.dartsThrown}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {player.rounds100Plus > 0 && (
                      <Chip
                        size="small"
                        label={`100+: ${player.rounds100Plus}`}
                      />
                    )}
                    {player.rounds140Plus > 0 && (
                      <Chip
                        size="small"
                        label={`140+: ${player.rounds140Plus}`}
                      />
                    )}
                    {player.rounds180 > 0 && (
                      <Chip
                        size="small"
                        color="primary"
                        label={`180s: ${player.rounds180}`}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  };

  const renderCricketGameDetails = (game: CompletedGame) => {
    if (!isCricketGame(game)) return null;

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Game Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GpsFixed fontSize="small" color="primary" />
                <Typography variant="body2">Game: Cricket</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTime fontSize="small" color="primary" />
                <Typography variant="body2">
                  Duration: {formatDuration(game.duration)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FunctionsOutlined fontSize="small" color="primary" />
                <Typography variant="body2">
                  Cut-Throat: {game.cutThroat ? "Yes" : "No"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Player Performance
        </Typography>
        <Grid container spacing={2}>
          {game.players.map((player) => (
            <Grid item xs={12} sm={6} md={4} key={player.id}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor:
                    player.id === game.winnerId
                      ? (theme) => alpha(theme.palette.success.main, 0.1)
                      : "background.paper",
                  borderColor:
                    player.id === game.winnerId ? "success.main" : "divider",
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar
                      sx={{
                        bgcolor:
                          player.id === game.winnerId
                            ? "success.main"
                            : "primary.main",
                      }}
                    >
                      {player.name.charAt(0)}
                    </Avatar>
                  }
                  title={player.name}
                  subheader={
                    player.id === game.winnerId
                      ? "Winner"
                      : `Points: ${player.totalPoints}`
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Total marks: {player.marks}
                    </Typography>
                    <Typography variant="body2">
                      Darts thrown: {player.dartsThrown}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Closed numbers:{" "}
                      {player.closedNumbers.sort((a, b) => a - b).join(", ")}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  };

  const gameDetailsDialog = () => {
    const game = getSelectedGame();
    if (!game) return null;

    return (
      <Dialog
        open={gameDetailsOpen}
        onClose={() => setGameDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {getGameIcon(game.gameType)}
              <Typography variant="h6">
                {game.gameType === "cricket"
                  ? "Cricket"
                  : `${game.gameType} Game`}{" "}
                Details
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(game.timestamp)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isX01Game(game) && renderX01GameDetails(game)}
          {isCricketGame(game) && renderCricketGameDetails(game)}
        </DialogContent>
        <DialogActions>
          <VibrationButton
            onClick={() => setGameDetailsOpen(false)}
            vibrationPattern={50}
          >
            Close
          </VibrationButton>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper
        sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Game History
          </Typography>
          {completedGames.length > 0 && (
            <VibrationButton
              onClick={() => setConfirmDialogOpen(true)}
              vibrationPattern={[50, 100, 50]}
            >
              Clear History
            </VibrationButton>
          )}
        </Box>

        {completedGames.length > 0 && (
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={gameTypeFilter}
              onChange={handleFilterChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All Games" value="all" />
              <Tab label="301" value="301" />
              <Tab label="501" value="501" />
              <Tab label="701" value="701" />
              <Tab label="Cricket" value="cricket" />
            </Tabs>
          </Box>
        )}

        {completedGames.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography sx={{ mb: 2 }}>No game history yet.</Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/x01")}
              startIcon={<SportsCricket />}
            >
              Start a New Game
            </Button>
          </Box>
        ) : filteredGames.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography sx={{ mb: 2 }}>
              No {gameTypeFilter} games in history.
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflow: "auto", flex: 1 }}>
            {filteredGames.map((game, index) => (
              <React.Fragment key={game.id}>
                <ListItem
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleViewGameDetails(game.id)}
                    >
                      <KeyboardArrowRight />
                    </IconButton>
                  }
                  onClick={() => handleViewGameDetails(game.id)}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getGameIcon(game.gameType)}
                        <Typography variant="body1">
                          {game.gameType === "cricket"
                            ? "Cricket Game"
                            : `${game.gameType} Game`}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${game.players.length} players`}
                          icon={<Person fontSize="small" />}
                        />
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <CalendarToday
                            fontSize="small"
                            sx={{ fontSize: "0.75rem" }}
                          />
                          <Typography variant="body2">
                            {formatDate(game.timestamp)}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <EmojiEvents
                            fontSize="small"
                            sx={{ fontSize: "0.75rem", color: "gold" }}
                          />
                          <Typography variant="body2">
                            Winner: {getWinnerName(game)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredGames.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Clear History Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Clear Game History?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to clear all your game history? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <VibrationButton
              onClick={() => setConfirmDialogOpen(false)}
              vibrationPattern={50}
            >
              Cancel
            </VibrationButton>
            <VibrationButton
              onClick={handleClearHistory}
              color="error"
              vibrationPattern={[50, 100, 50]}
            >
              Clear History
            </VibrationButton>
          </DialogActions>
        </Dialog>

        {/* Game Details Dialog */}
        {gameDetailsDialog()}
      </Paper>
    </Box>
  );
};

export default History;
