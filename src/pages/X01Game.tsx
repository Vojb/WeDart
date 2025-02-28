import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import { Calculate, GridOn, Undo, Close } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import NumericInput from "../components/NumericInput";
import DartInput from "../components/DartInput";

type InputMode = "numeric" | "board";

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

  const initialScore = parseInt(currentGame.gameType);
  const pointsScored =
    initialScore - currentGame.players[currentGame.currentPlayerIndex].score;
  const dartsThrown =
    currentGame.players[currentGame.currentPlayerIndex].dartsThrown || 1; // Avoid division by zero
  const roundsPlayed = Math.ceil(dartsThrown / 3);

  const avgPerDart = (pointsScored / dartsThrown).toFixed(1);
  const avgPerRound = (pointsScored / roundsPlayed || 0).toFixed(1);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Players Section */}
        <Box
          sx={{
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto",
            minHeight: "fit-content",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              minWidth: "fit-content",
            }}
          >
            {currentGame.players.map((player, index) => (
              <Paper
                key={player.id}
                sx={{
                  p: 1,
                  flex: "1 0 150px",
                  maxWidth: "200px",
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
                <Typography variant="body1" noWrap>
                  {player.name}
                </Typography>
                <Typography variant="h5">{player.score}</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ cursor: "pointer" }}
                    onClick={() => setShowRoundAvg(!showRoundAvg)}
                  >
                    Avg: {showRoundAvg ? avgPerRound : avgPerDart}
                  </Typography>
                  <Typography variant="caption">
                    Darts: {player.dartsThrown}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Input Section */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 1,
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

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {inputMode === "numeric" ? (
              <NumericInput onScore={recordScore} />
            ) : (
              <DartInput onScore={recordScore} />
            )}
          </Box>
        </Box>
      </Paper>

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
    </Box>
  );
}
