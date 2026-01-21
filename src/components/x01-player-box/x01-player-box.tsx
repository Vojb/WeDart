import React, { useEffect, useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { alpha } from "@mui/material/styles";
import checkoutGuide from "../../utils/checkoutGuide";
import { GamePlayer } from "../../store/useX01Store";

interface X01PlayerBoxProps {
  player: GamePlayer;
  isCurrentPlayer: boolean;
  showRoundAvg: boolean;
  onToggleAvgView: () => void;
  legsWon: number;
}

const X01PlayerBox: React.FC<X01PlayerBoxProps> = ({
  player,
  isCurrentPlayer,
  showRoundAvg,
  onToggleAvgView,
  legsWon,
}) => {
  const theme = useTheme();
  const playerInitialScore = player.initialScore;
  const playerPointsScored = playerInitialScore - player.score;
  const playerDartsThrown = player.dartsThrown || 1;
  const playerRoundsPlayed = Math.ceil(playerDartsThrown / 3);

  const playerAvgPerDart = (playerPointsScored / playerDartsThrown).toFixed(1);
  const playerAvgPerRound = (
    playerPointsScored / playerRoundsPlayed || 0
  ).toFixed(1);

  const showCheckoutGuide = player.score <= 170 && player.score > 1;
  const checkoutPath = showCheckoutGuide ? checkoutGuide[player.score] : null;

  const ringColor = isCurrentPlayer
    ? theme.palette.primary.main
    : alpha(theme.palette.text.primary, 0.45);
  const ringTrackColor = alpha(theme.palette.text.primary, 0.12);
  const dartboardBackground = useMemo(() => {
    const segmentLight = alpha(theme.palette.text.primary, 0.08);
    const segmentDark = alpha(theme.palette.text.primary, 0.18);
    const bullInner = alpha(theme.palette.error.main, 0.7);
    const bullOuter = alpha(theme.palette.success.main, 0.6);
    const ringLight = alpha(theme.palette.text.primary, 0.1);
    const ringDark = alpha(theme.palette.text.primary, 0.2);
    const outerRing = alpha(theme.palette.text.primary, 0.12);
    const baseFill = alpha(theme.palette.background.paper, 0.18);

    return [
      `repeating-conic-gradient(from -9deg, ${segmentLight} 0deg 18deg, ${segmentDark} 18deg 36deg)`,
      `radial-gradient(circle at 50% 50%, ${bullInner} 0 6%, ${bullOuter} 6% 12%, ${ringLight} 12% 30%, ${ringDark} 30% 34%, ${ringLight} 34% 48%, ${outerRing} 48% 52%, ${baseFill} 52% 100%)`,
    ].join(", ");
  }, [
    theme.palette.background.paper,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.text.primary,
  ]);
  const scorePercent = Math.max(
    0,
    Math.min(100, (player.score / player.initialScore) * 100)
  );
  const percentMotion = useMotionValue(scorePercent);
  const percentSpring = useSpring(percentMotion, {
    stiffness: 180,
    damping: 22,
    mass: 0.9,
  });
  const ringBackground = useTransform(percentSpring, (value) => {
    const clamped = Math.max(0, Math.min(100, value));
    return `conic-gradient(from 0deg, ${ringColor} 0% ${clamped}%, ${ringTrackColor} ${clamped}% 100%), ${dartboardBackground}`;
  });

  useEffect(() => {
    percentMotion.set(scorePercent);
  }, [scorePercent, percentMotion]);

  return (
    <Paper
      sx={{
        p: { xs: 0.75, sm: 1 },
        flex: "1 1 0",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        background: isCurrentPlayer
          ? `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.16
            )} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`
          : theme.palette.background.paper,
        boxShadow: isCurrentPlayer
          ? `0 6px 18px ${alpha(theme.palette.primary.main, 0.18)}`
          : "none",
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        gap={0.5}
        justifyContent="space-between"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography
              variant="body1"
              noWrap
              sx={{
                fontSize: { xs: "0.8rem", sm: "1rem" },
                fontWeight: 600,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              {player.name}
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
            }}
          >
            {legsWon}
          </Typography>
          {player.lastRoundScore === 0 && player.scores.length > 0 ? (
            <Typography
              variant="body2"
              sx={{
                opacity: 0.3,
                color: "error.main",
                position: "absolute",
                top: 4,
                right: 8,
                fontWeight: "bold",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
              }}
            >
              Bust
            </Typography>
          ) : player.lastRoundScore > 0 ? (
            <Typography
              variant="body2"
              sx={{
                opacity: 0.3,
                color: "text.secondary",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                position: "absolute",
                top: 6,
                right: 8,
              }}
            >
              {player.lastRoundScore}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            mt: 0.75,
          }}
        >
          <Box
            component={motion.div}
            sx={{
              width: { xs: 70, sm: 80 },
              height: { xs: 70, sm: 80 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 6px ${alpha(ringColor, 0.12)}`,
              position: "relative",
            }}
            style={{
              backgroundImage: ringBackground,
            }}
          >
            <Box
              sx={{
                width: { xs: 54, sm: 62 },
                height: { xs: 54, sm: 62 },
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.common.black, 0.7),
                backgroundImage: `radial-gradient(circle at 50% 50%, ${alpha(
                  theme.palette.common.black,
                  0.7
                )} 0 68%, ${alpha(
                  theme.palette.common.black,
                  0.45
                )} 68% 100%), ${dartboardBackground}`,
                backgroundBlendMode: "normal",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.4rem", sm: "1.6rem" },
                  lineHeight: 1.1,
                }}
              >
                {player.score}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 1 },
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              cursor: "pointer",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
            }}
            onClick={onToggleAvgView}
          >
            Avg: {showRoundAvg ? playerAvgPerRound : playerAvgPerDart}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          >
            Darts: {player.dartsThrown}
          </Typography>
        </Box>
        {showCheckoutGuide && checkoutPath && (
          <Box
            sx={{
              p: { xs: 0.5, sm: 0.75 },
              borderRadius: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.success.main, 0.2)
                  : alpha(theme.palette.success.main, 0.1),
              border: "1px solid",
              borderColor: "success.main",
              mt: { xs: 0.5, sm: 0.75 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                lineHeight: 1.2,
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.success.light
                    : theme.palette.success.dark,
              }}
            >
              {checkoutPath}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default X01PlayerBox;

