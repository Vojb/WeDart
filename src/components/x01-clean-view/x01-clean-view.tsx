import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { GamePlayer, type LegStats } from "../../store/useX01Store";
import X01CleanRoundsTable from "../x01-clean-rounds-table/x01-clean-rounds-table";
import X01CleanKeypad from "../x01-clean-keypad/x01-clean-keypad";

export type SelectedCell = { roundIndex: number; playerIndex: number };

export type PlayerMatchStatsColumn = {
  name: string;
  count100Plus: number;
  count140Plus: number;
  count180: number;
  avgPointsPerRound: number;
  /** Highest checkout visit score in legs this player won. */
  highestOut: number | null;
  /** Rounded checkout conversion when there is at least one attempt. */
  checkoutPct: number | null;
  bestLegDarts: number | null;
  worstLegDarts: number | null;
};

export type X01CleanMatchStatsSnapshot = {
  perPlayer: [PlayerMatchStatsColumn, PlayerMatchStatsColumn];
};

/** Match visit totals, averages, checkouts, and per-player best/worst leg. */
export const buildX01CleanMatchStats = (
  matchLegStats: LegStats[],
  players: [GamePlayer, GamePlayer],
  isGameFinished: boolean,
): X01CleanMatchStatsSnapshot => {
  const rollUpForPlayer = (playerId: number) => {
    let b100 = 0;
    let b140 = 0;
    let b180 = 0;
    for (const leg of matchLegStats) {
      const p = leg.players.find((x) => x.id === playerId);
      if (!p) continue;
      b100 += p.rounds100Plus;
      b140 += p.rounds140Plus;
      b180 += p.rounds180;
    }
    if (!isGameFinished) {
      const live = players.find((x) => x.id === playerId);
      if (live) {
        b100 += live.rounds100Plus;
        b140 += live.rounds140Plus;
        b180 += live.rounds180;
      }
    }
    return {
      count100Plus: b100 + b140 + b180,
      count140Plus: b140 + b180,
      count180: b180,
    };
  };

  const bestWorstLegForPlayer = (playerId: number) => {
    const dartsWhenClosed: number[] = [];
    for (const leg of matchLegStats) {
      if (leg.winnerId !== playerId) continue;
      const p = leg.players.find((x) => x.id === playerId);
      if (p && p.dartsThrown > 0) dartsWhenClosed.push(p.dartsThrown);
    }
    if (dartsWhenClosed.length === 0) {
      return {
        bestLegDarts: null as number | null,
        worstLegDarts: null as number | null,
      };
    }
    return {
      bestLegDarts: Math.min(...dartsWhenClosed),
      worstLegDarts: Math.max(...dartsWhenClosed),
    };
  };

  const avgPointsPerRoundForPlayer = (playerId: number) => {
    let totalPoints = 0;
    let totalRounds = 0;
    for (const leg of matchLegStats) {
      const p = leg.players.find((x) => x.id === playerId);
      if (!p) continue;
      totalPoints += p.scores.reduce((sum, s) => sum + s.score, 0);
      totalRounds += p.scores.length;
    }
    if (!isGameFinished) {
      const live = players.find((x) => x.id === playerId);
      if (live) {
        totalPoints += live.scores.reduce((sum, s) => sum + s.score, 0);
        totalRounds += live.scores.length;
      }
    }
    return totalRounds > 0 ? totalPoints / totalRounds : 0;
  };

  const highestOutForPlayer = (playerId: number) => {
    const outs: number[] = [];
    for (const leg of matchLegStats) {
      if (leg.winnerId !== playerId) continue;
      const p = leg.players.find((x) => x.id === playerId);
      if (!p || p.scores.length === 0) continue;
      const last = p.scores[p.scores.length - 1].score;
      if (last > 0) outs.push(last);
    }
    return outs.length > 0 ? Math.max(...outs) : null;
  };

  const checkoutForPlayer = (playerId: number) => {
    let attempts = 0;
    let success = 0;
    for (const leg of matchLegStats) {
      const p = leg.players.find((x) => x.id === playerId);
      if (!p) continue;
      attempts += p.checkoutAttempts;
      success += p.checkoutSuccess;
    }
    if (!isGameFinished) {
      const live = players.find((x) => x.id === playerId);
      if (live) {
        attempts += live.checkoutAttempts;
        success += live.checkoutSuccess;
      }
    }
    return {
      checkoutPct:
        attempts > 0 ? Math.round((success / attempts) * 100) : null,
    };
  };

  const [p0, p1] = players;
  const t0 = rollUpForPlayer(p0.id);
  const t1 = rollUpForPlayer(p1.id);
  const l0 = bestWorstLegForPlayer(p0.id);
  const l1 = bestWorstLegForPlayer(p1.id);
  const a0 = avgPointsPerRoundForPlayer(p0.id);
  const a1 = avgPointsPerRoundForPlayer(p1.id);
  const h0 = highestOutForPlayer(p0.id);
  const h1 = highestOutForPlayer(p1.id);
  const c0 = checkoutForPlayer(p0.id);
  const c1 = checkoutForPlayer(p1.id);

  return {
    perPlayer: [
      {
        name: p0.name,
        ...t0,
        avgPointsPerRound: a0,
        highestOut: h0,
        ...c0,
        ...l0,
      },
      {
        name: p1.name,
        ...t1,
        avgPointsPerRound: a1,
        highestOut: h1,
        ...c1,
        ...l1,
      },
    ],
  };
};

const tableFrameSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  overflow: "hidden",
} as const;

