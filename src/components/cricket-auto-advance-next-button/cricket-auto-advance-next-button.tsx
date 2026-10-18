import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, alpha } from "@mui/material";
import VibrationButton from "../VibrationButton";
import { useStore } from "../../store/useStore";

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
    const performanceMode = useStore((state) => state.performanceMode);
    const autoAdvanceTimerRef = useRef<number | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const fillFrameRef = useRef<number | null>(null);
    const progressStartTimeRef = useRef<number>(Date.now());
    const [fill, setFill] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const clearTimers = useCallback(() => {
      if (autoAdvanceTimerRef.current !== null) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      if (progressIntervalRef.current !== null) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (fillFrameRef.current !== null) {
        cancelAnimationFrame(fillFrameRef.current);
        fillFrameRef.current = null;
      }
    }, []);

    useEffect(() => {
      if (isGameFinished || !shouldRunAutoAdvanceTimer) {
        clearTimers();
        setFill(false);
        setSecondsLeft(null);
        return;
      }

      clearTimers();
      setFill(false);
      setSecondsLeft(null);
      progressStartTimeRef.current = Date.now();

      const durationMs = countdownDurationSec * 1000;
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        onFinishTurn();
      }, durationMs);

      if (useStore.getState().performanceMode) {
        const tick = () => {
          const elapsed = Date.now() - progressStartTimeRef.current;
          const left = Math.ceil((durationMs - elapsed) / 1000);
          setSecondsLeft(left > 0 ? left : null);
        };
        tick();
        progressIntervalRef.current = window.setInterval(tick, 1000);
      } else {
        fillFrameRef.current = requestAnimationFrame(() => {
          fillFrameRef.current = null;
          setFill(true);
        });
      }

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
        setFill(false);
        setSecondsLeft(null);
      }
    }, [
      currentPlayerIndex,
      currentRoundDartCount,
      isGameFinished,
      clearTimers,
    ]);

    const handleClick = () => {
      clearTimers();
      setFill(false);
      setSecondsLeft(null);
      onFinishTurn();
    };

    const fontSize = buttonSize === "compact" ? "1rem" : "1.1rem";
    const showSeconds = performanceMode && secondsLeft !== null;

    return (
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: "100%",
          display: "flex",
        }}
      >
        <VibrationButton
          variant="contained"
          color={buttonColor}
          fullWidth
          size="large"
          onClick={handleClick}
          disabled={disabled ?? isGameFinished}
          vibrationPattern={100}
          sx={{
            flex: 1,
            width: "100%",
            height: "100%",
            minWidth: 0,
            px: 1,
            py: 0,
            fontSize,
            fontWeight: "bold",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {showSeconds ? `Next ${secondsLeft}` : "Next"}
        </VibrationButton>
        {!performanceMode && !isGameFinished && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: fill ? "100%" : "0%",
                backgroundColor: (t) => alpha(t.palette.common.white, 0.3),
                transition: fill
                  ? `width ${countdownDurationSec}s linear`
                  : "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: 4,
                width: fill ? "100%" : "0%",
                backgroundColor: "common.white",
                transition: fill
                  ? `width ${countdownDurationSec}s linear`
                  : "none",
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

export default React.memo(CricketAutoAdvanceNextButton);
