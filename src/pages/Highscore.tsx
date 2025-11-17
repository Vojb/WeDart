import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { useHistoryStore, isHalveItGame, HalveItCompletedRound } from "../store/useHistoryStore";
import { EmojiEvents, Close } from "@mui/icons-material";
import VibrationButton from "../components/VibrationButton";

interface LeaderboardEntry {
  playerId: number;
  playerName: string;
  score: number;
  gameId: string;
  timestamp: number;
  mode?: "default" | "41";
  rounds?: HalveItCompletedRound[];
}

const Highscore: React.FC = () => {
  const { completedGames } = useHistoryStore();
  const [tabValue, setTabValue] = useState<"all" | "default" | "41">("all");
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Extract all HalveIt players with their scores
  const leaderboardEntries = useMemo(() => {
    const entries: LeaderboardEntry[] = [];

    completedGames.forEach((game) => {
      if (isHalveItGame(game)) {
        game.players.forEach((player) => {
          entries.push({
            playerId: player.id,
            playerName: player.name,
            score: player.finalScore,
            gameId: game.id,
            timestamp: game.timestamp,
            mode: game.mode,
            rounds: player.rounds,
          });
        });
      }
    });

    // Sort by score descending (highest first)
    return entries.sort((a, b) => b.score - a.score);
  }, [completedGames]);

  // Filter entries by mode
  const filteredEntries = useMemo(() => {
    if (tabValue === "all") {
      return leaderboardEntries;
    }
    return leaderboardEntries.filter((entry) => entry.mode === tabValue);
  }, [leaderboardEntries, tabValue]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: "all" | "default" | "41") => {
    setTabValue(newValue);
  };

  const handleRowClick = (entry: LeaderboardEntry) => {
    setSelectedEntry(entry);
    setDetailsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedEntry(null);
  };

  const getRoundDetails = (round: HalveItCompletedRound) => {
    if (round.roundType === "number" || round.roundType === "bull") {
      if (round.isHalved) {
        return "Score halved (0 hits)";
      }
      return `${round.hits} hit(s) × ${round.target} = +${round.pointsGained} points`;
    } else if (round.roundType === "target-score") {
      if (round.isHalved) {
        return `Score halved (didn't hit ${round.target})`;
      }
      return `Hit target score ${round.totalScore} = +${round.pointsGained} points`;
    } else {
      if (round.isHalved) {
        return "Score halved (0 points)";
      }
      return `${round.points} points`;
    }
  };

  return (
    <Box sx={{ p: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <EmojiEvents sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            HalveIt Leaderboard
          </Typography>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="All HalveIt" value="all" />
          <Tab label="HalveIt Default" value="default" />
          <Tab label="HalveIt 41" value="41" />
        </Tabs>

        {filteredEntries.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No HalveIt games completed yet. Play a game to see leaderboard entries!
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell>Mode</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((entry, index) => (
                  <TableRow
                    key={`${entry.gameId}-${entry.playerId}-${index}`}
                    onClick={() => handleRowClick(entry)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">{entry.playerName}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {entry.score}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.mode === "41" ? "41 Mode" : "Default"}
                        size="small"
                        color={entry.mode === "41" ? "secondary" : "primary"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Player Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {selectedEntry?.playerName} - Round Details
            </Typography>
            <VibrationButton
              onClick={handleCloseDialog}
              vibrationPattern={50}
              size="small"
            >
              <Close />
            </VibrationButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntry && selectedEntry.rounds && selectedEntry.rounds.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Round</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Points Gained</TableCell>
                    <TableCell align="right">Score After</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEntry.rounds.map((round, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {round.roundNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {round.roundType === "number" || round.roundType === "bull"
                            ? `${round.target}`
                            : round.roundType === "target-score"
                            ? `Target ${round.target}`
                            : round.roundType === "scoring"
                            ? "Scoring"
                            : round.roundType === "double"
                            ? "Double"
                            : "Treble"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {getRoundDetails(round)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={round.pointsGained >= 0 ? "success.main" : "error.main"}
                        >
                          {round.pointsGained >= 0 ? "+" : ""}
                          {round.pointsGained}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {round.score}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No round data available for this player.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <VibrationButton onClick={handleCloseDialog} vibrationPattern={50}>
            Close
          </VibrationButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Highscore;
