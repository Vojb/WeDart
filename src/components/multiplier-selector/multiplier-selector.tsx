import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import VibrationButton from "../VibrationButton";

interface MultiplierSelectorProps {
  onSelect: (multiplier: number) => void;
  onCancel: () => void;
  selectedNumber: number | string;
  isValidTarget: boolean;
}

const MultiplierSelector: React.FC<MultiplierSelectorProps> = ({
  onSelect,
  onCancel,
  selectedNumber,
  isValidTarget,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: alpha(theme.palette.common.black, 0.5),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: 1,
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 3,
          maxWidth: 400,
          width: "100%",
          boxShadow: theme.shadows[10],
        }}
      >
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            mb: 2,
            fontWeight: 600,
          }}
        >
          {isValidTarget ? (
            <>Select Multiplier for {selectedNumber}</>
          ) : (
            <>NOT A HIDDEN NUMBER</>
          )}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <VibrationButton
            variant="contained"
            color="primary"
            onClick={() => onSelect(1)}
            vibrationPattern={50}
            size="large"
            fullWidth
            sx={{ py: 1.5, fontSize: "1.1rem" }}
          >
            Single (1x)
          </VibrationButton>
          <VibrationButton
            variant="contained"
            color="secondary"
            onClick={() => onSelect(2)}
            vibrationPattern={50}
            size="large"
            fullWidth
            sx={{ py: 1.5, fontSize: "1.1rem" }}
          >
            Double (2x)
          </VibrationButton>
          <VibrationButton
            variant="contained"
            color="error"
            onClick={() => onSelect(3)}
            vibrationPattern={50}
            size="large"
            fullWidth
            sx={{ py: 1.5, fontSize: "1.1rem" }}
          >
            Triple (3x)
          </VibrationButton>
        </Box>
        <VibrationButton
          variant="outlined"
          onClick={onCancel}
          vibrationPattern={30}
          fullWidth
        >
          Cancel
        </VibrationButton>
      </Box>
    </Box>
  );
};

export default MultiplierSelector;

