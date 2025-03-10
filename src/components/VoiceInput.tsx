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
} from "@mui/material";
import { useX01Store } from "../store/useX01Store";
import React, { useState, useEffect, useRef } from "react";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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

    // Initialize speech recognition
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();

    if (recognitionRef.current) {
      // Configure recognition settings
      recognitionRef.current.lang = language;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true; // Set to true to keep listening

      // Handle recognition results
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript =
          event.results[event.results.length - 1][0].transcript;
        setTranscript(currentTranscript);

        // Extract number from transcript
        const number = extractNumberFromTranscript(currentTranscript);
        if (number !== null) {
          setLastRecognizedNumber(number);
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
        // Restart if still in listening mode
        if (isListening) {
          console.log("Restarting speech recognition");
          startListening();
        } else {
          setIsListening(false);
        }
      };

      // Handle recognition errors
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event);
      };

      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
      console.log("Speech recognition started");
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log("Speech recognition stopped by user");
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

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">
          Current Score:{" "}
          {currentGame?.players[currentGame.currentPlayerIndex]?.score}
        </Typography>

        <FormControl sx={{ minWidth: 150, ml: 2 }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-selector"
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
            size="small"
          >
            {languageOptions.map((option) => (
              <MenuItem key={option.code} value={option.code}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          mb: 2,
          p: 2,
          border: "1px solid #ddd",
          borderRadius: 1,
          minHeight: "60px",
        }}
      >
        <Typography id="results">
          {transcript || "Speak to record a score..."}
        </Typography>
        {lastRecognizedNumber !== null && (
          <Typography sx={{ mt: 1, fontWeight: "bold" }}>
            Last recognized number: {lastRecognizedNumber}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <IconButton
          id="transcribe-now"
          color={isListening ? "error" : "primary"}
          onClick={toggleSpeechRecognition}
          sx={{ mr: 2 }}
        >
          {isListening ? <StopIcon /> : <MicIcon />}
        </IconButton>

        <Button
          variant="contained"
          onClick={() => {
            if (lastRecognizedNumber !== null) {
              handleScore(lastRecognizedNumber, 3, 0);
              setTranscript("");
            } else {
              alert("No number recognized yet. Please speak a number first.");
            }
          }}
        >
          Submit Score
        </Button>
      </Box>

      {/* Transcript Log Accordion */}
      <Accordion
        expanded={expandedLog}
        onChange={() => setExpandedLog(!expandedLog)}
        sx={{ mt: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            Speech Recognition Log ({transcriptLog.length} entries)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, maxHeight: "300px", overflow: "auto" }}>
          <List dense>
            {transcriptLog.length === 0 ? (
              <ListItem>
                <ListItemText primary="No transcriptions yet. Start speaking to see the log." />
              </ListItem>
            ) : (
              transcriptLog.map((entry, index) => (
                <React.Fragment key={index}>
                  <ListItem>
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
                        entry.containsNumber
                          ? `Extracted number: ${entry.extractedNumber}`
                          : "No number detected"
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
    </Box>
  );
};

export default VoiceInput;
