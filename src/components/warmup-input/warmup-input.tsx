import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, LinearProgress } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";
import DartboardVisualization from "../dartboard-visualization/dartboard-visualization";

interface WarmupInputProps {
  target: number | "Bull";
  zone?: "T" | "D" | "S";
  currentHits: number;
  attempts: number;
  onSubmit: (isHit: boolean) => void;
  disabled?: boolean;
  countdownDuration?: number;
}

const WarmupInput: React.FC<WarmupInputProps> = ({
  target,
  zone,
  currentHits,
  attempts,
  onSubmit,
  disabled = false,
  countdownDuration = 2,
}) => {
  const [localAttempts, setLocalAttempts] = useState<Array<boolean | null>>([
    null,
    null,
    null,
  ]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const progressStartTimeRef = useRef<number>(0);

  const handleCancelCountdown = () => {
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
  };

  // Reset local attempts when attempts prop resets (new round)
  useEffect(() => {
    if (attempts === 0) {
      setLocalAttempts([null, null, null]);
      handleCancelCountdown();
    }
  }, [attempts]);

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

  const startCountdown = () => {
    handleCancelCountdown();
    const durationMs = countdownDuration * 1000;
    setCountdown(countdownDuration);
    setProgress(0);
    progressStartTimeRef.current = Date.now();

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
  };

  const handleHit = (isHit: boolean) => {
    if (disabled || attempts >= 3) return;

    // Find the first empty slot
    const emptyIndex = localAttempts.findIndex((attempt) => attempt === null);
    if (emptyIndex === -1) return; // All 3 attempts already entered

    // Update local attempts immediately
    const newAttempts = [...localAttempts];
    newAttempts[emptyIndex] = isHit;
    setLocalAttempts(newAttempts);

    // Submit immediately for each press
    onSubmit(isHit);

    // Start countdown on each press (restarts if pressed again)
    startCountdown();

    // If this was the 3rd attempt, set timer to advance to next round
    if (emptyIndex === 2) {
      const durationMs = countdownDuration * 1000;

      // Clear any existing timer
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }

      // After countdown, reset for next round
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(null);
        setProgress(0);
        setLocalAttempts([null, null, null]);

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, durationMs) as unknown as number;
    } else {
      // For 1st and 2nd press, set timer to auto-submit remaining as misses if countdown completes
      const durationMs = countdownDuration * 1000;

      // Clear any existing timer
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }

      // After countdown, auto-submit remaining attempts as misses
      countdownTimerRef.current = setTimeout(() => {
        // Submit remaining attempts as misses
        const remainingSlots = newAttempts.filter((a) => a === null).length;
        for (let i = 0; i < remainingSlots; i++) {
          onSubmit(false);
        }

        setCountdown(null);
        setProgress(0);
        setLocalAttempts([null, null, null]);

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, durationMs) as unknown as number;
    }
  };

  const isCountdownActive = countdown !== null && countdown > 0;
  // Allow clicking even during countdown to restart it
  const canInteract = !disabled && attempts < 3;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          width: "100%",
          maxWidth: 600,
        }}
      >
        {/* Dartboard Visualization - only show for single, double, or triple targets (not Bull) */}
        {target !== "Bull" && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <DartboardVisualization target={target} size={240} />
          </Box>
        )}

        <Typography
          variant="h5"
          component="div"
          fontWeight="bold"
          color="primary"
        >
          Target: {target === "Bull" ? "Bull" : `${zone || "S"}${target}`}
        </Typography>

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            Hits: {currentHits} / {attempts}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {attempts < 3
              ? `${3 - attempts} attempts remaining`
              : "Round complete"}
          </Typography>
          {/* Show entered attempts */}
          {localAttempts.some((a) => a !== null) && (
            <Box
              sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 1 }}
            >
              {localAttempts.map((attempt, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: 2,
                    borderColor:
                      attempt === null
                        ? "divider"
                        : attempt
                          ? "success.main"
                          : "error.main",
                    bgcolor:
                      attempt === null
                        ? "transparent"
                        : attempt
                          ? "success.light"
                          : "error.light",
                    color: attempt === null ? "text.secondary" : "white",
                    fontWeight: "bold",
                  }}
                >
                  {attempt === null ? "" : attempt ? "+" : "-"}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box 
          sx={{ 
            width: "100%", 
            textAlign: "center",
            minHeight: isCountdownActive ? "auto" : "80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {isCountdownActive && (
            <>
              <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                {countdown}s
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 1,
                }}
              />
            </>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <VibrationButton
            variant="contained"
            color="error"
            size="large"
            onClick={() => handleHit(false)}
            disabled={!canInteract}
            startIcon={<Remove />}
            sx={{ flex: 1, py: 2 }}
            vibrationPattern={100}
          >
            Miss (-)
          </VibrationButton>

          <VibrationButton
            variant="contained"
            color="success"
            size="large"
            onClick={() => handleHit(true)}
            disabled={!canInteract}
            startIcon={<Add />}
            sx={{ flex: 1, py: 2 }}
            vibrationPattern={100}
          >
            Hit (+)
          </VibrationButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default WarmupInput;
