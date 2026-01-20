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
}

const ScoreRing: React.FC<ScoreRingProps> = ({ player, color, isCurrent }) => {
  const theme = useTheme();
  const ringTrackColor = useMemo(
    () => alpha(theme.palette.text.primary, 0.12),
    [theme.palette.text.primary]
  );
  const ringStartColor = useMemo(
    () => alpha(color, 0.95),
    [color]
  );
  const ringEndColor = useMemo(
    () => alpha(color, 0.55),
    [color]
  );
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
    return `conic-gradient(${ringStartColor} 0%, ${ringEndColor} ${clamped}%, ${ringTrackColor} ${clamped}%, ${ringTrackColor} 100%)`;
  });

  useEffect(() => {
    percentMotion.set(completionPercent);
  }, [completionPercent, percentMotion]);

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
          background: ringBackground,
        }}
      >
        <Box
          sx={{
            width: { xs: 58, sm: 68 },
            height: { xs: 58, sm: 68 },
            borderRadius: "50%",
            backgroundColor: theme.palette.background.paper,
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
  const firstToLegs = Math.ceil(totalLegs / 2);
  const leftPlayer = players[0];
  const rightPlayer = players[1];
  const leftMpr = avgMarksPerRoundByPlayer[leftPlayer.id] ?? 0;
  const rightMpr = avgMarksPerRoundByPlayer[rightPlayer.id] ?? 0;

  return (
  <>
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
            backgroundColor:
              currentPlayerIndex === 0
                ? alpha(theme.palette.primary.main, 0.35)
                : alpha(theme.palette.primary.main, 0.2),
            border: `1px solid ${alpha(
              theme.palette.primary.main,
              currentPlayerIndex === 0 ? 0.7 : 0.4
            )}`,
            position: "relative",
            boxShadow:
              currentPlayerIndex === 0
                ? `0 0 12px ${alpha(theme.palette.primary.main, 0.35)}`
                : "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.6,
              width: "100%",
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
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: 0.4,
                color: alpha(theme.palette.text.primary, 0.85),
                textAlign: "center",
              }}
            >
              MPR {leftMpr.toFixed(1)}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor:
              currentPlayerIndex === 1
                ? alpha(theme.palette.secondary.main, 0.35)
                : alpha(theme.palette.secondary.main, 0.2),
            border: `1px solid ${alpha(
              theme.palette.secondary.main,
              currentPlayerIndex === 1 ? 0.7 : 0.4
            )}`,
            textAlign: "right",
            position: "relative",
            boxShadow:
              currentPlayerIndex === 1
                ? `0 0 12px ${alpha(theme.palette.secondary.main, 0.35)}`
                : "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.6,
              width: "100%",
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
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.45)}`,
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: 0.4,
                color: alpha(theme.palette.text.primary, 0.85),
                textAlign: "center",
              }}
            >
              MPR {rightMpr.toFixed(1)}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          justifyItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <ScoreRing
            player={leftPlayer}
            color={
              currentPlayerIndex === 0
                ? theme.palette.primary.main
                : alpha(theme.palette.primary.main, 0.65)
            }
            isCurrent={currentPlayerIndex === 0}
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
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <ScoreRing
            player={rightPlayer}
            color={
              currentPlayerIndex === 1
                ? theme.palette.secondary.main
                : alpha(theme.palette.secondary.main, 0.65)
            }
            isCurrent={currentPlayerIndex === 1}
          />
        </Box>
      </Box>
    </>
  );
};

export default React.memo(CricketTwoPlayerScoreboard);

