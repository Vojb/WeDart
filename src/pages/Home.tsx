import { Typography, Box, Paper } from "@mui/material";
import { useStore } from "../store/useStore";
import React from "react";

const Home: React.FC = () => {
  const { count } = useStore();

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Count: {count}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
