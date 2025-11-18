import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Chip,
  Badge,
  Tooltip,
  Stack,
} from "@mui/material";
import { useX01Store } from "../store/useX01Store";
import React, { useState, useEffect, useRef } from "react";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import SendIcon from "@mui/icons-material/Send";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import LanguageIcon from "@mui/icons-material/Language";
import CancelIcon from "@mui/icons-material/Cancel";

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    isFinal?: boolean;
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  onstart: (event: Event) => void;
}

// Interface for transcript log entries
interface TranscriptLogEntry {
  text: string;
  timestamp: Date;
  containsNumber: boolean;
  extractedNumber: number | null;
}

const VoiceInput: React.FC<{
  handleScore: (
    score: number,
    darts: number,
    lastDartMultiplier?: number
  ) => void;
}> = ({ handleScore }) => {
  const { currentGame } = useX01Store();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("sv-SE");
  const [lastRecognizedNumber, setLastRecognizedNumber] = useState<
    number | null
  >(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Add state for transcript log
  const [transcriptLog, setTranscriptLog] = useState<TranscriptLogEntry[]>([]);
  const [expandedLog, setExpandedLog] = useState(false);

  // Add a ref to track if we should keep listening
  const keepListeningRef = useRef(false);

  // Add state for countdown
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Define language options - only Swedish and English as requested
  const languageOptions = [
    { code: "en-US", label: "English (US)" },
    { code: "sv-SE", label: "Swedish" },
  ];

  // Function to extract numbers from transcript
  const extractNumberFromTranscript = (text: string): number | null => {
    // Match any number in the transcript
    const matches = text.match(/\d+/g);
    if (matches && matches.length > 0) {
      // Return the last number found
      return parseInt(matches[matches.length - 1], 10);
    }
    return null;
  };

  // Start speech recognition
  const startListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Your browser does not support the SpeechRecognition API");
      return;
    }

    // Set the flag to keep listening
    keepListeningRef.current = true;

    // Initialize speech recognition
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();

    if (recognitionRef.current) {
      // Configure recognition settings
      recognitionRef.current.lang = language;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true;

      // Handle recognition results
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript =
          event.results[event.results.length - 1][0].transcript;
        setTranscript(currentTranscript);

        // Extract number from transcript
        const number = extractNumberFromTranscript(currentTranscript);
        if (number !== null) {
          setLastRecognizedNumber(number);
          // Start or reset countdown when a number is recognized
          setCountdown(5);
        }

        // Add to transcript log
        const newLogEntry: TranscriptLogEntry = {
          text: currentTranscript,
          timestamp: new Date(),
          containsNumber: number !== null,
          extractedNumber: number,
        };

        setTranscriptLog((prevLog) => [newLogEntry, ...prevLog].slice(0, 50)); // Keep last 50 entries

        console.log("Speech recognized:", currentTranscript, "Number:", number);
      };

      // Handle recognition end
      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");

        // If we should keep listening, restart immediately
        if (keepListeningRef.current) {
          console.log("Restarting speech recognition");
          // Small timeout to prevent potential issues with rapid restarts
          setTimeout(() => {
            try {
              if (keepListeningRef.current) {
                startListening();
              }
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      // Handle recognition errors
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event);
      };

      // Start recognition
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log("Speech recognition started");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        keepListeningRef.current = false;
        setIsListening(false);
      }
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    // Set the flag to stop listening
    keepListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Speech recognition stopped by user");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }

    setIsListening(false);
  };

  // Toggle between start and stop listening
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle countdown timer
  useEffect(() => {
    // Clear any existing interval first
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0) {
      // Auto-submit when countdown reaches 0
      if (lastRecognizedNumber !== null) {
        handleScore(lastRecognizedNumber, 3, 0);
        setTranscript("");
        setLastRecognizedNumber(null);
        setCountdown(null);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [countdown, lastRecognizedNumber, handleScore]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition on unmount:", error);
        }
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Format timestamp for log display
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Count number entries with numbers
  const numberEntriesCount = transcriptLog.filter(
    (entry) => entry.containsNumber
  ).length;

  // Cancel countdown
  const cancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    setLastRecognizedNumber(null);
    setTranscript("");
  };

  return (
    <Box sx={{ p: 1, height: "100%", display: "flex",  flexDirection: "column", overflow: "hidden" }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          flex: 1,
          position: "relative",
          transition: "all 0.3s ease",

        }}
      >
        {/* Header with current score and language selector */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
     
            justifyContent: "space-between",
            mb: 3,
            pb: 2,
            borderBottom: "1px solid #eee",
          }}
        >
          <Box sx={{ display: "flex", flex:1, minHeight:0, alignItems: "center" }}>
            <SportsScoreIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              Current Score:{" "}
              <Typography component="span" variant="h5" fontWeight="bold">
                {currentGame?.players[currentGame.currentPlayerIndex]?.score}
              </Typography>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LanguageIcon sx={{ mr: 1, color: "text.secondary" }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-selector"
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languageOptions.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Voice recognition area */}
        <Box sx={{ position: "relative", mb: 2,flex:1}}>
          {isListening && (
            <Chip
              label="Listening..."
              color="success"
              size="small"
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.6 },
                },
              }}
            />
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              minHeight: "80px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              id="results"
              sx={{
                fontStyle: transcript ? "normal" : "italic",
                color: transcript ? "text.primary" : "text.secondary",
                fontSize: "1.1rem",
                mb: transcript ? 2 : 0,
                textAlign: "center",
              }}
            >
              {transcript || "Speak to record a score..."}
            </Typography>

            {lastRecognizedNumber !== null && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Chip
                  label={`Last recognized number: ${lastRecognizedNumber}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: "bold", fontSize: "1.1rem", py: 1 }}
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* Controls */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            mb: 3,
            pt: 1,
            pb: 3,
            borderBottom: "1px solid #eee",
          }}
        >
          <Tooltip title={isListening ? "Stop listening" : "Start listening"}>
            <IconButton
              id="transcribe-now"
              color={isListening ? "error" : "primary"}
              onClick={toggleSpeechRecognition}
              size="large"
              sx={{
                boxShadow: 1,
                p: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {isListening ? (
                <StopIcon fontSize="large" />
              ) : (
                <MicIcon fontSize="large" />
              )}
            </IconButton>
          </Tooltip>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            {countdown !== null && (
              <Tooltip title="Cancel submission">
                <IconButton
                  color="error"
                  onClick={cancelCountdown}
                  size="large"
                  sx={{
                    boxShadow: 1,
                    p: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <CancelIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            )}

            <Button
              variant="contained"
              size="large"
              disabled={lastRecognizedNumber === null}
              onClick={() => {
                if (lastRecognizedNumber !== null) {
                  handleScore(lastRecognizedNumber, 3, 0);
                  setTranscript("");
                  setLastRecognizedNumber(null);
                  setCountdown(null);
                } else {
                  alert("No number recognized yet. Please speak a number first.");
                }
              }}
              endIcon={<SendIcon />}
              sx={{
                px: 4,
                boxShadow: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 3,
                },
              }}
            >
              {countdown !== null
                ? `Submit Score (${countdown}s)`
                : "Submit Score"}
            </Button>
          </Stack>
        </Stack>

        {/* Transcript Log Accordion */}
        <Accordion
          expanded={expandedLog}
          onChange={() => setExpandedLog(!expandedLog)}
          sx={{
            boxShadow: "none",
            "&:before": {
              display: "none",
            },
            "&.Mui-expanded": {
              margin: 0,
            },
            backgroundColor: "transparent",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.03)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <HistoryIcon sx={{ mr: 1, color: "text.secondary" }} />
              <Typography>Voice Recognition History</Typography>
              <Badge
                badgeContent={numberEntriesCount}
                color="primary"
                sx={{ ml: 2 }}
                max={99}
              >
                <Chip
                  label={`${transcriptLog.length} entries`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, maxHeight: "250px", overflow: "auto" }}>
            <List dense>
              {transcriptLog.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No transcriptions yet"
                    secondary="Start speaking to see the recognition history"
                    primaryTypographyProps={{ align: "center" }}
                    secondaryTypographyProps={{ align: "center" }}
                  />
                </ListItem>
              ) : (
                transcriptLog.map((entry, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        backgroundColor: entry.containsNumber
                          ? "rgba(25, 118, 210, 0.05)"
                          : "transparent",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            component="span"
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                fontWeight: entry.containsNumber
                                  ? "bold"
                                  : "normal",
                                color: entry.containsNumber
                                  ? "primary.main"
                                  : "text.primary",
                              }}
                            >
                              "{entry.text}"
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTimestamp(entry.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          entry.containsNumber ? (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Chip
                                size="small"
                                label={`Number: ${entry.extractedNumber}`}
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            </Box>
                          ) : (
                            "No number detected"
                          )
                        }
                      />
                    </ListItem>
                    {index < transcriptLog.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
};

export default VoiceInput;
