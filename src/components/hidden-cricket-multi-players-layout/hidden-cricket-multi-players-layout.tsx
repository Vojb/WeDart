import React from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { HiddenCricketPlayer, HiddenCricketRound } from "../../store/useHiddenCricketStore";
import CountUp from "../count-up/count-up";

interface HiddenCricketMultiPlayersLayoutProps {
  players: HiddenCricketPlayer[];
  currentPlayerId: number | null;
  rounds: HiddenCricketRound[];
  currentRound: HiddenCricketRound | null;
  renderMarks: (hits: number, color?: string) => React.ReactNode;
  renderClosedMark: (color?: string) => React.ReactNode;
  getNumberDisplayText: (number: number | string) => string;
  isNumberClosedByAll: (number: number | string) => boolean;
  hasCurrentPlayerClosedAllNonBull: () => boolean;
  lastBull: boolean;
  isInputExpanded: boolean;
  hiddenNumbersSorted: (number | string)[];
}

const HiddenCricketMultiPlayersLayout: React.FC<HiddenCricketMultiPlayersLayoutProps> = ({
  players,
  currentPlayerId: _currentPlayerId,
  rounds: _rounds,
  currentRound: _currentRound,
  renderMarks,
  renderClosedMark,
  getNumberDisplayText,
  isNumberClosedByAll,
  hasCurrentPlayerClosedAllNonBull,
  lastBull,
  isInputExpanded,
  hiddenNumbersSorted,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Number Grid - Showing all players' progress on hidden numbers */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {hiddenNumbersSorted.map((number) => {
        const allClosed = isNumberClosedByAll(number);

        return (
          <Box
            key={number}
            sx={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid",
              borderColor: "divider",
              filter: allClosed ? "blur(4px)" : "none",
              opacity: allClosed ? 0.5 : 1,
              transition: "filter 0.3s ease, opacity 0.3s ease",
              flex: "1 1 0",
              minHeight: 0,
            }}
          >
            {/* Main row with players and number */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${players.length}, 1fr) 60px`,
                gap: 0.5,
                p: 0.5,
                height: "100%",
                alignItems: "stretch",
              }}
            >
              {/* All players */}
              {players.map((player, playerIndex) => {
                const playerColor =
                  playerIndex % 2 === 0
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main;
                const target = player.targets.find((t) => t.number === number);
                const isClosed = target?.closed || false;

                return (
                  <Box
                    key={`${player.id}-${number}`}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      width: "100%",
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    {target && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.25,
                          height: "100%",
                          width: "100%",
                          justifyContent: "center",
                          minHeight: 0,
                          overflow: "hidden",
                        }}
                      >
                        {isClosed ? (
                          renderClosedMark(playerColor)
                        ) : (
                          renderMarks(target.hits, playerColor)
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Number Label - positioned on the right */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  width: "100%",
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    fontSize: isInputExpanded
                      ? "clamp(0.75rem, 60%, 1.5rem)"
                      : "clamp(1rem, 60%, 2rem)",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    overflow: "hidden",
                    textAlign: "center",
                    maxHeight: "100%",
                    maxWidth: "100%",
                    wordBreak: "break-word",
                    color:
                      lastBull &&
                      number === "Bull" &&
                      !hasCurrentPlayerClosedAllNonBull()
                        ? "error.main"
                        : "inherit",
                  }}
                >
                  {getNumberDisplayText(number)}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
      </Box>

      {/* Total Score Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${players.length}, 1fr) 60px`,
          gap: 0.5,
          p: 0.5,
          borderTop: "2px solid",
          borderColor: "divider",
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          alignItems: "center",
        }}
      >
        {players.map((player, playerIndex) => {
          const playerColor =
            playerIndex % 2 === 0
              ? theme.palette.primary.main
              : theme.palette.secondary.main;
          return (
            <Box
              key={`score-${player.id}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 1, sm: 3, md: 4 },
              }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: playerColor,
                  fontSize: { xs: "1rem", sm: "1.5rem", md: "1.75rem" },
                }}
              >
                <CountUp
                  to={player.totalScore}
                  duration={0.5}
                  delay={0}
                  animateOnChange={true}
                  startWhen={true}
                />
              </Typography>
            </Box>
          );
        })}
        {/* Empty column to match grid layout */}
        <Box />
      </Box>
    </Box>
  );
};

export default HiddenCricketMultiPlayersLayout;

