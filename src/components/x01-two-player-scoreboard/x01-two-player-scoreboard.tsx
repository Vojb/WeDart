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
}

interface CheckoutGuideProps {
  parts: string[];
  align: "left" | "right";
  color: string;
}

const CheckoutGuide: React.FC<CheckoutGuideProps> = ({ parts, align, color }) => {
  if (parts.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align === "left" ? "flex-start" : "flex-end",
        height: { xs: 76, sm: 88 },
        minWidth: 36,
      }}
    >
      {parts.map((part, index) => {
        const translateX = align === "left" ? -12 : 12;
        const translateXNotMiddle = align === "left" ? 0 : 0;
        const isMiddle =  parts.length % 2 === 1 && index === Math.floor(parts.length / 2);
      
        return (
          <Box
            key={`${part}-${index}`}
            sx={{
              px: 1,
              py: 0.2,
              mt: 1,
              mb: 1,
              borderRadius: 1,
              backgroundColor: alpha(color, 0.8),
              border: `1px solid ${alpha(color, 0.6)}`,
              boxShadow: `0 2px 6px ${alpha(color, 0.24)}`,
              pointerEvents: "none",
              textAlign: "center",
              transform: isMiddle ? `translateX(${translateX}px)` : `translateX(${translateXNotMiddle}px)`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: "0.6rem",
                lineHeight: 1.1,
                display: "block",
                textAlign: "center",
              }}
            >
              {part}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const ScoreRing: React.FC<ScoreRingProps> = ({ player, color }) => {
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
  const getCheckoutParts = (player: GamePlayer) => {
    if (player.score > 170 || player.score <= 1) {
      return [];
    }
    const checkoutPath = checkoutGuide[player.score];
    return checkoutPath?.split(" ").filter(Boolean) ?? [];
  };
  const leftCheckoutParts = getCheckoutParts(leftPlayer);
  const rightCheckoutParts = getCheckoutParts(rightPlayer);
  const getAvgPerRound = (player: GamePlayer) =>
    typeof player.avgPerRound === "number"
      ? player.avgPerRound
      : player.dartsThrown > 0
        ? (player.initialScore - player.score) /
        Math.ceil(player.dartsThrown / 3)
        : 0;
  const buildPlayerChipSx = (color: string, isCurrent: boolean, align: "left" | "right") => ({
    flex: 1,
    width: "100%",
    maxWidth: { xs: 260, sm: 320, md: 360 },
    px: { xs: 1, sm: 1.25 },
    py: { xs: 0.75, sm: 0.9 },
    borderRadius: 999,
    backgroundImage: `linear-gradient(135deg, ${alpha(color, 0.25)} 0%, ${alpha(
      color,
      0.08
    )} 70%)`,
    border: `1px solid ${alpha(color, isCurrent ? 0.65 : 0.35)}`,
    textAlign: align,
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    boxShadow: isCurrent
      ? `0 14px 26px ${alpha(color, 0.35)}`
      : `0 10px 22px ${alpha(theme.palette.common.black, 0.16)}`,
    transform: isCurrent ? "translateY(-1px)" : "none",
    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: 999,
      border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "45%",
      background: `linear-gradient(180deg, ${alpha(
        theme.palette.common.white,
        0.18
      )}, transparent)`,
      pointerEvents: "none",
    },
  });

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
          alignItems: "center",
          flexDirection: "row",
          justifyItems: "stretch",
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              fontSize: { xs: "0.72rem", sm: "0.9rem" },
              width: "100%",
              maxWidth: { xs: 120, sm: 200 },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
            }}
          >
            {leftPlayer.name}
          </Typography>
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
          }}>

            <Box
              sx={{
                position: "relative",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                width: "100%",
              }}
            >
              <Box
                sx={buildPlayerChipSx(
                  theme.palette.primary.main,
                  currentPlayerIndex === 0,
                  "left"
                )}
              >

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >

                    <ScoreRing
                      player={leftPlayer}
                      color={
                        currentPlayerIndex === 0
                          ? theme.palette.primary.main
                          : alpha(theme.palette.primary.main, 0.65)
                      }
                    />
                  </Box>
                </Box>


              </Box>
              <Box sx={{ position: "absolute", top: 8, left: -12, bottom: 0 }}>
                <CheckoutGuide
                  parts={leftCheckoutParts}
                  align="left"
                  color={theme.palette.primary.main}
                />
              </Box>

            </Box>

            <Chip
              label={`Avg ${getAvgPerRound(leftPlayer).toFixed(1)}`}
              size="small"
              sx={{
                mt: 0.75,
                height: 22,
                fontWeight: 700,
                fontSize: "0.65rem",
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: alpha(theme.palette.text.primary, 0.85),
              }}
            />

          </Box>
        </Box>

        <Box sx={{ textAlign: "center", px: 1, flex: 0.5 }}>
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

        <Box
          sx={{
            flex: 1,
            display: "flex",
            gap: 1,
            justifyContent: "center",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              fontSize: { xs: "0.72rem", sm: "0.9rem" },
              color: alpha(theme.palette.text.primary, 0.92),
              width: "100%",
              maxWidth: { xs: 120, sm: 200 },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
            }}
          >
            {rightPlayer.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                position: "relative",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                width: "100%",
              }}
            >
              <Box
                sx={buildPlayerChipSx(
                  theme.palette.secondary.main,
                  currentPlayerIndex === 1,
                  "right"
                )}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ScoreRing
                      player={rightPlayer}
                      color={
                        currentPlayerIndex === 1
                          ? theme.palette.secondary.main
                          : alpha(theme.palette.secondary.main, 0.65)
                      }
                    />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ position: "absolute", top: 8, right: -12, bottom: 0 }}>
                <CheckoutGuide
                  parts={rightCheckoutParts}
                  align="right"
                  color={theme.palette.secondary.main}
                />
              </Box>
            </Box>
            <Chip
              label={`Avg ${getAvgPerRound(rightPlayer).toFixed(1)}`}
              size="small"
              sx={{
                mt: 0.75,
                height: 22,
                fontWeight: 700,
                fontSize: "0.65rem",
                backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                color: alpha(theme.palette.text.primary, 0.85),
              }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default X01TwoPlayerScoreboard;

