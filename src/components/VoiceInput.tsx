import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Mic,
  MicOff,
  LooksOne,
  LooksTwo,
  Looks3,
  Info,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import React from "react";
import VibrationButton from "./VibrationButton";
import { alpha } from "@mui/material/styles";

// Add SpeechRecognition type definitions
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface VoiceInputProps {
  onScore: (score: number, darts: number, lastDartMultiplier?: number) => void;
  currentPlayerScore?: number;
  doubleOutRequired?: boolean;
}

// Define a type for recognized dart scores
interface RecognizedDart {
  value: number;
  multiplier: 1 | 2 | 3;
  description: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onScore,
  currentPlayerScore,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognizedDarts, setRecognizedDarts] = useState<RecognizedDart[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [dartCountDialogOpen, setDartCountDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "unknown"
  >("unknown");
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Check if SpeechRecognition is available
  const isSpeechRecognitionAvailable =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  // Check microphone permission status on component mount
  useEffect(() => {
    if (!isSpeechRecognitionAvailable) {
      setErrorMessage("Speech recognition is not supported in your browser.");
      return;
    }

    // Check if the browser supports the permissions API
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setPermissionStatus(permissionStatus.state);

          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);

            if (permissionStatus.state === "denied") {
              setIsListening(false);
              setErrorMessage(
                "Microphone access was denied. Please enable microphone access in your browser settings."
              );
            }
          };
        })
        .catch((error) => {
          console.error("Error checking microphone permission:", error);
          // If we can't check permissions, assume we need to ask
          setPermissionStatus("prompt");
        });
    } else {
      // Older browsers don't support the permissions API
      setPermissionStatus("prompt");
    }
  }, [isSpeechRecognitionAvailable]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechRecognitionAvailable) {
      return;
    }

    const SpeechRecognition = (window.SpeechRecognition ||
      window.webkitSpeechRecognition) as SpeechRecognitionConstructor;
    recognitionRef.current = new SpeechRecognition();

    // Configure recognition
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US"; // Default to English

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript.toLowerCase();
        setTranscript(transcriptText);

        // Process the transcript to find dart scores
        processTranscript(transcriptText);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);

        if (
          event.error === "not-allowed" ||
          event.error === "permission-denied"
        ) {
          setPermissionStatus("denied");
          setErrorMessage(
            "Microphone access was denied. Please enable microphone access in your browser settings."
          );
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }

        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSpeechRecognitionAvailable]);

  // Process the transcript to find dart scores
  const processTranscript = (text: string) => {
    // Reset timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check for trigger words: "Scored" in English or "Träffat" in Swedish
    const lowerText = text.toLowerCase();
    if (lowerText.includes("scored") || lowerText.includes("träffat")) {
      // Extract the dart scores from the text
      const darts = extractDartScores(lowerText);

      if (darts.length > 0) {
        setRecognizedDarts(darts);

        // Calculate total score
        const score = darts.reduce(
          (sum, dart) => sum + dart.value * dart.multiplier,
          0
        );
        setTotalScore(score);

        // Auto-submit after a short delay if we have recognized darts
        timeoutRef.current = window.setTimeout(() => {
          if (darts.length > 0) {
            handleSubmitScore();
          }
        }, 2000);
      }
    }
  };

  // Extract dart scores from the transcript
  const extractDartScores = (text: string): RecognizedDart[] => {
    const darts: RecognizedDart[] = [];

    // Regular expressions for different dart score patterns
    const singleNumberPattern =
      /\b(one|1|two|2|three|3|four|4|five|5|six|6|seven|7|eight|8|nine|9|ten|10|eleven|11|twelve|12|thirteen|13|fourteen|14|fifteen|15|sixteen|16|seventeen|17|eighteen|18|nineteen|19|twenty|20|bull|bullseye|25)\b/gi;
    const doublePattern =
      /\b(double|d) (one|1|two|2|three|3|four|4|five|5|six|6|seven|7|eight|8|nine|9|ten|10|eleven|11|twelve|12|thirteen|13|fourteen|14|fifteen|15|sixteen|16|seventeen|17|eighteen|18|nineteen|19|twenty|20|bull|bullseye|25)\b/gi;
    const triplePattern =
      /\b(triple|treble|t) (one|1|two|2|three|3|four|4|five|5|six|6|seven|7|eight|8|nine|9|ten|10|eleven|11|twelve|12|thirteen|13|fourteen|14|fifteen|15|sixteen|16|seventeen|17|eighteen|18|nineteen|19|twenty|20)\b/gi;

    // Swedish patterns
    const singleNumberPatternSv =
      /\b(ett|1|två|2|tre|3|fyra|4|fem|5|sex|6|sju|7|åtta|8|nio|9|tio|10|elva|11|tolv|12|tretton|13|fjorton|14|femton|15|sexton|16|sjutton|17|arton|18|nitton|19|tjugo|20|bull|bullseye|25)\b/gi;
    const doublePatternSv =
      /\b(dubbel|d) (ett|1|två|2|tre|3|fyra|4|fem|5|sex|6|sju|7|åtta|8|nio|9|tio|10|elva|11|tolv|12|tretton|13|fjorton|14|femton|15|sexton|16|sjutton|17|arton|18|nitton|19|tjugo|20|bull|bullseye|25)\b/gi;
    const triplePatternSv =
      /\b(trippel|t) (ett|1|två|2|tre|3|fyra|4|fem|5|sex|6|sju|7|åtta|8|nio|9|tio|10|elva|11|tolv|12|tretton|13|fjorton|14|femton|15|sexton|16|sjutton|17|arton|18|nitton|19|tjugo|20)\b/gi;

    // Helper function to convert word numbers to numeric values
    const wordToNumber = (word: string): number => {
      const wordMap: Record<string, number> = {
        one: 1,
        ett: 1,
        "1": 1,
        two: 2,
        två: 2,
        "2": 2,
        three: 3,
        tre: 3,
        "3": 3,
        four: 4,
        fyra: 4,
        "4": 4,
        five: 5,
        fem: 5,
        "5": 5,
        six: 6,
        sex: 6,
        "6": 6,
        seven: 7,
        sju: 7,
        "7": 7,
        eight: 8,
        åtta: 8,
        "8": 8,
        nine: 9,
        nio: 9,
        "9": 9,
        ten: 10,
        tio: 10,
        "10": 10,
        eleven: 11,
        elva: 11,
        "11": 11,
        twelve: 12,
        tolv: 12,
        "12": 12,
        thirteen: 13,
        tretton: 13,
        "13": 13,
        fourteen: 14,
        fjorton: 14,
        "14": 14,
        fifteen: 15,
        femton: 15,
        "15": 15,
        sixteen: 16,
        sexton: 16,
        "16": 16,
        seventeen: 17,
        sjutton: 17,
        "17": 17,
        eighteen: 18,
        arton: 18,
        "18": 18,
        nineteen: 19,
        nitton: 19,
        "19": 19,
        twenty: 20,
        tjugo: 20,
        "20": 20,
        bull: 25,
        bullseye: 25,
        "25": 25,
      };

      return wordMap[word.toLowerCase()] || 0;
    };

    // Process triples (English and Swedish)
    let match;
    while (
      (match = triplePattern.exec(text)) !== null ||
      (match = triplePatternSv.exec(text)) !== null
    ) {
      const number = wordToNumber(match[2]);
      if (number > 0 && number <= 20) {
        darts.push({
          value: number,
          multiplier: 3,
          description: `Triple ${number}`,
        });
      }
    }

    // Process doubles (English and Swedish)
    triplePattern.lastIndex = 0;
    triplePatternSv.lastIndex = 0;
    while (
      (match = doublePattern.exec(text)) !== null ||
      (match = doublePatternSv.exec(text)) !== null
    ) {
      const number = wordToNumber(match[2]);
      if ((number > 0 && number <= 20) || number === 25) {
        darts.push({
          value: number,
          multiplier: 2,
          description: `Double ${number}`,
        });
      }
    }

    // Process singles (English and Swedish)
    doublePattern.lastIndex = 0;
    doublePatternSv.lastIndex = 0;
    while (
      (match = singleNumberPattern.exec(text)) !== null ||
      (match = singleNumberPatternSv.exec(text)) !== null
    ) {
      const number = wordToNumber(match[0]);
      if ((number > 0 && number <= 20) || number === 25) {
        // Check if this number is already counted as part of a double or triple
        const isPartOfMultiplier =
          text.includes(`double ${match[0]}`) ||
          text.includes(`triple ${match[0]}`) ||
          text.includes(`dubbel ${match[0]}`) ||
          text.includes(`trippel ${match[0]}`);

        if (!isPartOfMultiplier) {
          darts.push({
            value: number,
            multiplier: 1,
            description: `${number}`,
          });
        }
      }
    }

    // Limit to 3 darts maximum
    return darts.slice(0, 3);
  };

  // Request microphone permission and start listening
  const requestMicrophonePermission = () => {
    setPermissionDialogOpen(false);

    // Try to start the recognition - this will trigger the browser's permission prompt
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setErrorMessage(null);
        setTranscript("");
        setRecognizedDarts([]);
        setTotalScore(0);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setErrorMessage(
          "Could not start speech recognition. Please try again."
        );
      }
    }
  };

  // Toggle listening state
  const toggleListening = () => {
    if (!isSpeechRecognitionAvailable) {
      setErrorMessage("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Check permission status before starting
      if (permissionStatus === "granted") {
        // Permission already granted, start listening
        if (recognitionRef.current) {
          setErrorMessage(null);
          setTranscript("");
          setRecognizedDarts([]);
          setTotalScore(0);

          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (error) {
            console.error("Error starting speech recognition:", error);
            setErrorMessage(
              "Could not start speech recognition. Please try again."
            );
          }
        }
      } else if (
        permissionStatus === "prompt" ||
        permissionStatus === "unknown"
      ) {
        // Need to request permission, show dialog first
        setPermissionDialogOpen(true);
      } else if (permissionStatus === "denied") {
        // Permission was denied, show error
        setErrorMessage(
          "Microphone access is blocked. Please enable microphone access in your browser settings and reload the page."
        );
      }
    }
  };

  // Handle submitting the score
  const handleSubmitScore = () => {
    if (recognizedDarts.length === 0) return;

    const score = recognizedDarts.reduce(
      (sum, dart) => sum + dart.value * dart.multiplier,
      0
    );

    // Calculate remaining score
    const remaining =
      currentPlayerScore !== undefined ? currentPlayerScore - score : undefined;

    // Check if player is finishing (reaching exactly 0)
    const isFinishing = remaining !== undefined && remaining === 0;

    // Check if this would be a bust
    const wouldBust = remaining !== undefined && remaining < 0;

    if (wouldBust) {
      // For bust, pass score as 0 (no points)
      setIsSubmitting(true);
      setTimeout(() => {
        onScore(0, 3, 1); // No points scored on bust
        resetInput();
        setIsSubmitting(false);
      }, 150);
    } else if (isFinishing) {
      // Open dialog to ask for dart count only on finish
      setDartCountDialogOpen(true);
    } else {
      // Not finishing, use default dart count
      setIsSubmitting(true);

      // Add a small delay to show the submission state
      setTimeout(() => {
        onScore(
          score,
          recognizedDarts.length || 3,
          recognizedDarts.length > 0
            ? recognizedDarts[recognizedDarts.length - 1].multiplier
            : 1
        );
        resetInput();
        setIsSubmitting(false);
      }, 150);
    }
  };

  // Handle dart count selection for checkout
  const handleDartCountSelection = (dartCount: number) => {
    const score = totalScore;

    setIsSubmitting(true);

    // Add a small delay to show the submission state
    setTimeout(() => {
      onScore(
        score,
        dartCount,
        recognizedDarts.length > 0
          ? recognizedDarts[recognizedDarts.length - 1].multiplier
          : 1
      );
      resetInput();
      setIsSubmitting(false);
      setDartCountDialogOpen(false);
    }, 150);
  };

  // Reset the input state
  const resetInput = () => {
    setTranscript("");
    setRecognizedDarts([]);
    setTotalScore(0);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Calculate if the input is valid
  const isValidScore = totalScore <= 180;

  // Calculate remaining score if currentPlayerScore is provided
  const remainingScore =
    currentPlayerScore !== undefined
      ? currentPlayerScore - totalScore
      : undefined;

  // Determine if this would be a bust (score < 0)
  const isBust = remainingScore !== undefined && remainingScore < 0;

  // Check if it's a valid checkout
  const isCheckout = remainingScore !== undefined && remainingScore === 0;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 0.5, sm: 1 },
      }}
    >
      {/* Score display area */}
      <Paper
        elevation={2}
        sx={{
          mb: { xs: 1, sm: 2 },
          p: { xs: 1, sm: 2 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          minHeight: { xs: 80, sm: 110 },
          position: "relative",
        }}
      >
        {/* Remaining score indicator in top-right corner */}
        {remainingScore !== undefined && !isBust && (
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              top: 8,
              right: 12,
              opacity: 0.5,
              fontWeight: "bold",
              fontSize: "1rem",
              color: isCheckout ? "success.main" : "text.secondary",
            }}
          >
            {Math.max(0, remainingScore)}
          </Typography>
        )}

        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: "500",
            color: !isValidScore || isBust ? "error.main" : "text.primary",
          }}
        >
          {totalScore || "0"}
        </Typography>

        {/* Recognized darts */}
        {recognizedDarts.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {recognizedDarts.map((dart, index) => (
              <Chip
                key={index}
                label={dart.description}
                color={
                  dart.multiplier === 1
                    ? "default"
                    : dart.multiplier === 2
                    ? "secondary"
                    : "primary"
                }
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        {/* Status display */}
        {remainingScore !== undefined && (
          <Typography
            variant="body1"
            sx={{
              mt: 0.5,
              fontWeight: "bold",
              color: isBust
                ? "error.main"
                : isCheckout
                ? "success.main"
                : "text.secondary",
            }}
          >
            {isBust ? "Bust!" : isCheckout ? "Checkout!" : ``}
          </Typography>
        )}

        {!isBust && !isValidScore && totalScore > 0 && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 8,
              color: "error.main",
              fontWeight: "bold",
            }}
          >
            Maximum score is 180
          </Typography>
        )}
      </Paper>

      {/* Transcript display */}
      {isListening && (
        <Paper
          elevation={1}
          sx={{
            mb: { xs: 1, sm: 2 },
            p: { xs: 1, sm: 2 },
            borderRadius: 2,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {transcript || "Listening..."}
          </Typography>
        </Paper>
      )}

      {/* Error message */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Permission status indicator */}
      {permissionStatus === "denied" && !errorMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Microphone access is blocked. Please enable it in your browser
          settings.
        </Alert>
      )}

      {/* Voice control buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <VibrationButton
          variant="contained"
          color={isListening ? "secondary" : "primary"}
          size="large"
          onClick={toggleListening}
          startIcon={isListening ? <MicOff /> : <Mic />}
          vibrationPattern={isListening ? [50, 50, 50] : 100}
          sx={{
            borderRadius: 28,
            height: 56,
            width: isListening ? 200 : 56,
            transition: "width 0.3s ease-in-out",
          }}
        >
          {isListening ? "Stop Listening" : ""}
        </VibrationButton>

        <Tooltip title="Voice Input Help">
          <IconButton
            color="primary"
            onClick={() => setInfoDialogOpen(true)}
            size="large"
          >
            <Info />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: "auto",
        }}
      >
        <VibrationButton
          variant="outlined"
          onClick={resetInput}
          disabled={recognizedDarts.length === 0 || isSubmitting}
          vibrationPattern={50}
        >
          Clear
        </VibrationButton>

        <VibrationButton
          variant="contained"
          color="primary"
          onClick={handleSubmitScore}
          disabled={
            recognizedDarts.length === 0 || !isValidScore || isSubmitting
          }
          vibrationPattern={100}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Submit"
          )}
        </VibrationButton>
      </Box>

      {/* Permission Request Dialog */}
      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Microphone Access Required</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            To use voice input, this app needs permission to access your
            microphone.
          </Typography>
          <Typography variant="body1" paragraph>
            When you click "Allow", your browser will show a permission request.
            Please click "Allow" to enable voice input.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Note: We only use your microphone to recognize dart scores. No audio
            is recorded or stored.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={requestMicrophonePermission}
            variant="contained"
            color="primary"
            startIcon={<Mic />}
          >
            Allow Microphone Access
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Voice Input Help</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            To use voice input, tap the microphone button and say one of the
            trigger phrases followed by your dart scores:
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold">
            Trigger phrases:
          </Typography>
          <Typography variant="body2" paragraph>
            • "Scored" (English)
            <br />• "Träffat" (Swedish)
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold">
            Examples:
          </Typography>
          <Typography variant="body2" paragraph>
            • "Scored twenty, triple nineteen, double twelve"
            <br />• "Träffat triple twenty, double twenty, five"
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold">
            Tips:
          </Typography>
          <Typography variant="body2">
            • Speak clearly and pause slightly between darts
            <br />
            • For multipliers, say "double" or "triple" before the number
            <br />
            • You can use numbers (1-20) or words (one-twenty)
            <br />
            • For bullseye, say "bull" or "bullseye" (25 points)
            <br />• The system will automatically submit after recognizing your
            darts
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Dart Count Dialog for Checkout */}
      <Dialog
        open={dartCountDialogOpen}
        onClose={() => setDartCountDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>How many darts used?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Select how many darts you used for this checkout:
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <VibrationButton
            onClick={() => handleDartCountSelection(1)}
            variant="contained"
            color="primary"
            startIcon={<LooksOne />}
            vibrationPattern={100}
          >
            1 Dart
          </VibrationButton>
          <VibrationButton
            onClick={() => handleDartCountSelection(2)}
            variant="contained"
            color="primary"
            startIcon={<LooksTwo />}
            vibrationPattern={100}
          >
            2 Darts
          </VibrationButton>
          <VibrationButton
            onClick={() => handleDartCountSelection(3)}
            variant="contained"
            color="primary"
            startIcon={<Looks3 />}
            vibrationPattern={100}
          >
            3 Darts
          </VibrationButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Add TypeScript declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export default VoiceInput;
