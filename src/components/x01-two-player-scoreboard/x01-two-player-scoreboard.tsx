import React, { useEffect, useMemo } from "react";
import { Box, Chip, Paper, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GamePlayer } from "../../store/useX01Store";
import checkoutGuide from "../../utils/checkoutGuide";

interface X01TwoPlayerScoreboardProps {
  players: GamePlayer[];
  currentPlayerIndex: number;
  legsWon: Record<number, number>;
  totalLegs: number;
  gameType: string;
}

interface ScoreRingProps {
  player: GamePlayer;
  color: string;
  side: "left" | "right";
}

const ScoreRing: React.FC<ScoreRingProps> = ({ player, color, side }) => {
  const theme = useTheme();
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
    return `conic-gradient(from 0deg, ${color} 0% ${clamped}%, ${ringTrackColor} ${clamped}% 100%), ${dartboardBackground}`;
  });

  useEffect(() => {
    percentMotion.set(scorePercent);
  }, [scorePercent, percentMotion]);

  const showCheckoutGuide = player.score <= 170 && player.score > 1;
  const checkoutPath = showCheckoutGuide ? checkoutGuide[player.score] : null;
  const checkoutParts = checkoutPath?.split(" ").filter(Boolean) ?? [];
  const chipSlots = [
    { top: 0, offset: -20 },
    { top: 25, offset: -30 },
    { top: 50, offset: -20 },
  ];
  const slotIndices =
    checkoutParts.length === 1
      ? [1]
      : checkoutParts.length === 2
        ? [0, 2]
        : [0, 1, 2];

  const avgPerRound =
    typeof player.avgPerRound === "number"
      ? player.avgPerRound
      : player.dartsThrown > 0
        ? (player.initialScore - player.score) /
          Math.ceil(player.dartsThrown / 3)
        : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box
        component={motion.div}
        sx={{
          width: { xs: 76, sm: 88 },
          height: { xs: 76, sm: 88 },
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 6px ${alpha(color, 0.12)}`,
          position: "relative",
        }}
        style={{
          backgroundImage: ringBackground,
        }}
      >
        {checkoutParts.length > 0 &&
          checkoutParts.map((part, index) => {
            const slot = chipSlots[slotIndices[index] ?? 1];
            return (
              <Box
                key={`${part}-${index}`}
                sx={{
                  position: "absolute",
                  top: slot.top,
                  ...(side === "left"
                    ? { right: slot.offset }
                    : { left: slot.offset }),
                  px: 0.6,
                  py: 0.2,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: `0 2px 6px ${alpha(
                    theme.palette.common.black,
                    0.12
                  )}`,
                  pointerEvents: "none",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.6rem",
                    lineHeight: 1.1,
                    color: alpha(theme.palette.text.primary, 0.8),
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  {part}
                </Typography>
              </Box>
            );
          })}
        <Box
          sx={{
            width: { xs: 58, sm: 68 },
            height: { xs: 58, sm: 68 },
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
              fontSize: { xs: "1.4rem", sm: "1.65rem" },
              lineHeight: 1.1,
            }}
          >
            {player.score}
          </Typography>
        </Box>
      </Box>
      <Chip
        label={`Avg ${avgPerRound.toFixed(1)}`}
        size="small"
        sx={{
          mt: 0.75,
          height: 22,
          fontWeight: 700,
          fontSize: "0.65rem",
          backgroundColor: alpha(color, 0.12),
          color: alpha(theme.palette.text.primary, 0.85),
        }}
      />
    </Box>
  );
};

const X01TwoPlayerScoreboard: React.FC<X01TwoPlayerScoreboardProps> = ({
  players,
  currentPlayerIndex,
  legsWon,
  totalLegs,
  gameType,
}) => {
  const theme = useTheme();
  const firstToLegs = Math.ceil(totalLegs / 2);
  const leftPlayer = players[0];
  const rightPlayer = players[1];

  return (
    <Paper
      sx={{
        width: "100%",
        borderRadius: 2,
        marginTop: 1,
        marginLeft: 1,
        marginBottom: 0.1,
        marginRight: 1,
        padding: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
            pt: 0,
            gap: 2,
            pb: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.25),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
            position: "relative",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
            }}
          >
            {leftPlayer.name}
          </Typography>
          {leftPlayer.lastRoundScore > 0 && (
            <Box
              sx={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                px: 0.5,
                py: 0.25,
                borderRadius: 999,
                backgroundColor: alpha(theme.palette.primary.main, 0.55),
                color: theme.palette.primary.contrastText,
                fontSize: "0.65rem",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {leftPlayer.lastRoundScore}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.secondary.main, 0.25),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
            textAlign: "right",
            position: "relative",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontSize: { xs: "0.75rem", sm: "0.85rem" },
            }}
          >
            {rightPlayer.name}
          </Typography>
          {rightPlayer.lastRoundScore > 0 && (
            <Box
              sx={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                px: 0.5,
                py: 0.25,
                borderRadius: 999,
                backgroundColor: alpha(theme.palette.secondary.main, 0.55),
                color: theme.palette.secondary.contrastText,
                fontSize: "0.65rem",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {rightPlayer.lastRoundScore}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
          <ScoreRing
            player={leftPlayer}
            color={
              currentPlayerIndex === 0
                ? theme.palette.primary.main
                : alpha(theme.palette.primary.main, 0.65)
            }
            side="left"
          />
        </Box>

        <Box sx={{ textAlign: "center", px: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: { xs: "0.65rem", sm: "0.7rem" },
            }}
          >
            First to {firstToLegs}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              lineHeight: 1.1,
            }}
          >
            {legsWon[leftPlayer.id] || 0} - {legsWon[rightPlayer.id] || 0}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: { xs: "0.65rem", sm: "0.7rem" },
            }}
          >
            Legs
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.25,
              fontSize: { xs: "0.6rem", sm: "0.7rem" },
              color: alpha(theme.palette.text.secondary, 0.8),
            }}
          >
            {gameType}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <ScoreRing
            player={rightPlayer}
            color={
              currentPlayerIndex === 1
                ? theme.palette.secondary.main
                : alpha(theme.palette.secondary.main, 0.65)
            }
            side="right"
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default X01TwoPlayerScoreboard;

