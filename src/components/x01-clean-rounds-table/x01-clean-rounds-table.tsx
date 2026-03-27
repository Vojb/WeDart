import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { GamePlayer } from "../../store/useX01Store";
import type { SelectedCell } from "../x01-clean-view/x01-clean-view";

interface X01CleanRoundsTableProps {
  players: [GamePlayer, GamePlayer];
  selectedCell: SelectedCell;
  onSelectCell: (cell: SelectedCell) => void;
  inputValue: string;
}

const X01CleanRoundsTable: React.FC<X01CleanRoundsTableProps> = ({
  players,
  selectedCell,
  onSelectCell,
  inputValue,
}) => {
  const [p1, p2] = players;
  const initialScore = p1.initialScore;
  // Add a new row only after both players have scored in the current round
  const completedRounds = Math.min(p1.scores.length, p2.scores.length);
  const extraRowCount = completedRounds;

  const toGo = (scores: { score: number }[], afterRound: number) => {
    const sum = scores
      .slice(0, afterRound)
      .reduce((acc, s) => acc + s.score, 0);
    return initialScore - sum;
  };

  const isSelectedP1 = (rowIndex: number) =>
    selectedCell.playerIndex === 0 && selectedCell.roundIndex === rowIndex;
  const isSelectedP2 = (rowIndex: number) =>
    selectedCell.playerIndex === 1 && selectedCell.roundIndex === rowIndex;

  const headerCellSx = {
    fontWeight: 600,
    bgcolor: "background.paper",
    borderBottom: 1,
    borderColor: "divider",
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <TableContainer component={Paper} elevation={0} sx={{ overflow: "auto", maxHeight: "100%" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="center" component="th" scope="col" sx={{ width: 40, ...headerCellSx }}>
                {" "}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ ...headerCellSx }}>
                Scored
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ ...headerCellSx }}>
                To Go
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ width: 56, ...headerCellSx }}>
                Darts
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ ...headerCellSx }}>
                Scored
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ ...headerCellSx }}>
                To Go
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" component="th" scope="col" sx={{ width: 40, fontSize: "0.75rem", ...headerCellSx }}>
                {" "}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ fontSize: "0.75rem", ...headerCellSx }}>
                {p1.name}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ fontSize: "0.75rem", ...headerCellSx }}>
                {" "}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ width: 56, fontSize: "0.75rem", ...headerCellSx }}>
                {" "}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ fontSize: "0.75rem", ...headerCellSx }}>
                {p2.name}
              </TableCell>
              <TableCell align="center" component="th" scope="col" sx={{ fontSize: "0.75rem", ...headerCellSx }}>
                {" "}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">{1}</TableCell>
              <TableCell
                align="center"
                onClick={() => onSelectCell({ roundIndex: 0, playerIndex: 0 })}
                sx={{
                  cursor: "pointer",
                  bgcolor: isSelectedP1(0) ? "action.selected" : undefined,
                }}
              >
                {isSelectedP1(0) && inputValue !== ""
                  ? inputValue
                  : p1.scores[0]?.score ?? "–"}
              </TableCell>
              <TableCell align="center">{toGo(p1.scores, 1)}</TableCell>
              <TableCell align="center">{3}</TableCell>
              <TableCell
                align="center"
                onClick={() => onSelectCell({ roundIndex: 0, playerIndex: 1 })}
                sx={{
                  cursor: "pointer",
                  bgcolor: isSelectedP2(0) ? "action.selected" : undefined,
                }}
              >
                {isSelectedP2(0) && inputValue !== ""
                  ? inputValue
                  : p2.scores[0]?.score ?? "–"}
              </TableCell>
              <TableCell align="center">{toGo(p2.scores, 1)}</TableCell>
            </TableRow>
            {Array.from({ length: extraRowCount }, (_, i) => (
              <TableRow key={i}>
                <TableCell align="center">{i + 2}</TableCell>
                <TableCell
                  align="center"
                  onClick={() =>
                    onSelectCell({ roundIndex: i + 1, playerIndex: 0 })
                  }
                  sx={{
                    cursor: "pointer",
                    bgcolor: isSelectedP1(i + 1) ? "action.selected" : undefined,
                  }}
                >
                  {isSelectedP1(i + 1) && inputValue !== ""
                    ? inputValue
                    : p1.scores[i + 1]?.score ?? "–"}
                </TableCell>
                <TableCell align="center">{toGo(p1.scores, i + 2)}</TableCell>
                <TableCell align="center">{(i + 2) * 3}</TableCell>
                <TableCell
                  align="center"
                  onClick={() =>
                    onSelectCell({ roundIndex: i + 1, playerIndex: 1 })
                  }
                  sx={{
                    cursor: "pointer",
                    bgcolor: isSelectedP2(i + 1) ? "action.selected" : undefined,
                  }}
                >
                  {isSelectedP2(i + 1) && inputValue !== ""
                    ? inputValue
                    : p2.scores[i + 1]?.score ?? "–"}
                </TableCell>
                <TableCell align="center">{toGo(p2.scores, i + 2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default X01CleanRoundsTable;
