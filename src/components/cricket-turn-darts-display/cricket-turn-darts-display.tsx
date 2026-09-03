import React, { useMemo } from "react";
import { Box, Typography, alpha } from "@mui/material";
import BullSymbol from "../bull-symbol/bull-symbol";
import {
  collapseMarksToVisitDarts,
  type CricketVisitDart,
} from "../../utils/cricketVisitDarts";

export type CricketTurnDart = CricketVisitDart;

interface CricketTurnDartsDisplayProps {
  darts: CricketTurnDart[];
  accentColor: string;
  /** Ghost placeholders when the visit is empty / short (default 3). */
  minSlots?: number;
}

const formatTargetLabel = (
  targetNumber: number | string,
  multiplier: number,
): React.ReactNode => {
  if (targetNumber === "Miss") return "Miss";
  if (targetNumber === "Bonus") return "Bonus";
  if (targetNumber === "Bull") {
    if (multiplier >= 2) return <>D<BullSymbol /></>;
    return <BullSymbol />;
  }
  if (targetNumber === "Double") return "D";
  if (targetNumber === "Triple") return "T";

  const label = String(targetNumber);
  if (multiplier >= 3) return `T${label}`;
  if (multiplier === 2) return `D${label}`;
  return label;
};

const CricketTurnDartsDisplay: React.FC<CricketTurnDartsDisplayProps> = ({
  darts,
  accentColor,
  minSlots = 3,
}) => {
  const visitDarts = useMemo(() => collapseMarksToVisitDarts(darts), [darts]);
  const slotCount = Math.max(minSlots, visitDarts.length);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        gap: { xs: 0.5, sm: 0.75 },
        width: "100%",
        height: "100%",
        minHeight: 0,
        alignSelf: "stretch",
      }}
      aria-label={
        visitDarts.length === 0
          ? "No darts this turn yet"
          : `This turn: ${visitDarts.length} dart${visitDarts.length === 1 ? "" : "s"}`
      }
    >
      {Array.from({ length: slotCount }, (_, index) => {
        const dart = visitDarts[index];
        const filled = Boolean(dart);
        const isNext = !filled && index === visitDarts.length;
        const showPoints = filled && dart.points > 0;

        return (
          <Box
            key={index}
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: { xs: 96, sm: 120 },
              height: "100%",
              alignSelf: "stretch",
              px: 0.5,
              py: 0.25,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.15,
              borderRadius: 1,
              containerType: "size",
              border: `2px ${isNext ? "dashed" : "solid"}`,
              borderColor: filled
                ? alpha(accentColor, 0.45)
                : isNext
                  ? alpha(accentColor, 0.55)
                  : alpha(accentColor, 0.2),
              backgroundColor: filled
                ? alpha(accentColor, 0.12)
                : "transparent",
              transition: "border-color 0.15s ease, background-color 0.15s ease",
              overflow: "hidden",
            }}
          >
            {filled ? (
              <>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 800,
                    fontSize: showPoints
                      ? "clamp(0.95rem, 48cqh, 2.75rem)"
                      : "clamp(1rem, 58cqh, 3rem)",
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.12em",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTargetLabel(dart.targetNumber, dart.multiplier)}
                </Typography>
                {showPoints && (
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontSize: "clamp(0.65rem, 22cqh, 1.15rem)",
                      color: "secondary.main",
                      lineHeight: 1,
                      maxWidth: "100%",
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{dart.points}
                  </Typography>
                )}
              </>
            ) : (
              <Typography
                component="span"
                sx={{
                  fontSize: "clamp(0.7rem, 28cqh, 1.35rem)",
                  color: alpha(accentColor, isNext ? 0.7 : 0.35),
                  fontWeight: 700,
                  lineHeight: 1.1,
                  textAlign: "center",
                  px: 0.25,
                }}
              >
                Dart {index + 1}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default CricketTurnDartsDisplay;
export { collapseMarksToVisitDarts } from "../../utils/cricketVisitDarts";
