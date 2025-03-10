import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
} from "@mui/material";
import { useX01Store } from "../store/useX01Store";
import React, { useState, useEffect, useRef } from "react";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";

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
  const [language, setLanguage] = useState("en-US");
  const [lastRecognizedNumber, setLastRecognizedNumber] = useState<
    number | null
  >(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      recognitionRef.current.continuous = true;

      // Handle recognition results
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);

        // Extract number from transcript
        const number = extractNumberFromTranscript(currentTranscript);
        if (number !== null) {
          setLastRecognizedNumber(number);
        }
      };

      // Handle recognition end
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
    </Box>
  );
};

export default VoiceInput;
