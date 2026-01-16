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
  Cancel,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useHalveItStore } from "../store/useHalveItStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { useStore } from "../store/useStore";
import { v4 as uuidv4 } from "uuid";
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
  } = useHalveItStore();
  const { addCompletedGame } = useHistoryStore();
  const { countdownDuration } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    currentScore: number;
    pointsGained: number;
    newScore: number;
    isHalved: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number>(0);
  const playerHeaderRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pendingScoreRef = useRef<{
    playerId: number;
    roundIndex: number;
    data: { hits?: number; points?: number; totalScore?: number };
  } | null>(null);
  const gameStartTimeRef = useRef<number>(Date.now());
  const gameSavedToHistoryRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      if (!currentGame) {
        navigate("/halveit");
        return;
      } else if (currentGame.isGameFinished && !dialogOpen) {
        setDialogOpen(true);
        // Save game to history when it finishes
        if (!gameSavedToHistoryRef.current) {
          saveGameToHistory();
          gameSavedToHistoryRef.current = true;
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentGame, navigate, dialogOpen]);

  // Reset game start time and saved flag when a new game starts
  useEffect(() => {
    if (currentGame && !currentGame.isGameFinished) {
      gameStartTimeRef.current = Date.now();
      gameSavedToHistoryRef.current = false;
    }
  }, [currentGame]);

  // Save the completed game to history
  const saveGameToHistory = () => {
    if (!currentGame || !currentGame.isGameFinished) return;

    // Find the winner (player with highest score)
    const winner = currentGame.players.reduce((prev, current) =>
      prev.totalScore > current.totalScore ? prev : current
    );

    // Calculate game duration in seconds
    const gameDuration = Math.floor(
      (Date.now() - gameStartTimeRef.current) / 1000
    );

    // Helper function to calculate points gained in a round
    const calculateRoundData = (
      playerId: number,
      roundIndex: number
    ): { score: number; pointsGained: number; isHalved: boolean; hits?: number; points?: number; totalScore?: number } => {
      const round = currentGame.rounds[roundIndex];
      if (!round) {
        return { score: 0, pointsGained: 0, isHalved: false };
      }

      const playerScore = round.playerScores[playerId];
      if (!playerScore) {
        return { score: 0, pointsGained: 0, isHalved: false };
      }

      // Calculate score before this round
      let scoreBeforeRound = 0;
      for (let i = 0; i < roundIndex; i++) {
        const prevRound = currentGame.rounds[i];
        const prevScore = prevRound.playerScores[playerId];
        if (prevScore) {
          scoreBeforeRound = prevScore.score;
        }
      }

      const scoreAfterRound = playerScore.score;
      const pointsGained = scoreAfterRound - scoreBeforeRound;
      const isHalved = pointsGained < 0 || (round.roundType === "number" || round.roundType === "bull" ? playerScore.hits === 0 : round.roundType === "target-score" ? playerScore.totalScore !== 41 : playerScore.points === 0);

      return {
        score: scoreAfterRound,
        pointsGained,
        isHalved,
        hits: playerScore.hits,
        points: playerScore.points,
        totalScore: playerScore.totalScore,
      };
    };

    // Create the HalveItCompletedGame object
    const completedGame = {
      id: uuidv4(),
      gameType: "halveit" as const,
      timestamp: Date.now(),
      mode: currentGame.mode,
      duration: gameDuration,
      winnerId: winner ? winner.id : null,
      players: currentGame.players.map((player) => {
        // Build round-by-round data for this player
        const rounds = currentGame.rounds
          .map((round, roundIndex) => {
            const roundData = calculateRoundData(player.id, roundIndex);
            return {
              roundNumber: round.roundNumber,
              roundType: round.roundType,
              target: round.target,
              score: roundData.score,
              pointsGained: roundData.pointsGained,
              isHalved: roundData.isHalved,
              hits: roundData.hits,
              points: roundData.points,
              totalScore: roundData.totalScore,
            };
          })
          .filter((round) => {
            // Only include rounds where the player has a score
            const roundIndex = round.roundNumber - 1;
            return currentGame.rounds[roundIndex]?.playerScores[player.id] !== undefined;
          });

        return {
          id: player.id,
          name: player.name,
          dartsThrown: 0, // HalveIt doesn't track darts thrown
          finalScore: player.totalScore,
          rounds,
        };
      }),
    };

    // Add the completed game to history
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

  // No auto-advance timer needed - player advances immediately after score is recorded

  // Reset preview when player changes (new turn starts)
  useEffect(() => {
    if (!currentGame || currentGame.isGameFinished) return;

    // Sort players to ensure correct order (same as store)
    const sortedPlayers = [...currentGame.players].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      return a.id - b.id;
    });

    // Use the store's currentPlayerIndex directly on the sorted array
    const currentPlayer = sortedPlayers[currentGame.currentPlayerIndex] || sortedPlayers[0];
    const currentRound = currentGame.rounds[currentGame.currentRoundIndex];
    
    if (!currentPlayer || !currentRound) return;

    // Reset if current round is empty (new turn just started)
    const isNewTurn = currentRound.playerScores[currentPlayer.id] === undefined;

    if (isNewTurn) {
      // Clear countdown and pending score when new turn starts
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setCountdown(null);
      setProgress(0);
      pendingScoreRef.current = null;
      setPreviewData(null);
    }
  }, [currentGame?.currentPlayerIndex, currentGame?.currentRoundIndex, currentGame?.isGameFinished, currentGame?.players]);

  useEffect(() => {
    if (!currentGame) return;
    const sortedPlayers = [...currentGame.players].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      return a.id - b.id;
    });
    const hasScrollablePlayers = sortedPlayers.length > 4;
    if (!hasScrollablePlayers) return;
    const currentPlayer = sortedPlayers[currentGame.currentPlayerIndex] || sortedPlayers[0];
    if (!currentPlayer) return;
    const currentPlayerHeader = playerHeaderRefs.current[currentPlayer.id];
    if (currentPlayerHeader) {
      currentPlayerHeader.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [currentGame?.currentPlayerIndex, currentGame?.currentRoundIndex, currentGame?.players]);


  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

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

  // Always sort players by orderIndex to ensure correct order (same as store)
  const sortedPlayers = [...currentGame.players].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.id - b.id;
  });

  const hasManyPlayers = sortedPlayers.length > 3;
  const hasScrollablePlayers = sortedPlayers.length > 4;

  // Use the store's currentPlayerIndex directly on the sorted array
  // The store maintains players sorted by orderIndex, so the index should match
  const currentPlayer = sortedPlayers[currentGame.currentPlayerIndex] || sortedPlayers[0];
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
    if (!currentRound) {
      return { currentScore: currentTotalScore, pointsGained: 0, newScore: currentTotalScore, isHalved: false };
    }
    let roundScore = 0;
    let pointsGained = 0;
    let isHalved = false;
    const roundType = currentRound.roundType;

    if (roundType === "number" || roundType === "bull") {
      const hits = data.hits || 0;
      if (hits === 0) {
        isHalved = true;
        roundScore = Math.floor(currentTotalScore / 2);
        pointsGained = Math.abs(roundScore - currentTotalScore);
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
        pointsGained = Math.abs(roundScore - currentTotalScore);
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
        pointsGained = Math.abs(roundScore - currentTotalScore);
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
    
    // Use the currentPlayer we already determined (from sorted array)
    // This ensures we're using the correct player even if array order changed
    if (!currentPlayer) return;
    
    // Calculate preview
    const preview = calculatePoints(
      data,
      currentPlayer.id,
      currentGame.currentRoundIndex
    );
    
    // Show preview immediately
    setPreviewData(preview);
    
    // Store pending score data
    pendingScoreRef.current = {
      playerId: currentPlayer.id,
      roundIndex: currentGame.currentRoundIndex,
      data,
    };
    
    // Start countdown
    const durationMs = countdownDuration * 1000;
    setCountdown(countdownDuration);
    setProgress(0);
    progressStartTimeRef.current = Date.now();
    
    // Clear any existing timers
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    
    // Update progress bar every 50ms for smooth animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50) as unknown as number;
    
    // Record score after countdown completes
    countdownTimerRef.current = setTimeout(() => {
      if (pendingScoreRef.current) {
        recordRoundScore(
          pendingScoreRef.current.playerId,
          pendingScoreRef.current.roundIndex,
          pendingScoreRef.current.data
        );
        pendingScoreRef.current = null;
      }
      setCountdown(null);
      setProgress(0);
      setPreviewData(null);
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, durationMs) as unknown as number;
  };

  const handleCancelCountdown = () => {
    // Clear countdown and pending score
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCountdown(null);
    setProgress(0);
    pendingScoreRef.current = null;
    setPreviewData(null);
  };

  const handleUndo = () => {
    if (!currentGame) return;
    
    // Clear countdown and pending score
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCountdown(null);
    setProgress(0);
    pendingScoreRef.current = null;
    
    undoLastScore();
    setPreviewData(null);
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

  const isCountdownActive = countdown !== null && countdown > 0;

  const renderInput = () => {
    if (currentRound.roundType === "number" || currentRound.roundType === "bull") {
      return (
        <HitCounterInput
          target={currentRound.target || ""}
          onSubmit={(hits) => handleScore({ hits })}
          previewData={previewData}
          disabled={isCountdownActive}
        />
      );
    } else if (currentRound.roundType === "target-score") {
      return (
        <TargetScoreInput
          targetScore={typeof currentRound.target === "number" ? currentRound.target : 41}
          onSubmit={(totalScore) => handleScore({ totalScore })}
          previewData={previewData}
          disabled={isCountdownActive}
        />
      );
    } else {
      return (
        <PointsInput
          roundType={currentRound.roundType as "scoring" | "double" | "treble"}
          onSubmit={(points) => handleScore({ points })}
          previewData={previewData}
          disabled={isCountdownActive}
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
            height: hasManyPlayers ? "30%" : "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="h6" align="center" fontWeight="bold">
              {getRoundLabel()}

            </Typography>
          </Box>

          {/* Player Headers */}
          <Box
            sx={{
              display: hasManyPlayers ? "flex" : "grid",
              gridTemplateColumns: hasManyPlayers
                ? undefined
                : `repeat(${sortedPlayers.length}, 1fr)`,
              flexWrap: hasManyPlayers ? "wrap" : "nowrap",
              alignContent: hasManyPlayers ? "flex-start" : undefined,
              gap: 0.5,
              height: hasManyPlayers ? "100%" : "auto",
              flex: 1,
              overflowY: hasScrollablePlayers ? "auto" : "hidden",
            }}
          >
            {/* Display players sorted by orderIndex to ensure correct order */}
            {sortedPlayers.map((player) => {
              const isCurrentPlayer = player.id === currentPlayer.id;
              // Use player ID to determine color so it stays consistent for each player
              const playerColor =
                player.id % 2 === 0
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main;

              return (
                <Box
                  key={player.id}
                  ref={(element) => {
                    playerHeaderRefs.current[player.id] =
                      element as HTMLDivElement | null;
                  }}
                  sx={{
                    backgroundColor: isCurrentPlayer
                      ? alpha(playerColor, 0.1)
                      : "transparent",
                    borderRadius: 1,
                    p: hasScrollablePlayers ? 0.5 : 1,
                    textAlign: "center",
                    border: isCurrentPlayer
                      ? `2px solid ${playerColor}`
                      : "2px solid transparent",
                    flex: hasManyPlayers ? "1 1 calc(50% - 4px)" : undefined,
                    minHeight: hasManyPlayers ? "34px" : "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentPlayer ? "bold" : "normal",
                      mb: 0.5,
                      fontSize: hasScrollablePlayers
                        ? "0.75rem"
                        : hasManyPlayers
                        ? "0.85rem"
                        : undefined,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    variant={hasScrollablePlayers ? "h6" : hasManyPlayers ? "h5" : "h4"}
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.info.main,
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
            p: 0,
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
            flexDirection: "column",
            gap: 1,
            position: "relative",
          }}
        >
          {/* Progress Bar */}
          {countdown !== null && countdown > 0 && (
            <Box sx={{ width: "100%", mb: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 6,
                  borderRadius: 1,
                }} 
              />
            </Box>
          )}
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton 
                onClick={handleUndo} 
                color="info" 
                size="small"
                disabled={!currentGame?.lastScore || isCountdownActive}
              >
                <Undo />
              </IconButton>
            </Box>

            <VibrationButton
              variant="contained"
              color="error"
              onClick={handleCancelCountdown}
              disabled={!isCountdownActive}
              startIcon={<Cancel />}
              vibrationPattern={[50, 100, 50]}
            >
              Cancel
            </VibrationButton>

            <Box sx={{ flex: 1 }} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default HalveItGame;

