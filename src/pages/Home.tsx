import { Button, Typography, Box, Paper } from "@mui/material";
import { useStore } from "../store/useStore";

export default function Home() {
  const { count, increment, decrement } = useStore();

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper sx={{ p: 3, height: "100%" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Count: {count}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={increment}>
            Increment
          </Button>
          <Button variant="outlined" onClick={decrement}>
            Decrement
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
