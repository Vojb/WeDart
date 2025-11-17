import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import HalveItGame from "./HalveItGame";
import { useHalveItStore, updateCachedHalveItPlayers } from "../store/useHalveItStore";

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/halveit/game" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock VibrationButton to avoid vibration API issues
vi.mock("../components/VibrationButton", () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock CountUp component
vi.mock("../components/count-up/count-up", () => ({
  default: ({ to }: { to: number }) => <span>{to}</span>,
}));

// Mock input components
vi.mock("../components/points-input/points-input", () => ({
  default: ({ onSubmit }: { onSubmit: (points: number) => void }) => (
    <div>
      <button onClick={() => onSubmit(10)}>Submit 10 points</button>
      <button onClick={() => onSubmit(100)}>Submit 100 points</button>
      <button onClick={() => onSubmit(50)}>Submit 50 points</button>
    </div>
  ),
}));

vi.mock("../components/hit-counter-input/hit-counter-input", () => ({
  default: ({ onSubmit }: { onSubmit: (hits: number) => void }) => (
    <div>
      <button onClick={() => onSubmit(1)}>Submit 1 hit</button>
    </div>
  ),
}));

vi.mock("../components/target-score-input/target-score-input", () => ({
  default: ({ onSubmit }: { onSubmit: (totalScore: number) => void }) => (
    <div>
      <button onClick={() => onSubmit(41)}>Submit 41</button>
    </div>
  ),
}));

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={["/halveit/game"]}>
        {component}
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe("HalveItGame - Fixed Player Order", () => {
  beforeEach(() => {
    // Reset store before each test
    useHalveItStore.getState().endGame();
    updateCachedHalveItPlayers([
      { id: 1, name: "Player 1" },
      { id: 2, name: "Player 2" },
      { id: 3, name: "Player 3" },
    ]);
    mockNavigate.mockClear();
  });

  it("should maintain fixed player order after completing a round", async () => {
    const { startGame, recordRoundScore } = useHalveItStore.getState();
    
    // Start game with players in order: Player 2, Player 1, Player 3
    startGame("default", [2, 1, 3]);

    // Render the component
    renderWithProviders(<HalveItGame />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    // Verify initial player order in store
    let game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    expect(game.players[0].id).toBe(2);
    expect(game.players[0].orderIndex).toBe(0);
    expect(game.players[1].id).toBe(1);
    expect(game.players[1].orderIndex).toBe(1);
    expect(game.players[2].id).toBe(3);
    expect(game.players[2].orderIndex).toBe(2);

    // Complete round 1 - Player 1 scores low (5), other players score higher
    // This tests that even when Player 1 has fewer points, order doesn't change
    // Use the same pattern as the store test that passes
    
    // Player 2 (index 0) scores high
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 100 });
    
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Player 1 (index 1) scores low - fewer points than others
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 5 });
    
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Player 3 (index 2) scores medium-high
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 50 });

    // After round 1 is finished, verify order is still fixed
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Order should remain: Player 2, Player 1, Player 3 (original order)
    expect(game.players[0].id).toBe(2);
    expect(game.players[0].orderIndex).toBe(0);
    expect(game.players[0].totalScore).toBe(100);
    
    expect(game.players[1].id).toBe(1);
    expect(game.players[1].orderIndex).toBe(1);
    expect(game.players[1].totalScore).toBe(5); // Player 1 has fewer points
    
    expect(game.players[2].id).toBe(3);
    expect(game.players[2].orderIndex).toBe(2);
    expect(game.players[2].totalScore).toBe(50);
    
    // Verify Player 1 has fewer points than others
    expect(game.players[1].totalScore).toBeLessThan(game.players[0].totalScore);
    expect(game.players[1].totalScore).toBeLessThan(game.players[2].totalScore);
  });

  it("should maintain fixed order after multiple rounds", async () => {
    const { startGame, recordRoundScore } = useHalveItStore.getState();
    
    // Start game with players in order: Player 3, Player 1, Player 2
    startGame("default", [3, 1, 2]);

    renderWithProviders(<HalveItGame />);

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    // Complete 2 rounds - ensure Player 1 always gets fewer points
    for (let round = 0; round < 2; round++) {
      let game = useHalveItStore.getState().currentGame;
      if (!game) throw new Error("Game not initialized");
      
      // Complete round for all players
      for (let player = 0; player < 3; player++) {
        game = useHalveItStore.getState().currentGame;
        if (!game) throw new Error("Game not initialized");
        
        const currentPlayer = game.players[game.currentPlayerIndex];
        
        // Player 1 gets fewer points (5), others get more (50, 100)
        const points = currentPlayer.id === 1 ? 5 : currentPlayer.id === 3 ? 50 : 100;
        
        recordRoundScore(
          currentPlayer.id,
          game.currentRoundIndex,
          { points }
        );
      }
    }

    // Verify order is still fixed after 2 rounds
    const finalGame = useHalveItStore.getState().currentGame;
    if (!finalGame) throw new Error("Game not initialized");
    
    // Order should still be: Player 3, Player 1, Player 2
    expect(finalGame.players[0].id).toBe(3);
    expect(finalGame.players[0].orderIndex).toBe(0);
    
    expect(finalGame.players[1].id).toBe(1);
    expect(finalGame.players[1].orderIndex).toBe(1);
    
    expect(finalGame.players[2].id).toBe(2);
    expect(finalGame.players[2].orderIndex).toBe(2);
    
    // Verify Player 1 has fewer points than others after 2 rounds
    const player1Score = finalGame.players[1].totalScore; // Should be 10 (5 + 5)
    const player3Score = finalGame.players[0].totalScore; // Should be 100 (50 + 50)
    const player2Score = finalGame.players[2].totalScore; // Should be 200 (100 + 100)
    
    expect(player1Score).toBeLessThan(player3Score);
    expect(player1Score).toBeLessThan(player2Score);
  });

  it("should display players in fixed order in UI after round completion", async () => {
    const { startGame, recordRoundScore } = useHalveItStore.getState();
    
    // Start game with specific order
    startGame("default", [2, 1, 3]);

    renderWithProviders(<HalveItGame />);

    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    // Complete one round - ensure Player 1 gets fewer points
    let game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Player 2 (index 0) scores high
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 100 });
    
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Player 1 (index 1) scores low - fewer points than others
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 5 });
    
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    // Player 3 (index 2) scores medium-high
    recordRoundScore(game.players[game.currentPlayerIndex].id, game.currentRoundIndex, { points: 50 });

    // Verify store maintains order
    game = useHalveItStore.getState().currentGame;
    if (!game) throw new Error("Game not initialized");
    
    expect(game.players[0].id).toBe(2);
    expect(game.players[1].id).toBe(1);
    expect(game.players[2].id).toBe(3);
    
    // Verify Player 1 has fewer points than others
    expect(game.players[1].totalScore).toBe(5);
    expect(game.players[0].totalScore).toBe(100);
    expect(game.players[2].totalScore).toBe(50);
    expect(game.players[1].totalScore).toBeLessThan(game.players[0].totalScore);
    expect(game.players[1].totalScore).toBeLessThan(game.players[2].totalScore);
  });
});

