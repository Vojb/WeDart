import { Box, Typography, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import React from "react";

const X01: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Typography variant="h4" gutterBottom>
          X01 Game
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/x01/new")}
          >
            New Game
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default X01;
