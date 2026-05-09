import React from "react";
import { Box, Button, Typography, useTheme, alpha } from "@mui/material";
import { CricketPlayer } from "../../store/useCricketStore";
import CountUp from "../count-up/count-up";

interface CricketShiftedScoreboardProps {
  players: CricketPlayer[];
  currentPlayerIndex: number;
  avgMarksPerRoundByPlayer: Record<number, number>;
  legsWon?: Record<number, number>;
  totalLegs?: number;
  dartsThrownByPlayer: Record<number, number>;
  onSwitchPlayer: () => void;
  onDoubleClick?: () => void;
}

const CricketShiftedScoreboard: React.FC<CricketShiftedScoreboardProps> = ({
  players,
  currentPlayerIndex,
  avgMarksPerRoundByPlayer,
  legsWon = {},
  totalLegs = 0,
  dartsThrownByPlayer,
  onSwitchPlayer,
  onDoubleClick,
}) => {
  const theme = useTheme();
  const isTwoPlayer = players.length === 2;

  const renderPlayerPanel = (player: CricketPlayer, playerIndex: number) => {
    const isCurrent = currentPlayerIndex === playerIndex;
    const color =
      playerIndex % 2 === 0
        ? theme.palette.primary.main
        : theme.palette.secondary.main;
    const mpr = avgMarksPerRoundByPlayer[player.id] ?? 0;
    const darts = dartsThrownByPlayer[player.id] ?? 0;
    return (
      <Box
        key={player.id}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 0.5, sm: 0.75 },
          py: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 1.5 },
          borderRadius: 2,
          border: `2px solid ${isCurrent ? color : alpha(theme.palette.divider, 0.5)}`,
          backgroundColor: isCurrent
            ? alpha(color, 0.12)
            : alpha(theme.palette.background.paper, 0.6),
          transition: "border-color 0.2s ease, background-color 0.2s ease",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "0.8rem", sm: "1.05rem" },
            fontWeight: isCurrent ? 700 : 600,
            lineHeight: 1.2,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            textAlign: "center",
          }}
        >
          {player.name}{" "}
          <Box component="span" sx={{ fontWeight: 600, opacity: 0.92 }}>
            ({mpr.toFixed(1)})
          </Box>
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: alpha(theme.palette.text.primary, 0.75),
            fontSize: { xs: "0.68rem", sm: "0.78rem" },
            letterSpacing: 0.4,
            lineHeight: 1,
          }}
        >
          Darts: {darts}
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: { xs: "5.15rem", sm: "5.25rem", md: "5.85rem" },
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
    );
  };

  const legsColumn =
    isTwoPlayer && totalLegs > 0 ? (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 1.5,
          minWidth: 56,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: alpha(theme.palette.text.primary, 0.7),
            fontSize: { xs: "0.6rem", sm: "0.7rem" },
          }}
        >
          First to {totalLegs}
        </Typography>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.6rem", sm: "1.9rem", md: "2.15rem" },
            lineHeight: 1.05,
          }}
        >
          {legsWon[players[0].id] ?? 0} – {legsWon[players[1].id] ?? 0}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: alpha(theme.palette.text.primary, 0.7),
            fontSize: { xs: "0.6rem", sm: "0.7rem" },
          }}
        >
          Legs
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="info"
          onClick={(e) => {
            e.stopPropagation();
            onSwitchPlayer();
          }}
          sx={{
            mt: 0.75,
            minWidth: 0,
            px: 1,
            py: 0.25,
            fontSize: { xs: "0.62rem", sm: "0.7rem" },
            lineHeight: 1.1,
            borderRadius: 999,
          }}
        >
          Switch
        </Button>
      </Box>
    ) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 1,
        width: "100%",
        cursor: onDoubleClick ? "pointer" : undefined,
        minHeight: { xs: 112, sm: 132 },
      }}
      onDoubleClick={onDoubleClick}
    >
      {isTwoPlayer ? (
        <>
          {renderPlayerPanel(players[0], 0)}
          {legsColumn}
          {renderPlayerPanel(players[1], 1)}
        </>
      ) : (
        players.map((player, playerIndex) =>
          renderPlayerPanel(player, playerIndex),
        )
      )}
    </Box>
  );
};

export default CricketShiftedScoreboard;
