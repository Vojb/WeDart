import { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import Navbar from "./Navbar";

// Simple layout component that doesn't use Router hooks
interface LayoutProps {
  children: ReactNode;
  isGameRoute?: boolean;
}

export default function Layout({ children, isGameRoute = false }: LayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!isGameRoute && <Navbar />}
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
          display: "flex",
          flexDirection: "column",
          height: isGameRoute ? "100vh" : "calc(100vh - 56px)", // Full height for game, subtract navbar height otherwise
          overflow: "hidden",
        }}
        maxWidth="lg"
      >
        {children}
      </Container>
    </Box>
  );
}
