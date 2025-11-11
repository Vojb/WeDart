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
  LinearProgress,
  useTheme,
} from "@mui/material";
import {
  Undo,
  EmojiEvents,
  ExitToApp,
  NavigateNext,
  Cancel,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useHalveItStore } from "../store/useHalveItStore";
import VibrationButton from "../components/VibrationButton";
import HitCounterInput from "../components/hit-counter-input/hit-counter-input";
import PointsInput from "../components/points-input/points-input";
import TargetScoreInput from "../components/target-score-input/target-score-input";
import CountUp from "../components/count-up/count-up";

const HalveItGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {
    currentGame,
    recordRoundScore,
    undoLastScore,
    endGame,
    finishTurn,
  } = useHalveItStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    currentScore: number;
    pointsGained: number;
    newScore: number;
    isHalved: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScoreTime, setLastScoreTime] = useState<number>(0);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const progressStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/halveit");
        return;
      } else if (currentGame.isGameFinished && !dialogOpen) {
        setDialogOpen(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentGame, navigate, dialogOpen]);

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

  // Auto-advance timer: 3 seconds after score is entered
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) {
      // Clear timer if game is finished
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      return;
    }

    const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
    const currentRound = currentGame.rounds[currentGame.currentRoundIndex];
    
    if (!currentPlayer || !currentRound) return;

    // Check if current player has scored in current round
    const hasScore = currentRound.playerScores[currentPlayer.id] !== undefined;

    if (!hasScore || lastScoreTime === 0) {
      // Clear timer and progress if player hasn't scored yet
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      return;
    }

    // Clear existing timer and interval
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Reset progress
    setProgress(0);
    progressStartTimeRef.current = Date.now();

    // Set new timer (3 seconds)
    autoAdvanceTimerRef.current = setTimeout(() => {
      finishTurn();
      setLastScoreTime(0); // Reset after advancing
    }, 3000);

    // Update progress every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const newProgress = Math.min((elapsed / 3000) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Cleanup
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [lastScoreTime, currentGame, finishTurn]);

  // Reset progress when player changes (new turn starts)
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) return;

    const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];
    const currentRound = currentGame.rounds[currentGame.currentRoundIndex];
    
    if (!currentPlayer || !currentRound) return;

    // Reset if current round is empty (new turn just started)
    const isNewTurn = currentRound.playerScores[currentPlayer.id] === undefined;

    if (isNewTurn) {
      // Clear timer and progress when a new turn starts
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      setLastScoreTime(0);
      setPreviewData(null);
    }
  }, [currentGame?.currentPlayerIndex, currentGame?.currentRoundIndex, currentGame?.isGameFinished]);

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
  const currentRound = currentGame.rounds[currentGame.currentRoundIndex];

  if (!currentPlayer || !currentRound) {
    return null;
  }

  const calculatePoints = (
    data: { hits?: number; points?: number; totalScore?: number },
    playerId: number,
    roundIndex: number
  ): { currentScore: number; pointsGained: number; newScore: number; isHalved: boolean } => {
    if (!currentGame) {
      return { currentScore: 0, pointsGained: 0, newScore: 0, isHalved: false };
    }

    // Calculate current total score from all previous rounds
    let currentTotalScore = 0;
    for (let i = 0; i < roundIndex; i++) {
      const prevRound = currentGame.rounds[i];
      const prevScore = prevRound.playerScores[playerId];
      if (prevScore) {
        currentTotalScore = prevScore.score;
      }
    }

    const currentRound = currentGame.rounds[roundIndex];
    let roundScore = 0;
    let pointsGained = 0;
    let isHalved = false;
    const roundType = currentRound.roundType;

    if (roundType === "number" || roundType === "bull") {
      const hits = data.hits || 0;
      if (hits === 0) {
        isHalved = true;
        roundScore = Math.floor(currentTotalScore / 2);
        pointsGained = roundScore - currentTotalScore;
      } else {
        const targetValue =
          typeof currentRound.target === "number"
            ? currentRound.target
            : currentRound.target === "Bull"
            ? 25
            : 0;
        pointsGained = hits * targetValue;
        roundScore = currentTotalScore + pointsGained;
      }
    } else if (roundType === "scoring" || roundType === "double" || roundType === "treble") {
      const points = data.points || 0;
      if (points === 0) {
        isHalved = true;
        roundScore = Math.floor(currentTotalScore / 2);
        pointsGained = roundScore - currentTotalScore;
      } else {
        pointsGained = points;
        roundScore = currentTotalScore + pointsGained;
      }
    } else if (roundType === "target-score") {
      const totalScore = data.totalScore || 0;
      if (totalScore === 41) {
        pointsGained = 41;
        roundScore = currentTotalScore + 41;
      } else {
        isHalved = true;
        roundScore = Math.floor(currentTotalScore / 2);
        pointsGained = roundScore - currentTotalScore;
      }
    }

    return {
      currentScore: currentTotalScore,
      pointsGained,
      newScore: roundScore,
      isHalved,
    };
  };

  const handleScore = (data: { hits?: number; points?: number; totalScore?: number }) => {
    if (!currentGame || currentGame.isGameFinished) return;
    
    // Get current player and round from the store to ensure we have the latest values
    const gameState = currentGame;
    const playerIndex = gameState.currentPlayerIndex;
    const roundIndex = gameState.currentRoundIndex;
    const player = gameState.players[playerIndex];
    
    if (!player) return;
    
    // Calculate preview
    const preview = calculatePoints(
      data,
      player.id,
      roundIndex
    );
    
    // Show preview and automatically record the score
    setPreviewData(preview);
    recordRoundScore(player.id, roundIndex, data);
    
    // Set timestamp to trigger auto-advance timer
    setLastScoreTime(Date.now());
    
    // Clear preview after a short delay
    setTimeout(() => {
      setPreviewData(null);
    }, 3000);
  };

  const handleUndo = () => {
    if (!currentGame) return;
    undoLastScore();
    // Clear auto-advance timer when undoing
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(0);
    setLastScoreTime(0);
    setPreviewData(null);
  };

  const handleCancelAutoAdvance = () => {
    // Clear auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(0);
    setLastScoreTime(0);
  };

  const handleFinishTurn = () => {
    if (!currentGame) return;
    // Clear auto-advance timer and progress interval
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(0);
    setLastScoreTime(0);
    finishTurn();
  };

  const handleLeaveGame = () => {
    endGame();
    setLeaveDialogOpen(false);
    navigate("/halveit");
  };

  const handleCancelLeave = () => {
    setLeaveDialogOpen(false);
  };

  const handlePlayAgain = () => {
    if (currentGame?.players && currentGame.players.length > 0) {
      endGame();
      setTimeout(() => {
        navigate("/halveit");
      }, 100);
    } else {
      endGame();
      navigate("/halveit");
    }
  };

  const handleReturnToSetup = () => {
    endGame();
    setDialogOpen(false);
    navigate("/halveit");
  };

  const winner = currentGame.players.reduce((prev, current) =>
    prev.totalScore > current.totalScore ? prev : current
  );

  const hasScore = currentRound.playerScores[currentPlayer.id] !== undefined;

  const renderInput = () => {
    if (currentRound.roundType === "number" || currentRound.roundType === "bull") {
      return (
        <HitCounterInput
          target={currentRound.target || ""}
          onSubmit={(hits) => handleScore({ hits })}
          previewData={previewData}
        />
      );
    } else if (currentRound.roundType === "target-score") {
      return (
        <TargetScoreInput
          targetScore={typeof currentRound.target === "number" ? currentRound.target : 41}
          onSubmit={(totalScore) => handleScore({ totalScore })}
          previewData={previewData}
        />
      );
    } else {
      return (
        <PointsInput
          roundType={currentRound.roundType as "scoring" | "double" | "treble"}
          onSubmit={(points) => handleScore({ points })}
          previewData={previewData}
        />
      );
    }
  };

  const getRoundLabel = () => {
    if (currentRound.roundType === "number" || currentRound.roundType === "bull") {
      return `Round ${currentRound.roundNumber}: ${currentRound.target}`;
    } else if (currentRound.roundType === "target-score") {
      return `Round ${currentRound.roundNumber}: Target Score ${currentRound.target}`;
    } else {
      const typeLabel =
        currentRound.roundType === "scoring"
          ? "Scoring"
          : currentRound.roundType === "double"
          ? "Double"
          : "Treble";
      return `Round ${currentRound.roundNumber}: ${typeLabel}`;
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Game Summary Dialog */}
      <Dialog
        open={dialogOpen}
        maxWidth="sm"
        fullWidth
        onClose={() => {}}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <EmojiEvents color="primary" sx={{ mr: 1 }} />
          Game Finished
        </DialogTitle>
        <DialogContent>
          {winner && (
            <Typography variant="h5" color="primary" gutterBottom>
              {winner.name} won!
            </Typography>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Final Scores
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {currentGame.players
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player) => (
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
                        Score: {player.totalScore}
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
        {/* Top Bar - Header with Round Info and Player Names */}
        <Paper
          sx={{
            p: 1,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" align="center" fontWeight="bold">
              {getRoundLabel()}
            </Typography>
          </Box>

          {/* Player Headers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${currentGame.players.length}, 1fr)`,
              gap: 0.5,
            }}
          >
            {/* Display players in their original order - never sort or reorder */}
            {/* Create a copy and sort by orderIndex to ensure correct order */}
            {[...currentGame.players].sort((a, b) => a.orderIndex - b.orderIndex).map((player) => {
              const isCurrentPlayer = player.id === currentPlayer.id;
              // Use player ID to determine color so it stays consistent for each player
              const playerColor =
                player.id % 2 === 0
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main;

              return (
                <Box
                  key={player.id}
                  sx={{
                    backgroundColor: isCurrentPlayer
                      ? alpha(playerColor, 0.1)
                      : "transparent",
                    borderRadius: 1,
                    p: 1,
                    textAlign: "center",
                    border: isCurrentPlayer
                      ? `2px solid ${playerColor}`
                      : "2px solid transparent",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentPlayer ? "bold" : "normal",
                      mb: 0.5,
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: playerColor,
                    }}
                  >
                    <CountUp
                      to={player.totalScore}
                      duration={0.5}
                      delay={0}
                      animateOnChange={true}
                      startWhen={true}
                    />
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
            p: 1,
          }}
        >
          {renderInput()}
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
            gap: 2,
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton 
              onClick={handleUndo} 
              color="info" 
              size="small"
              disabled={!currentGame?.lastScore}
            >
              <Undo />
            </IconButton>
            <IconButton 
              onClick={handleCancelAutoAdvance} 
              color="warning" 
              size="small"
              disabled={progress === 0 || lastScoreTime === 0}
            >
              <Cancel />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1 }} />

          <VibrationButton
            variant="contained"
            color={
              currentGame.currentPlayerIndex % 2 === 0 ? "primary" : "secondary"
            }
            onClick={handleFinishTurn}
            disabled={currentGame.isGameFinished || !hasScore}
            vibrationPattern={100}
            startIcon={<NavigateNext />}
            sx={{
              minWidth: 120,
              position: "relative",
              overflow: "hidden",
              "&::before": !currentGame.isGameFinished && progress > 0
                ? {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${progress}%`,
                    backgroundColor: (theme) =>
                      alpha(theme.palette.common.white, 0.3),
                    transition: "width 0.05s linear",
                  }
                : {},
            }}
          >
            Next
          </VibrationButton>
          {/* Progress bar indicator */}
          {!currentGame.isGameFinished && progress > 0 && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: "transparent",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: (theme) => theme.palette.common.white,
                },
              }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default HalveItGame;

