import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  PlayArrow as PlayIcon,
} from "@mui/icons-material";
import { useX01Store } from "../../store/useX01Store";
import { useCricketStore } from "../../store/useCricketStore";
import { useHiddenCricketStore } from "../../store/useHiddenCricketStore";
import { useHalveItStore } from "../../store/useHalveItStore";
import { useWarmupStore } from "../../store/useWarmupStore";
import { GAME_PATHS, gameUrl } from "../../utils/gameSession";

interface ActiveGame {
  id: string;
  title: string;
  playerNames: string[];
  startedAt: number;
  url: string;
  onDelete: () => void;
}

interface ResumableGame {
  id: string;
  startedAt: number;
  isGameFinished: boolean;
  players: { name: string }[];
}

const toActiveGame = (
  game: ResumableGame | null,
  title: string,
  basePath: string,
  onDelete: () => void
): ActiveGame | null =>
  game && !game.isGameFinished
    ? {
        id: game.id,
        title,
        playerNames: game.players.map((p) => p.name),
        startedAt: game.startedAt,
        url: gameUrl(basePath, game.id),
        onDelete,
      }
    : null;

const formatStartedAt = (startedAt: number): string =>
  new Date(startedAt).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

interface ResumeGamesProps {
  title?: string;
  /** Show a message instead of rendering nothing when there are no games */
  showEmptyState?: boolean;
}

const ResumeGames: React.FC<ResumeGamesProps> = ({
  title = "Continue game",
  showEmptyState = false,
}) => {
  const navigate = useNavigate();
  const [gameToDelete, setGameToDelete] = useState<ActiveGame | null>(null);
  const x01Game = useX01Store((s) => s.currentGame);
  const endX01Game = useX01Store((s) => s.endGame);
  const cricketGame = useCricketStore((s) => s.currentGame);
  const endCricketGame = useCricketStore((s) => s.endGame);
  const hiddenCricketGame = useHiddenCricketStore((s) => s.currentGame);
  const endHiddenCricketGame = useHiddenCricketStore((s) => s.endGame);
  const halveItGame = useHalveItStore((s) => s.currentGame);
  const endHalveItGame = useHalveItStore((s) => s.endGame);
  const warmupGame = useWarmupStore((s) => s.currentGame);
  const endWarmupGame = useWarmupStore((s) => s.endGame);

  const activeGames = [
    toActiveGame(
      x01Game,
      x01Game ? `X01 · ${x01Game.gameType}` : "X01",
      GAME_PATHS.x01,
      endX01Game
    ),
    toActiveGame(cricketGame, "Cricket", GAME_PATHS.cricket, endCricketGame),
    toActiveGame(
      hiddenCricketGame,
      "Hidden Cricket",
      GAME_PATHS.hiddenCricket,
      endHiddenCricketGame
    ),
    toActiveGame(halveItGame, "Halve It", GAME_PATHS.halveit, endHalveItGame),
    toActiveGame(warmupGame, "Warmup", GAME_PATHS.warmup, endWarmupGame),
  ]
    .filter((g): g is ActiveGame => g !== null)
    .sort((a, b) => b.startedAt - a.startedAt);

  const handleConfirmDelete = () => {
    gameToDelete?.onDelete();
    setGameToDelete(null);
  };

  if (activeGames.length === 0 && !showEmptyState) return null;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>
      {activeGames.length === 0 && (
        <Typography color="text.secondary">
          No ongoing games. Games you leave without finishing show up here.
        </Typography>
      )}
      <Stack spacing={1.5}>
        {activeGames.map((game) => (
          <Card
            key={game.id}
            variant="outlined"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <CardActionArea
              onClick={() => navigate(game.url)}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
              >
                <PlayIcon color="primary" />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {game.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {game.playerNames.join(" vs ")}
                  </Typography>
                </Box>
                <Chip label={formatStartedAt(game.startedAt)} size="small" />
              </CardContent>
            </CardActionArea>
            <IconButton
              aria-label={`Delete ${game.title} game`}
              onClick={() => setGameToDelete(game)}
              sx={{ mx: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Card>
        ))}
      </Stack>

      <Dialog
        open={gameToDelete !== null}
        onClose={() => setGameToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete game?</DialogTitle>
        <DialogContent>
          <Typography>
            {gameToDelete?.title} ({gameToDelete?.playerNames.join(" vs ")}) will
            be deleted and can't be continued.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGameToDelete(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeGames;
