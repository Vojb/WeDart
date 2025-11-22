import React from "react";
import { Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import { CricketPlayer } from "../../store/useCricketStore";

interface CricketPlayerBoxProps {
  player: CricketPlayer;
  isCurrentPlayer: boolean;
  avgMarksPerRound: number;
  playerIndex: number;
}

const CricketPlayerBox: React.FC<CricketPlayerBoxProps> = ({
  player,
  isCurrentPlayer,
  avgMarksPerRound,
  playerIndex,
}) => {
  const theme = useTheme();
  const playerColor = playerIndex % 2 === 0 
    ? theme.palette.primary.main 
    : theme.palette.secondary.main;

  return (
    <Paper
      elevation={isCurrentPlayer ? 4 : 1}
      sx={{
        p: { xs: 0.5, sm: 0.75 },
        borderRadius: 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: isCurrentPlayer
            ? playerColor
            : "transparent",
          transition: "background-color 0.3s ease",
        },
        ...(isCurrentPlayer && {
          borderColor: playerColor,
          borderWidth: 2,
          background: `linear-gradient(135deg, ${alpha(
            playerColor,
            0.08
          )} 0%, ${alpha(playerColor, 0.04)} 100%)`,
          boxShadow: `0 4px 12px ${alpha(playerColor, 0.15)}`,
        }),
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          alignItems: "center",
          gap: { xs: 0.5, sm: 0.75 },
        }}
      >
        {/* Spacer - Left */}
        <Box />

        {/* Main Section - Center */}
        <Box
          sx={{
            p: { xs:1, sm: 2 },
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

        {/* Spacer - Right */}
        <Box />
      </Box>
    </Paper>
  );
};

export default CricketPlayerBox;

