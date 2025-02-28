import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import {
  Backspace,
  Calculate,
  GridOn,
  Undo,
  Close,
  LooksOne,
  LooksTwo,
  Looks3,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";

type InputMode = "numeric" | "board";
type MultiplierType = 1 | 2 | 3;

export default function X01Game() {
  const navigate = useNavigate();
  const { currentGame, recordScore } = useStore();
  const [inputMode, setInputMode] = useState<InputMode>("numeric");
  const [showRoundAvg, setShowRoundAvg] = useState(false);

  useEffect(() => {
    if (!currentGame) {
      navigate("/x01");
    }
  }, [currentGame, navigate]);

  if (!currentGame) return null;

  const currentPlayer = currentGame.players[currentGame.currentPlayerIndex];

  const initialScore = parseInt(currentGame.gameType);
  const pointsScored = initialScore - currentPlayer.score;
  const pointsPerDart =
    currentPlayer.dartsThrown > 0
      ? (pointsScored / currentPlayer.dartsThrown).toFixed(1)
      : "0.0";

  return (
    <Box sx={{ p: 1, height: "100%" }}>
      <Paper
        sx={{
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box
          sx={{
            mb: 2,
            maxHeight: "30vh",
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 1,
              flex: "1 0 0",
            }}
          >
            {currentGame.players.map((player, index) => {
              const initialScore = parseInt(currentGame.gameType);
              const pointsScored = initialScore - player.score;
              const dartsThrown = player.dartsThrown || 1; // Avoid division by zero
              const roundsPlayed = Math.ceil(dartsThrown / 3);

              const avgPerDart = (pointsScored / dartsThrown).toFixed(1);
              const avgPerRound = (pointsScored / roundsPlayed || 0).toFixed(1);

              return (
                <Paper
                  key={player.id}
                  sx={{
                    p: 1,
                    flex: "0.5",
                    backgroundColor: (theme) =>
                      index === currentGame.currentPlayerIndex
                        ? alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                    borderLeft: (theme) =>
                      index === currentGame.currentPlayerIndex
                        ? `4px solid ${theme.palette.primary.main}`
                        : "none",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    color={
                      index === currentGame.currentPlayerIndex
                        ? "primary"
                        : "text.primary"
                    }
                    noWrap
                  >
                    {player.name}
                  </Typography>
                  <Typography variant="h5" sx={{ my: 0.5 }}>
                    {player.score}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ cursor: "pointer" }}
                      onClick={() => setShowRoundAvg(!showRoundAvg)}
                    >
                      Avg: {showRoundAvg ? avgPerRound : avgPerDart}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 0.5, opacity: 0.7 }}
                      >
                        {showRoundAvg ? "/round" : "/dart"}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Darts: {player.dartsThrown}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ mb: 1 }}>
            <ToggleButtonGroup
              value={inputMode}
              exclusive
              size="small"
              onChange={(_, newMode) => newMode && setInputMode(newMode)}
            >
              <ToggleButton value="numeric">
                <Calculate />
              </ToggleButton>
              <ToggleButton value="board">
                <GridOn />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {inputMode === "numeric" ? (
              <NumericInput onScore={recordScore} />
            ) : (
              <DartInput onScore={recordScore} />
            )}
          </Box>
        </Box>

        <SpeedDial
          ariaLabel="game actions"
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Undo />}
            tooltipTitle="Undo"
            onClick={() => {
              /* TODO: Implement undo */
            }}
          />
          <SpeedDialAction
            icon={<Close />}
            tooltipTitle="End Game"
            onClick={() => navigate("/x01")}
          />
        </SpeedDial>
      </Paper>
    </Box>
  );
}
