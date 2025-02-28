import { Box, Typography, Paper } from "@mui/material";

export default function History() {
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
}