const formatLegDarts = (n: number | null) =>
  n === null ? "—" : `${n}`;

const MATCH_STAT_ROWS: Array<{
  label: string;
  value: (p: PlayerMatchStatsColumn) => string;
}> = [
  { label: "100+", value: (p) => String(p.count100Plus) },
  { label: "140+", value: (p) => String(p.count140Plus) },
  { label: "180", value: (p) => String(p.count180) },
  {
    label: "Avg / round",
    value: (p) => (p.avgPointsPerRound > 0 ? p.avgPointsPerRound.toFixed(1) : "0.0"),
  },
  {
    label: "Highest out",
    value: (p) => (p.highestOut == null ? "—" : String(p.highestOut)),
  },
  {
    label: "Checkout %",
    value: (p) => (p.checkoutPct == null ? "—" : `${p.checkoutPct}%`),
  },
  { label: "Best leg (darts)", value: (p) => formatLegDarts(p.bestLegDarts) },
  { label: "Worst leg (darts)", value: (p) => formatLegDarts(p.worstLegDarts) },
];

export const X01CleanMatchStatsDialogContent: React.FC<{
  stats: X01CleanMatchStatsSnapshot;
}> = ({ stats }) => {
  const [col0, col1] = stats.perPlayer;

  return (
    <Box sx={{ minWidth: { xs: "100%", sm: 520 } }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Match statistics
      </Typography>
      <TableContainer sx={tableFrameSx}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell align="right" sx={{ fontWeight: 600, width: "32%" }}>
                {col0.name}
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  width: "36%",
                  borderLeft: 1,
                  borderRight: 1,
                  borderColor: "divider",
                }}
              />
              <TableCell align="left" sx={{ fontWeight: 600, width: "32%" }}>
                {col1.name}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MATCH_STAT_ROWS.map((row) => (
              <TableRow
                key={row.label}
                sx={{
                  "&:nth-of-type(even)": {
                    bgcolor: (theme: Theme) =>
                      alpha(
                        theme.palette.secondary.main,
                        theme.palette.mode === "light" ? 0.06 : 0.12,
                      ),
                  },
                }}
              >
                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.value(col0)}
                </TableCell>
                <TableCell
                  component="th"
                  scope="row"
                  align="center"
                  sx={{
                    fontWeight: 500,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    borderLeft: 1,
                    borderRight: 1,
                    borderColor: "divider",
                  }}
                >
                  {row.label}
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.value(col1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

interface X01CleanViewProps {
  players: [GamePlayer, GamePlayer];
  currentPlayerIndex: number;
  currentPlayerScore: number | undefined;
  isDoubleOut: boolean;
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
  isDoubleOut,
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
  const [checkoutFinish, setCheckoutFinish] = useState<{
    score: number;
    lastDartMultiplier: number;
  } | null>(null);

  // When a new leg starts (both players have no scores), sync selected cell so submit works
  useEffect(() => {
    if (players[0].scores.length === 0 && players[1].scores.length === 0) {
      setSelectedCell(defaultSelected);
      setCheckoutFinish(null);
    }
  }, [
    players[0].scores.length,
    players[1].scores.length,
    defaultSelected.roundIndex,
    defaultSelected.playerIndex,
  ]);

  const playerScores: [number, number] = [players[0].score, players[1].score];

  const advanceToNextPlayer = () => {
    const nextPlayerIndex = 1 - currentPlayerIndex;
    setSelectedCell({
      roundIndex: players[nextPlayerIndex].scores.length,
      playerIndex: nextPlayerIndex,
    });
  };

  const handleSubmit = () => {
    const score = parseInt(inputValue, 10) || 0;
    if (score > 180) return;
    if (
      selectedCell.roundIndex === currentRound &&
      selectedCell.playerIndex === currentPlayerIndex
    ) {
      const remaining = (currentPlayerScore ?? 0) - score;
      const lastDartMultiplier =
        remaining === 0 && isDoubleOut ? 2 : 1;

      if (remaining < 0) {
        setInputValue("");
        onScore(0, 3, 1);
        advanceToNextPlayer();
        return;
      }

      if (remaining === 0 && score > 0) {
        setInputValue("");
        setCheckoutFinish({ score, lastDartMultiplier });
        return;
      }

      setInputValue("");
      onScore(score, 3, lastDartMultiplier);
      advanceToNextPlayer();
    } else {
      setInputValue("");
      onReplaceScore(selectedCell.playerIndex, selectedCell.roundIndex, score);
    }
  };

  const completeCheckoutWithDarts = (dartsUsed: 1 | 2 | 3) => {
    if (!checkoutFinish) return;
    onScore(
      checkoutFinish.score,
      dartsUsed,
      checkoutFinish.lastDartMultiplier,
    );
    setCheckoutFinish(null);
    advanceToNextPlayer();
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
          disabled={scoreInputDisabled || checkoutFinish !== null}
        />
      </Box>
      <Dialog
        open={checkoutFinish !== null}
        onClose={() => setCheckoutFinish(null)}
        aria-labelledby="checkout-darts-dialog-title"
      >
        <DialogTitle id="checkout-darts-dialog-title">
          Finish — darts used?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Score for this visit:{" "}
            <Box component="span" fontWeight={700}>
              {checkoutFinish?.score ?? "—"}
            </Box>
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            {([1, 2, 3] as const).map((n) => (
              <Button
                key={n}
                variant="contained"
                size="large"
                sx={{ minWidth: 72, fontWeight: 700 }}
                onClick={() => completeCheckoutWithDarts(n)}
              >
                {n}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutFinish(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default X01CleanView;
