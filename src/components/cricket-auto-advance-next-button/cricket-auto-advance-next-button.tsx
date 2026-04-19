import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, LinearProgress, alpha } from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
import VibrationButton from "../VibrationButton";

export interface CricketAutoAdvanceNextButtonProps {
  isGameFinished: boolean;
  /** When true, run the auto-advance countdown (rules differ by game mode). */
  shouldRunAutoAdvanceTimer: boolean;
  countdownDurationSec: number;
  /** Bump on hit, undo, or manual next — restarts the auto-advance clock. */
  timerResetKey: number;
  currentPlayerIndex: number;
  currentRoundDartCount: number;
  onFinishTurn: () => void;
  buttonColor: "primary" | "secondary";
  disabled?: boolean;
  /** Hidden cricket uses a slightly smaller Next button. */
  buttonSize?: "compact" | "default";
}

const CricketAutoAdvanceNextButton: React.FC<CricketAutoAdvanceNextButtonProps> =
  ({
    isGameFinished,
    shouldRunAutoAdvanceTimer,
    countdownDurationSec,
    timerResetKey,
    currentPlayerIndex,
    currentRoundDartCount,
    onFinishTurn,
    buttonColor,
    disabled,
    buttonSize = "default",
  }) => {
    const autoAdvanceTimerRef = useRef<number | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const progressStartTimeRef = useRef<number>(Date.now());
    const [progress, setProgress] = useState(0);

    const clearTimers = useCallback(() => {
      if (autoAdvanceTimerRef.current !== null) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      if (progressIntervalRef.current !== null) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, []);

    useEffect(() => {
      if (isGameFinished || !shouldRunAutoAdvanceTimer) {
        clearTimers();
        setProgress(0);
        return;
      }

      clearTimers();
      setProgress(0);
      progressStartTimeRef.current = Date.now();

      const durationMs = countdownDurationSec * 1000;
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        onFinishTurn();
      }, durationMs);

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - progressStartTimeRef.current;
        const newProgress = Math.min((elapsed / durationMs) * 100, 100);
        setProgress(newProgress);
      }, 50);

      return () => {
        clearTimers();
      };
    }, [
      timerResetKey,
      shouldRunAutoAdvanceTimer,
      isGameFinished,
      countdownDurationSec,
      onFinishTurn,
      clearTimers,
    ]);

    useEffect(() => {
      if (isGameFinished) return;
      const isNewTurn = currentRoundDartCount === 0;
      if (isNewTurn) {
        clearTimers();
        setProgress(0);
      }
    }, [
      currentPlayerIndex,
      currentRoundDartCount,
      isGameFinished,
      clearTimers,
    ]);

    const handleClick = () => {
      clearTimers();
      setProgress(0);
      onFinishTurn();
    };

    const py = buttonSize === "compact" ? 0.75 : 1.5;
    const fontSize = buttonSize === "compact" ? "1rem" : "1.2rem";

    return (
      <Box sx={{ position: "relative" }}>
        <VibrationButton
          variant="contained"
          color={buttonColor}
          fullWidth
          size="large"
          onClick={handleClick}
          disabled={disabled ?? isGameFinished}
          vibrationPattern={100}
          startIcon={<NavigateNext />}
          sx={{
            flex: 1,
            py,
            fontSize,
            fontWeight: "bold",
            position: "relative",
            overflow: "hidden",
            "&::before":
              !isGameFinished && progress > 0
                ? {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${progress}%`,
                    backgroundColor: (t) => alpha(t.palette.common.white, 0.3),
                    transition: "width 0.05s linear",
                  }
                : {},
          }}
        >
          Next
        </VibrationButton>
        {!isGameFinished && progress > 0 && (
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
                backgroundColor: (t) => t.palette.common.white,
              },
            }}
          />
        )}
      </Box>
    );
  };

export default React.memo(CricketAutoAdvanceNextButton);
