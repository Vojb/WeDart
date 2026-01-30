import React from "react";
import { Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import { CricketPlayer } from "../../store/useCricketStore";
import CountUp from "../count-up/count-up";

export type CricketPlayerBoxVariant = "full" | "minimal";

interface CricketPlayerBoxProps {
  player: CricketPlayer;
  isCurrentPlayer: boolean;
  avgMarksPerRound: number;
  playerIndex: number;
  variant?: CricketPlayerBoxVariant;
  onDoubleClick?: () => void;
}

const CricketPlayerBox: React.FC<CricketPlayerBoxProps> = ({
  player,
  isCurrentPlayer,
  avgMarksPerRound,
  playerIndex,
  variant = "full",
  onDoubleClick,
}) => {
  const theme = useTheme();
  const playerColor =
    playerIndex % 2 === 0
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  const paperSx = {
    p: { xs: 0.5, sm: 0.75 },
    borderRadius: 1,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    position: "relative" as const,
    overflow: "hidden",
    cursor: onDoubleClick ? "pointer" : undefined,
    "&::before": {
      content: '""',
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "4px",
      height: "100%",
      backgroundColor: isCurrentPlayer ? playerColor : "transparent",
      transition: "background-color 0.3s ease",
    },
    ...(isCurrentPlayer && {
      borderColor: playerColor,
      borderWidth: 2,
      background: `linear-gradient(135deg, ${alpha(playerColor, 0.08)} 0%, ${alpha(playerColor, 0.04)} 100%)`,
      boxShadow: `0 4px 12px ${alpha(playerColor, 0.15)}`,
    }),
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.1)}`,
    },
  };

  if (variant === "minimal") {
    return (
      <Paper
        elevation={isCurrentPlayer ? 4 : 1}
        sx={paperSx}
        onDoubleClick={onDoubleClick}
      >
        <Box
          sx={{
            p: { xs: 1, sm: 1.5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 0.5, sm: 0.75 },
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: isCurrentPlayer ? 700 : 600,
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {player.name}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
              fontWeight: 700,
              color: playerColor,
              lineHeight: 1.1,
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
          <Typography
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 600,
              color: alpha(theme.palette.text.secondary, 0.9),
              lineHeight: 1.2,
            }}
          >
            MPR {avgMarksPerRound.toFixed(1)}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={isCurrentPlayer ? 4 : 1}
      sx={paperSx}
      onDoubleClick={onDoubleClick}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          alignItems: "center",
          gap: { xs: 0.5, sm: 0.75 },
        }}
      >
        <Box />
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.25,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: isCurrentPlayer ? 600 : 500,
              textAlign: "center",
              lineHeight: 1.3,
              transition: "all 0.3s ease",
            }}
          >
            {player.name.toLocaleUpperCase()}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              fontWeight: 500,
              color: alpha(theme.palette.text.secondary, 0.7),
              lineHeight: 1.2,
            }}
          >
            MPR: {avgMarksPerRound.toFixed(1)}
          </Typography>
        </Box>
        <Box />
      </Box>
    </Paper>
  );
};

export default CricketPlayerBox;
