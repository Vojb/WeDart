import React from "react";
import { Box, Button, Typography, alpha, useTheme } from "@mui/material";
import { CricketPlayer } from "../../store/useCricketStore";
import CountUp from "../count-up/count-up";
import { fitScoreFontSize } from "../../utils/fitScoreFontSize";

const LABEL_COLUMN_WIDTH = 76;
const HEADER_HEIGHT = { xs: 112, sm: 132 };
const SCORE_ROW_HEIGHT = { xs: 56, sm: 64 };

type CricketTarget = number | string;

interface CricketMultiPlayerColumnsProps {
  players: CricketPlayer[];
  currentPlayerIndex: number;
  targets: CricketTarget[];
  playerColors: string[];
  avgMarksPerRoundByPlayer: Record<number, number>;
  dartsThrownByPlayer: Record<number, number>;
  isTargetClosedByAll: (target: CricketTarget) => boolean;
  renderPlayerCell: (
    player: CricketPlayer,
    playerIndex: number,
    target: CricketTarget
  ) => React.ReactNode;
  renderTargetLabel: (target: CricketTarget) => React.ReactNode;
  onExit: () => void;
}

/**
 * 3+ player cricket board: one full-height column per player plus a target
 * label column. Columns share the width, so more players means narrower columns.
 */
const CricketMultiPlayerColumns: React.FC<CricketMultiPlayerColumnsProps> = ({
  players,
  currentPlayerIndex,
  targets,
  playerColors,
  avgMarksPerRoundByPlayer,
  dartsThrownByPlayer,
  isTargetClosedByAll,
  renderPlayerCell,
  renderTargetLabel,
  onExit,
}) => {
  const theme = useTheme();
  const rowSx = (target: CricketTarget) => {
    const allClosed = isTargetClosedByAll(target);
    return {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateRows: "minmax(0, 1fr)",
      gridTemplateColumns: "minmax(0, 1fr)",
      p: 0.25,
      borderTop: "1px solid",
      borderColor: "divider",
      filter: allClosed ? "blur(4px)" : "none",
      opacity: allClosed ? 0.5 : 1,
      transition: "opacity 0.3s ease",
    };
  };

  const renderPlayerColumn = (playerIndex: number) => {
    const player = players[playerIndex];
    const color = playerColors[playerIndex] || theme.palette.primary.main;
    const isCurrent = playerIndex === currentPlayerIndex;
    const mpr = avgMarksPerRoundByPlayer[player.id] ?? 0;
    const darts = dartsThrownByPlayer[player.id] ?? 0;

    return (
      <Box
        key={player.id}
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            flexShrink: 0,
            m: 0.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.25,
            px: 0.5,
            borderRadius: 2,
            border: `2px solid ${isCurrent ? color : alpha(theme.palette.divider, 0.5)}`,
            backgroundColor: isCurrent
              ? alpha(color, 0.12)
              : alpha(theme.palette.background.paper, 0.6),
            transition: "border-color 0.2s ease, background-color 0.2s ease",
            overflow: "hidden",
            containerType: "inline-size",
          }}
        >
          <Typography
            noWrap
            sx={{
              maxWidth: "100%",
              fontSize: {
                xs: "min(0.8rem, calc(100cqw / 7))",
                sm: "min(1.05rem, calc(100cqw / 7))",
              },
              fontWeight: isCurrent ? 700 : 600,
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {player.name} ({mpr.toFixed(1)})
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.primary, 0.75),
              fontSize: {
                xs: "min(0.68rem, calc(100cqw / 7))",
                sm: "min(0.78rem, calc(100cqw / 7))",
              },
              lineHeight: 1,
            }}
          >
            Darts: {darts}
          </Typography>
          <Box sx={{ width: "100%", containerType: "inline-size", textAlign: "center" }}>
            <Typography
              component="div"
              sx={{
                fontSize: fitScoreFontSize(player.totalScore, "4.5rem"),
                fontWeight: 700,
                color,
                lineHeight: 1.05,
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
        </Box>

        {targets.map((target) => (
          <Box
            key={`${player.id}-${target}`}
            className={
              isTargetClosedByAll(target) ? "perf-heavy-blur" : undefined
            }
            sx={rowSx(target)}
          >
            {renderPlayerCell(player, playerIndex, target)}
          </Box>
        ))}

        <Box
          sx={{
            height: SCORE_ROW_HEIGHT,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTop: "2px solid",
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            containerType: "inline-size",
          }}
        >
          <Typography
            component="div"
            sx={{
              fontWeight: 700,
              color,
              fontSize: {
                xs: fitScoreFontSize(player.totalScore, "1.75rem"),
                sm: fitScoreFontSize(player.totalScore, "2.1rem"),
              },
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
      </Box>
    );
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
        {players.map((_, playerIndex) => renderPlayerColumn(playerIndex))}
      </Box>

      <Box
        sx={{
          width: LABEL_COLUMN_WIDTH,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            flexShrink: 0,
            m: 0.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={onExit}
            sx={{
              minWidth: 0,
              px: 1,
              py: 0.25,
              fontSize: { xs: "0.62rem", sm: "0.7rem" },
              lineHeight: 1.1,
              borderRadius: 999,
            }}
          >
            Exit
          </Button>
        </Box>

        {targets.map((target) => (
          <Box
            key={`label-${target}`}
            className={
              isTargetClosedByAll(target) ? "perf-heavy-blur" : undefined
            }
            sx={rowSx(target)}
          >
            {renderTargetLabel(target)}
          </Box>
        ))}

        <Box
          sx={{
            height: SCORE_ROW_HEIGHT,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTop: "2px solid",
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              color: theme.palette.text.secondary,
            }}
          >
            Score
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CricketMultiPlayerColumns;
