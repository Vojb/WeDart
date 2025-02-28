import { Box, Container } from "@mui/material";
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
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 56px)", // Subtract navbar height
          overflow: "hidden",
        }}
        maxWidth="lg"
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
      </Container>
    </Box>
  );
}

export default App;
