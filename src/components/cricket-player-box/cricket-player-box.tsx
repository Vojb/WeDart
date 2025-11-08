import React from "react";
import { Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import { CricketPlayer } from "../../store/useCricketStore";

interface CricketPlayerBoxProps {
  player: CricketPlayer;
  isCurrentPlayer: boolean;
  avgMarksPerRound: number;
}

const CricketPlayerBox: React.FC<CricketPlayerBoxProps> = ({
  player,
  isCurrentPlayer,
  avgMarksPerRound,
}) => {
  const theme = useTheme();

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
            ? theme.palette.primary.main
            : "transparent",
          transition: "background-color 0.3s ease",
        },
        ...(isCurrentPlayer && {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
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
        {/* Stats Section - Left */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.125 }}>
            <Typography
              sx={{
                fontSize: { xs: "0.6rem", sm: "0.65rem" },
                fontWeight: 500,
                color: theme.palette.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                lineHeight: 1.2,
              }}
            >
              Avg
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 600,
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {avgMarksPerRound.toFixed(1)}
            </Typography>
          </Box>
         
        </Box>

        {/* Main Section - Center */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
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
            {player.name}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem" },
              fontWeight: 700,
              color: theme.palette.primary.main,
              lineHeight: 1,
              transition: "all 0.3s ease",
            }}
          >
            {player.totalScore}
          </Typography>
        </Box>

        {/* Spacer - Right */}
        <Box />
      </Box>
    </Paper>
  );
};

export default CricketPlayerBox;

