import React from "react";
import { Box } from "@mui/material";
import NumberDrawer from "../number-drawer/number-drawer";

interface AnimatedNumberProps {
  number: number;
  fontSize?: number;
  prefix?: string;
  color?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  number,
  fontSize = 14,
  prefix,
  color,
}) => {
  // Convert number to array of digits
  const digits = number.toString().split("").map(Number) as Array<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        color: color || "inherit",
      }}
    >
      {prefix && (
        <Box
          component="span"
          sx={{
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
          }}
        >
          {prefix}
        </Box>
      )}
      {digits.map((digit, index) => (
        <NumberDrawer key={`${number}-${index}`} number={digit} fontSize={fontSize} />
      ))}
    </Box>
  );
};

export default AnimatedNumber;

