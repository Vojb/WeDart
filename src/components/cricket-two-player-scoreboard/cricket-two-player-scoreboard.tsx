import React, { useEffect, useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CricketPlayer } from "../../store/useCricketStore";
import CountUp from "../count-up/count-up";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface CricketTwoPlayerScoreboardProps {
  players: CricketPlayer[];
  currentPlayerIndex: number;
  legsWon: Record<number, number>;
  totalLegs: number;
  avgMarksPerRoundByPlayer: Record<number, number>;
}

interface ScoreRingProps {
  player: CricketPlayer;
  color: string;
  isCurrent: boolean;
  mprValue?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = ({ player, color, isCurrent, mprValue }) => {
  const theme = useTheme();
  const outerRingSize = { xs: 86, sm: 100 };
  const ringSize = { xs: 76, sm: 88 };
  const innerRingSize = { xs: 58, sm: 68 };
  const ringTrackColor = useMemo(
    () => alpha(theme.palette.text.primary, 0.12),
    [theme.palette.text.primary]
  );
  const ringStartColor = useMemo(
    () => alpha(color, 0.75),
    [color]
  );
  const ringEndColor = useMemo(
    () => alpha(color, 0.45),
    [color]
  );
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
  const completionPercent = useMemo(() => {
    const maxHits = player.targets.length * 3;
    const totalHits = player.targets.reduce((sum, target) => sum + target.hits, 0);
    return maxHits > 0 ? (totalHits / maxHits) * 100 : 0;
  }, [player.targets]);
  const percentMotion = useMotionValue(completionPercent);
  const percentSpring = useSpring(percentMotion, {
    stiffness: 160,
    damping: 22,
    mass: 0.9,
  });
  const ringBackground = useTransform(percentSpring, (value) => {
    const clamped = Math.max(0, Math.min(100, value));
    const zeroThreshold = isCurrent ? 0.01 : 0.5;
    if (clamped <= zeroThreshold) {
      return `conic-gradient(from 0deg, ${ringTrackColor} 0%, ${ringTrackColor} 100%), ${dartboardBackground}`;
    }
    return `conic-gradient(from 0deg, ${ringStartColor} 0%, ${ringEndColor} ${clamped}%, ${ringTrackColor} ${clamped}%, ${ringTrackColor} 100%), ${dartboardBackground}`;
  });

  useEffect(() => {
    percentMotion.set(completionPercent);
  }, [completionPercent, percentMotion]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box
        sx={{
          width: outerRingSize,
          height: outerRingSize,
          minWidth: outerRingSize,
          minHeight: outerRingSize,
          flexShrink: 0,
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          backgroundImage: dartboardBackground,
          padding: { xs: "4px", sm: "6px" },
          boxSizing: "border-box",
        }}
      >
        <Box
          component={motion.div}
          sx={{
            width: ringSize,
            height: ringSize,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 6px ${alpha(color, 0.12)}, 0 10px 22px ${alpha(
              theme.palette.common.black,
              0.18
            )}`,
            position: "relative",
            border: isCurrent
              ? `2px solid ${alpha(color, 0.85)}`
              : `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
          style={{
            backgroundImage: ringBackground,
          }}
        >
          <Box
            sx={{
              width: innerRingSize,
              height: innerRingSize,
              minWidth: innerRingSize,
              minHeight: innerRingSize,
              flexShrink: 0,
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              backgroundColor: alpha(theme.palette.common.black, 0.7),
              backgroundImage: `radial-gradient(circle at 50% 50%, ${alpha(
                theme.palette.common.black,
                0.7
              )} 0 68%, ${alpha(theme.palette.common.black, 0.45)} 68% 100%), ${dartboardBackground}`,
              backgroundBlendMode: "normal",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.2,
            }}
          >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.2rem", sm: "1.35rem" },
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
          {typeof mprValue === "number" && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "0.45rem", sm: "0.6rem" },
                letterSpacing: 0.5,
                color: alpha(color, 0.85),
              }}
            >
              MPR {mprValue.toFixed(1)}
            </Typography>
          )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const CricketTwoPlayerScoreboard: React.FC<CricketTwoPlayerScoreboardProps> = ({
  players,
  currentPlayerIndex,
  legsWon,
  totalLegs,
  avgMarksPerRoundByPlayer,
}) => {
  const theme = useTheme();
  const firstToLegs = totalLegs;
  const leftPlayer = players[0];
  const rightPlayer = players[1];
  const leftMpr = avgMarksPerRoundByPlayer[leftPlayer.id] ?? 0;
  const rightMpr = avgMarksPerRoundByPlayer[rightPlayer.id] ?? 0;
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
  <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          justifyItems: "stretch",
        }}
      >
        <Box sx={{ flex:1,display: "flex",flexDirection: "column", gap:1,alignItems: "center", justifyContent: "center", width: "100%" }}>
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
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
         
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
                  alignItems: "center",
                  flexDirection: "column",
                  gap: { xs: 0.6, sm: 0.8 },
                  width: "100%",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.35,
                    alignItems: "center",
                  }}
                >
                  <ScoreRing
                    player={leftPlayer}
                    color={
                      currentPlayerIndex === 0
                        ? theme.palette.primary.main
                        : alpha(theme.palette.primary.main, 0.65)
                    }
                    isCurrent={currentPlayerIndex === 0}
                    mprValue={leftMpr}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: "center", px: 1,flex:0.5 }}>
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
        </Box>

        <Box sx={{ flex:1,display: "flex",gap:1, justifyContent: "center", width: "100%",flexDirection: "column", alignItems: "center" }}>
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
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
           
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
                  flexDirection: "column",
                  gap: { xs: 0.6, sm: 0.8 },
                  width: "100%",
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.35,
                    alignItems: "center",
                  }}
                >
                  <ScoreRing
                    player={rightPlayer}
                    color={
                      currentPlayerIndex === 1
                        ? theme.palette.secondary.main
                        : alpha(theme.palette.secondary.main, 0.65)
                    }
                    isCurrent={currentPlayerIndex === 1}
                    mprValue={rightMpr}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default React.memo(CricketTwoPlayerScoreboard);

