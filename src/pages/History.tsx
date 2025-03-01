import { Box, Typography, Paper } from "@mui/material";
import React from "react";

const History: React.FC = () => {
  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 2, height: "100%" }}>
        <Typography variant="h4" gutterBottom>
          Game History
        </Typography>
        <Typography>Coming soon...</Typography>
      </Paper>
    </Box>
  );
};

export default History;
