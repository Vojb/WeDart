import React from "react";
import { Box } from "@mui/material";

export interface BullSymbolProps {
  /** CSS size (default: scales with parent `font-size` via `em`) */
  size?: string | number;
  title?: string;
}

/** Dartboard bull: green outer (25) + red inner (double bull), for labels and buttons. */
const BullSymbol: React.FC<BullSymbolProps> = ({
  size = "0.95em",
  title = "Bull",
}) => {
  const dim = typeof size === "number" ? `${size}px` : size;

  return (
    <Box
      component="span"
      role="img"
      aria-label={title}
      title={title}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        width: dim,
        height: dim,
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="#2e7d32"
          stroke="#ffffff"
          strokeWidth="1.25"
        />
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="#c62828"
          stroke="#ffffff"
          strokeWidth="1"
        />
      </svg>
    </Box>
  );
};

export default BullSymbol;
