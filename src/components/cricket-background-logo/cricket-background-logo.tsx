import React from "react";
import { Box } from "@mui/material";
import { useStore } from "../../store/useStore";
import {
  CRICKET_BACKGROUND_LOGO_OPACITY,
  cricketBackgroundLogoOptions,
} from "../../constants/cricketBackgroundLogos";

const CricketBackgroundLogo: React.FC = () => {
  const {
    cricketBackgroundLogoEnabled,
    cricketBackgroundLogoId,
    cricketBackgroundLogoCustomUrl,
  } = useStore();

  if (!cricketBackgroundLogoEnabled || cricketBackgroundLogoId === "none") {
    return null;
  }

  const src =
    cricketBackgroundLogoId === "custom"
      ? cricketBackgroundLogoCustomUrl
      : (cricketBackgroundLogoOptions.find(
          (option) => option.id === cricketBackgroundLogoId,
        )?.src ?? null);

  if (!src) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden
        sx={{
          maxWidth: "min(95vw, 460px)",
          maxHeight: "min(95vh, 460px)",
          width: "auto",
          height: "auto",
          opacity: CRICKET_BACKGROUND_LOGO_OPACITY,
          userSelect: "none",
        }}
      />
    </Box>
  );
};

export default CricketBackgroundLogo;
