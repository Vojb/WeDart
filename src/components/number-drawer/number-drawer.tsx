import React from "react";
import { Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

interface NumberDrawerProps {
  number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  fontSize?: number;
}

const NumberDrawer: React.FC<NumberDrawerProps> = ({ number, fontSize = 14 }) => {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
        lineHeight: 1,
        minWidth: `${fontSize * 0.6}px`,
        textAlign: "center",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={number}
          initial={{ y: fontSize, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -fontSize, opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            display: "inline-block",
          }}
        >
          {number}
        </motion.span>
      </AnimatePresence>
    </Box>
  );
};

export default NumberDrawer;

