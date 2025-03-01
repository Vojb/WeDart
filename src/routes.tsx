import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

// Import all page components
import Home from "./pages/Home";
import X01 from "./pages/X01";
import X01NewGame from "./pages/X01NewGame";
import X01Game from "./pages/X01Game";
import History from "./pages/History";
import Highscore from "./pages/Highscore";
import Players from "./pages/Players";
import { Box } from "@mui/material";

// Create a layout route component that applies the layout to all children
const LayoutRoute = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Create a game layout route that doesn't include the navbar
const GameLayoutRoute = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Outlet />
    </Box>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutRoute />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "x01",
        element: <X01 />,
      },
      {
        path: "x01/new",
        element: <X01NewGame />,
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "highscore",
        element: <Highscore />,
      },
      {
        path: "players",
        element: <Players />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      // Catch-all route
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: "/x01/game",
    element: <GameLayoutRoute />,
    children: [
      {
        index: true,
        element: <X01Game />,
      },
    ],
  },
]);
