import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  alpha,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Undo, EmojiEvents, ExitToApp } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useWarmupStore } from "../store/useWarmupStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";
import VibrationButton from "../components/VibrationButton";
import WarmupInput from "../components/warmup-input/warmup-input";

const WarmupGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { currentGame, recordHit, undoLastScore, endGame } = useWarmupStore();
  const { addCompletedGame } = useHistoryStore();
  const { countdownDuration } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const gameStartTimeRef = useRef<number>(Date.now());
  const gameSavedToHistoryRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/warmup");
        return;
      } else if (currentGame.isGameFinished && !dialogOpen) {
        setDialogOpen(true);
        if (!gameSavedToHistoryRef.current) {
          saveGameToHistory();
          gameSavedToHistoryRef.current = true;
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentGame, navigate, dialogOpen]);

  useEffect(() => {
    if (currentGame && !currentGame.isGameFinished) {
      gameStartTimeRef.current = Date.now();
      gameSavedToHistoryRef.current = false;
    }
  }, [currentGame]);

  const saveGameToHistory = () => {
    if (!currentGame || !currentGame.isGameFinished) return;

    const winner = currentGame.players.reduce((prev, current) =>
      prev.hitPercentage > current.hitPercentage ? prev : current,
    );

    const gameDuration = Math.floor(
      (Date.now() - gameStartTimeRef.current) / 1000,
    );

    const completedGame = {
      id: uuidv4(),
      gameType: "warmup" as const,
      timestamp: Date.now(),
      dartCount: currentGame.dartCount,
      duration: gameDuration,
      winnerId: winner ? winner.id : null,
      players: currentGame.players.map((player) => ({
        id: player.id,
        name: player.name,
        dartsThrown: player.totalAttempts,
        finalScore: player.hitPercentage,
        rounds: player.rounds.map((round) => ({
          roundNumber: round.roundNumber,
          target: round.target,
          hits: round.hits,
          attempts: round.attempts,
        })),
      })),
    };

    addCompletedGame(completedGame);
  };

  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (currentGame && !currentGame.isGameFinished) {
        e.preventDefault();
        setLeaveDialogOpen(true);
        window.history.pushState(null, "", location.pathname);
      }
    };

    window.history.pushState(null, "", location.pathname);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [currentGame, location.pathname]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentGame) {
    return null;
  }

  const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
  const currentTarget = currentGame.targets[currentGame.currentTargetIndex];
  const totalRounds = Math.ceil(currentGame.dartCount / 3);
  const currentRound = currentGame.currentRoundIndex;

  const handleLeaveGame = () => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/warmup");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  const handlePlayAgain = () => {
    if (currentGame?.players && currentGame.players.length > 0) {
      endGame();
      setTimeout(() => {
        navigate("/warmup");
      }, 100);
    } else {
      endGame();
      navigate("/warmup");
    }
  };

  const handleReturnToSetup = () => {
    endGame();
    setDialogOpen(false);
    navigate("/warmup");
  };

  const winner = currentGame.players.reduce((prev, current) =>
    prev.hitPercentage > current.hitPercentage ? prev : current,
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Game Summary Dialog */}
      <Dialog open={dialogOpen} maxWidth="sm" fullWidth onClose={() => {}}>
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <EmojiEvents color="primary" sx={{ mr: 1 }} />
          Warmup Complete
        </DialogTitle>
        <DialogContent>
          {winner && (
            <Typography variant="h5" color="primary" gutterBottom>
              {winner.name} - {winner.hitPercentage.toFixed(1)}%
            </Typography>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Final Statistics
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {currentGame.players.map((player) => (
                <ListItem
                  key={player.id}
                  sx={{
                    mb: 1,
                    backgroundColor:
                      player.id === winner.id
                        ? (theme) => alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                    borderRadius: 1,
                  }}
                >
                  <ListItemText
                    primary={player.name}
                    secondary={
                      <Typography variant="body2" component="span">
                        {player.hitPercentage.toFixed(1)}% ({player.totalHits}/
                        {player.totalAttempts})
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <VibrationButton onClick={handleReturnToSetup} vibrationPattern={50}>
            Return to Setup
          </VibrationButton>
          <VibrationButton
            onClick={handlePlayAgain}
            variant="contained"
            color="primary"
            vibrationPattern={100}
          >
            Play Again
          </VibrationButton>
        </DialogActions>
      </Dialog>

      {/* Leave Game Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleCancelLeave}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <ExitToApp color="warning" sx={{ mr: 1 }} />
          Leave Game?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to leave the current game? All progress will
            be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <VibrationButton onClick={handleCancelLeave} vibrationPattern={50}>
            Cancel
          </VibrationButton>
          <VibrationButton
            onClick={handleLeaveGame}
            variant="contained"
            color="error"
            vibrationPattern={[50, 100, 50]}
          >
            Leave Game
          </VibrationButton>
        </DialogActions>
      </Dialog>

      {/* Main Game Interface */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Top Bar - Header with Player Stats */}
        <Paper
          sx={{
            p: 1,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {currentPlayer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Round {currentRound + 1} of {totalRounds} | Target:{" "}
              {currentTarget.number === "Bull"
                ? "Bull"
                : `${currentTarget.zone || "S"}${currentTarget.number}`}
            </Typography>
          </Box>

          {/* Player Stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${currentGame.players.length}, 1fr)`,
              gap: 1,
            }}
          >
            {currentGame.players.map((player) => {
              const isCurrentPlayer = player.id === currentPlayer.id;
              return (
                <Box
                  key={player.id}
                  sx={{
                    p: 1,
                    textAlign: "center",
                    backgroundColor: isCurrentPlayer
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    borderRadius: 1,
                    border: isCurrentPlayer
                      ? `2px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isCurrentPlayer ? "bold" : "normal",
                      display: "block",
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {player.hitPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {player.totalHits}/{player.totalAttempts}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Input Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 2,
          }}
        >
          <WarmupInput
            target={currentTarget.number}
            zone={currentTarget.zone}
            currentHits={currentGame.currentHits}
            attempts={currentGame.currentAttempts}
            onSubmit={recordHit}
            countdownDuration={countdownDuration}
            disabled={currentGame.isGameFinished}
          />
        </Box>

        {/* Bottom Action Bar */}
        <Paper
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={undoLastScore}
            disabled={!currentGame?.lastScore || currentGame.isGameFinished}
            color="info"
          >
            <Undo />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <Typography variant="body2" color="text.secondary">
            {currentGame.dartCount} darts total
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default WarmupGame;
