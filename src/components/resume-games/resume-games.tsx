import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { PlayArrow as PlayIcon } from "@mui/icons-material";
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
  basePath: string
): ActiveGame | null =>
  game && !game.isGameFinished
    ? {
        id: game.id,
        title,
        playerNames: game.players.map((p) => p.name),
        startedAt: game.startedAt,
        url: gameUrl(basePath, game.id),
      }
    : null;

const formatStartedAt = (startedAt: number): string =>
  new Date(startedAt).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const ResumeGames: React.FC = () => {
  const navigate = useNavigate();
  const x01Game = useX01Store((s) => s.currentGame);
  const cricketGame = useCricketStore((s) => s.currentGame);
  const hiddenCricketGame = useHiddenCricketStore((s) => s.currentGame);
  const halveItGame = useHalveItStore((s) => s.currentGame);
  const warmupGame = useWarmupStore((s) => s.currentGame);

  const activeGames = [
    toActiveGame(x01Game, x01Game ? `X01 · ${x01Game.gameType}` : "X01", GAME_PATHS.x01),
    toActiveGame(cricketGame, "Cricket", GAME_PATHS.cricket),
    toActiveGame(hiddenCricketGame, "Hidden Cricket", GAME_PATHS.hiddenCricket),
    toActiveGame(halveItGame, "Halve It", GAME_PATHS.halveit),
    toActiveGame(warmupGame, "Warmup", GAME_PATHS.warmup),
  ]
    .filter((g): g is ActiveGame => g !== null)
    .sort((a, b) => b.startedAt - a.startedAt);

  if (activeGames.length === 0) return null;

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
        Continue game
      </Typography>
      <Stack spacing={1.5}>
        {activeGames.map((game) => (
          <Card key={game.id} variant="outlined">
            <CardActionArea onClick={() => navigate(game.url)}>
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
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default ResumeGames;
