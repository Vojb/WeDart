import React from "react";
import { Box, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useStore } from "../../store/useStore";

const VIEWBOX = 64;
const CENTER = VIEWBOX / 2;
const LINE_LENGTH = 52;
const STROKE = 6;
const CIRCLE_R = 24;

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
} as const;

interface CricketMarkProps {
  hits: number;
  color?: string;
  padding: string;
}

const CricketMark: React.FC<CricketMarkProps> = ({ hits, color, padding }) => {
  const theme = useTheme();
  const performanceMode = useStore((state) => state.performanceMode);
  const stroke = color || theme.palette.primary.main;
  const boxSx = {
    width: "100%",
    height: "100%",
    flex: 1,
    minHeight: 0,
    p: padding,
    boxSizing: "border-box" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  };

  if (hits <= 0) {
    return null;
  }

  if (performanceMode) {
    return (
      <Box sx={boxSx}>
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          preserveAspectRatio="xMidYMid meet"
          style={svgStyle}
        >
          <line
            x1={CENTER - LINE_LENGTH / 2}
            y1={CENTER - LINE_LENGTH / 2}
            x2={CENTER + LINE_LENGTH / 2}
            y2={CENTER + LINE_LENGTH / 2}
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {hits >= 2 && (
            <line
              x1={CENTER + LINE_LENGTH / 2}
              y1={CENTER - LINE_LENGTH / 2}
              x2={CENTER - LINE_LENGTH / 2}
              y2={CENTER + LINE_LENGTH / 2}
              stroke={stroke}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          )}
          {hits >= 3 && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={CIRCLE_R}
              stroke={stroke}
              strokeWidth={STROKE}
              fill="none"
            />
          )}
        </svg>
      </Box>
    );
  }

  if (hits >= 3) {
    return (
      <Box sx={boxSx}>
        <motion.svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          preserveAspectRatio="xMidYMid meet"
          style={svgStyle}
        >
          <motion.line
            x1={CENTER - LINE_LENGTH / 2}
            y1={CENTER - LINE_LENGTH / 2}
            x2={CENTER + LINE_LENGTH / 2}
            y2={CENTER + LINE_LENGTH / 2}
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.line
            x1={CENTER + LINE_LENGTH / 2}
            y1={CENTER - LINE_LENGTH / 2}
            x2={CENTER - LINE_LENGTH / 2}
            y2={CENTER + LINE_LENGTH / 2}
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={CIRCLE_R}
            stroke={stroke}
            strokeWidth={STROKE}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>
      </Box>
    );
  }

  return (
    <Box sx={boxSx}>
      <motion.svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio="xMidYMid meet"
        style={svgStyle}
      >
        <motion.line
          x1={CENTER - LINE_LENGTH / 2}
          y1={CENTER - LINE_LENGTH / 2}
          x2={CENTER + LINE_LENGTH / 2}
          y2={CENTER + LINE_LENGTH / 2}
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={hits === 1 ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0 }}
        />
        {hits >= 2 && (
          <motion.line
            x1={CENTER + LINE_LENGTH / 2}
            y1={CENTER - LINE_LENGTH / 2}
            x2={CENTER - LINE_LENGTH / 2}
            y2={CENTER + LINE_LENGTH / 2}
            stroke={stroke}
            strokeWidth={STROKE}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        )}
      </motion.svg>
    </Box>
  );
};

export default React.memo(CricketMark);
