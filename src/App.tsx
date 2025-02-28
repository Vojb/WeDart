import { Box } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import X01 from "./pages/X01";
import Home from "./pages/Home";
import History from "./pages/History";
import Highscore from "./pages/Highscore";
import X01NewGame from "./pages/X01NewGame";
import X01Game from "./pages/X01Game";
import Players from "./pages/Players";

function App() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "-webkit-fill-available", // Fix for iOS Safari
      }}
    >
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "calc(100vh - 56px)", // Subtract navbar height
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/x01" element={<X01 />} />
          <Route path="/x01/new" element={<X01NewGame />} />
          <Route path="/x01/game" element={<X01Game />} />
          <Route path="/history" element={<History />} />
          <Route path="/highscore" element={<Highscore />} />
          <Route path="/players" element={<Players />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
