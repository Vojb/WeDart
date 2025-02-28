import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useStore } from "../store/useStore";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { themeMode, toggleTheme } = useStore();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WeDart
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography>Home</Typography>
          </Link>
          <Link to="/x01" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography>X01</Typography>
          </Link>
          <Link
            to="/players"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Typography>Players</Typography>
          </Link>
          <Link
            to="/history"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Typography sx={{ color: "text.disabled" }}>History</Typography>
          </Link>
          <Link
            to="/highscore"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Typography sx={{ color: "text.disabled" }}>Highscore</Typography>
          </Link>
          <IconButton onClick={toggleTheme} color="inherit">
            {themeMode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
