import React, { useState, useMemo, useEffect } from "react";
import { Box } from "@mui/material";
import { GamePlayer } from "../../store/useX01Store";
import X01CleanRoundsTable from "../x01-clean-rounds-table/x01-clean-rounds-table";
import X01CleanKeypad from "../x01-clean-keypad/x01-clean-keypad";

export type SelectedCell = { roundIndex: number; playerIndex: number };

interface X01CleanViewProps {
  players: [GamePlayer, GamePlayer];
  currentPlayerIndex: number;
  currentPlayerScore: number | undefined;
  onScore: (score: number, darts: number, lastDartMultiplier?: number) => void;
  onReplaceScore: (
    playerIndex: number,
    roundIndex: number,
    newScore: number,
  ) => void;
  scoreInputDisabled?: boolean;
}

const X01CleanView: React.FC<X01CleanViewProps> = ({
  players,
  currentPlayerIndex,
  currentPlayerScore,
  onScore,
  onReplaceScore,
  scoreInputDisabled = false,
}) => {
  const currentRound = Math.min(
    players[0].scores.length,
    players[1].scores.length,
  );

  const defaultSelected = useMemo<SelectedCell>(
    () => ({ roundIndex: currentRound, playerIndex: currentPlayerIndex }),
    [currentRound, currentPlayerIndex],
  );

  const [selectedCell, setSelectedCell] =
    useState<SelectedCell>(defaultSelected);
  const [inputValue, setInputValue] = useState("");

  // When a new leg starts (both players have no scores), sync selected cell so submit works
  useEffect(() => {
    if (players[0].scores.length === 0 && players[1].scores.length === 0) {
      setSelectedCell(defaultSelected);
    }
  }, [
    players[0].scores.length,
    players[1].scores.length,
    defaultSelected.roundIndex,
    defaultSelected.playerIndex,
  ]);

  const playerScores: [number, number] = [players[0].score, players[1].score];

  const handleSubmit = () => {
    const score = parseInt(inputValue, 10) || 0;
    if (score > 180) return;
    setInputValue("");
    if (
      selectedCell.roundIndex === currentRound &&
      selectedCell.playerIndex === currentPlayerIndex
    ) {
      const remaining = (currentPlayerScore ?? 0) - score;
      const mult = remaining === 0 ? 2 : 1;
      onScore(remaining < 0 ? 0 : score, 3, mult);
      // Next row for the other player is their current scores.length (same row when they throw second in the leg)
      const nextPlayerIndex = 1 - currentPlayerIndex;
      setSelectedCell({
        roundIndex: players[nextPlayerIndex].scores.length,
        playerIndex: nextPlayerIndex,
      });
    } else {
      onReplaceScore(selectedCell.playerIndex, selectedCell.roundIndex, score);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <X01CleanRoundsTable
          players={players}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          inputValue={inputValue}
        />
      </Box>
      <Box
        sx={{
          flex: 1.5,
          display: "flex",
        }}
      >
        <X01CleanKeypad
          playerNames={[players[0].name, players[1].name]}
          playerScores={playerScores}
          currentPlayerIndex={currentPlayerIndex}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={scoreInputDisabled}
        />
      </Box>
    </Box>
  );
};

export default X01CleanView;
