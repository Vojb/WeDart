import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
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

  /** Total darts thrown in the leg through this round (both players, 0-based round index). */
  const cumulativeLegDartsThroughRound = (roundIndex: number) => {
    let n = 0;
    for (let r = 0; r <= roundIndex; r++) {
      n += p1.scores[r]?.darts ?? 0;
      n += p2.scores[r]?.darts ?? 0;
    }
    return n;
  };

  const dartsColumnDisplay = (roundIndex: number) => {
    const n = cumulativeLegDartsThroughRound(roundIndex);
    return n > 0 ? n : "–";
  };

  const isSelectedP1 = (rowIndex: number) =>
    selectedCell.playerIndex === 0 && selectedCell.roundIndex === rowIndex;
  const isSelectedP2 = (rowIndex: number) =>
    selectedCell.playerIndex === 1 && selectedCell.roundIndex === rowIndex;

  /** Odd column indices get a light secondary tint for column readability */
  const alternatingColumnBg = (colIndex: number) => ({
    bgcolor: (theme: Theme) =>
      colIndex % 2 === 1
        ? alpha(
            theme.palette.secondary.main,
            theme.palette.mode === "light" ? 0.1 : 0.15,
          )
        : theme.palette.background.paper,
  });

  const headerCellSx = (colIndex: number) => ({
    fontWeight: 600,
    ...alternatingColumnBg(colIndex),
    borderBottom: 1,
    borderColor: "divider",
  });

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <TableContainer sx={{ overflow: "auto", maxHeight: "100%" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ width: 40, ...headerCellSx(0) }}
              >
                {" "}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ ...headerCellSx(1) }}
              >
                Scored
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ ...headerCellSx(2) }}
              >
                To Go
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ width: 56, ...headerCellSx(3) }}
              >
                Darts
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ ...headerCellSx(4) }}
              >
                Scored
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ ...headerCellSx(5) }}
              >
                To Go
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ width: 40, fontSize: "0.75rem", ...headerCellSx(0) }}
              >
                {" "}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ fontSize: "0.75rem", ...headerCellSx(1) }}
              >
                {p1.name}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ fontSize: "0.75rem", ...headerCellSx(2) }}
              >
                {" "}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ width: 56, fontSize: "0.75rem", ...headerCellSx(3) }}
              >
                {" "}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ fontSize: "0.75rem", ...headerCellSx(4) }}
              >
                {p2.name}
              </TableCell>
              <TableCell
                align="center"
                component="th"
                scope="col"
                sx={{ fontSize: "0.75rem", ...headerCellSx(5) }}
              >
                {" "}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center" sx={alternatingColumnBg(0)}>
                {1}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => onSelectCell({ roundIndex: 0, playerIndex: 0 })}
                sx={{
                  ...alternatingColumnBg(1),
                  cursor: "pointer",
                  ...(isSelectedP1(0) ? { bgcolor: "action.selected" } : {}),
                }}
              >
                {isSelectedP1(0) && inputValue !== ""
                  ? inputValue
                  : (p1.scores[0]?.score ?? "–")}
              </TableCell>
              <TableCell align="center" sx={alternatingColumnBg(2)}>
                {toGo(p1.scores, 1)}
              </TableCell>
              <TableCell align="center" sx={alternatingColumnBg(3)}>
                {dartsColumnDisplay(0)}
              </TableCell>
              <TableCell
                align="center"
                onClick={() => onSelectCell({ roundIndex: 0, playerIndex: 1 })}
                sx={{
                  ...alternatingColumnBg(4),
                  cursor: "pointer",
                  ...(isSelectedP2(0) ? { bgcolor: "action.selected" } : {}),
                }}
              >
                {isSelectedP2(0) && inputValue !== ""
                  ? inputValue
                  : (p2.scores[0]?.score ?? "–")}
              </TableCell>
              <TableCell align="center" sx={alternatingColumnBg(5)}>
                {toGo(p2.scores, 1)}
              </TableCell>
            </TableRow>
            {Array.from({ length: extraRowCount }, (_, i) => (
              <TableRow key={i}>
                <TableCell align="center" sx={alternatingColumnBg(0)}>
                  {i + 2}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() =>
                    onSelectCell({ roundIndex: i + 1, playerIndex: 0 })
                  }
                  sx={{
                    ...alternatingColumnBg(1),
                    cursor: "pointer",
                    ...(isSelectedP1(i + 1)
                      ? { bgcolor: "action.selected" }
                      : {}),
                  }}
                >
                  {isSelectedP1(i + 1) && inputValue !== ""
                    ? inputValue
                    : (p1.scores[i + 1]?.score ?? "–")}
                </TableCell>
                <TableCell align="center" sx={alternatingColumnBg(2)}>
                  {toGo(p1.scores, i + 2)}
                </TableCell>
                <TableCell align="center" sx={alternatingColumnBg(3)}>
                  {dartsColumnDisplay(i + 1)}
                </TableCell>
                <TableCell
                  align="center"
                  onClick={() =>
                    onSelectCell({ roundIndex: i + 1, playerIndex: 1 })
                  }
                  sx={{
                    ...alternatingColumnBg(4),
                    cursor: "pointer",
                    ...(isSelectedP2(i + 1)
                      ? { bgcolor: "action.selected" }
                      : {}),
                  }}
                >
                  {isSelectedP2(i + 1) && inputValue !== ""
                    ? inputValue
                    : (p2.scores[i + 1]?.score ?? "–")}
                </TableCell>
                <TableCell align="center" sx={alternatingColumnBg(5)}>
                  {toGo(p2.scores, i + 2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default X01CleanRoundsTable;
