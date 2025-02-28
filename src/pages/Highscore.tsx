import { Box, Typography, Paper } from "@mui/material";

export default function Highscore() {
  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 2, height: "100%" }}>
        <Typography variant="h4" gutterBottom>
          Highscores
        </Typography>
        <Typography>Coming soon...</Typography>
      </Paper>
    </Box>
  );
}
