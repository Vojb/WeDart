import React from "react";
import { Container } from "@mui/material";
import ResumeGames from "../components/resume-games/resume-games";

const OngoingGames: React.FC = () => (
  <Container maxWidth="md" sx={{ py: 3 }}>
    <ResumeGames title="Ongoing games" showEmptyState />
  </Container>
);

export default OngoingGames;
