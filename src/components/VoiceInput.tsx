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
  DialogContentText,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Info,
  Close,
  CheckCircle,
  Language,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import React from "react";
import VibrationButton from "./VibrationButton";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";

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
  onListeningChange?: (isListening: boolean) => void;
}

// Define a type for recognized dart scores
interface RecognizedDart {
  value: number;
  multiplier: 1 | 2 | 3;
  description: string;
}

// Add interface for recognized point log
interface RecognizedPointLog {
  timestamp: number;
  darts: RecognizedDart[];
  totalScore: number;
  transcript: string;
}

// Define a pulsing animation for the listening indicator
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

const VoiceInput: React.FC<VoiceInputProps> = ({
  onScore,
  currentPlayerScore,
  onListeningChange,
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
  const [pointsLog, setPointsLog] = useState<RecognizedPointLog[]>([]);
  const [directScore, setDirectScore] = useState<number | null>(null);
  const [isManualDartInput, setIsManualDartInput] = useState(false);
  const [manualDarts, setManualDarts] = useState<RecognizedDart[]>([]);
  const [showScoreConfirmation, setShowScoreConfirmation] = useState(false);
  const [language, setLanguage] = useState<"en-US" | "sv-SE">("en-US");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Check if SpeechRecognition is available
  const isSpeechRecognitionAvailable =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  // Notify parent component when listening state changes
  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

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
      recognitionRef.current.lang = language; // Use the selected language

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
  }, [isSpeechRecognitionAvailable, language]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;

      // If currently listening, restart recognition with new language
      if (isListening) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
            }
          }
        }, 200);
      }
    }
  }, [language, isListening]);

  // Process the transcript to find dart scores
  const processTranscript = (text: string) => {
    // Reset timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const lowerText = text.toLowerCase();

    // Check for "final" command in English or "klar" in Swedish
    if (lowerText.includes("final") || lowerText.includes("klar")) {
      // Check if there's a number after "final" or "klar"
      const finalScoreMatch = lowerText.match(/(final|klar)\s+(\d+)/i);
      if (finalScoreMatch) {
        // If there's a number, use it as the direct score
        const score = parseInt(finalScoreMatch[2]);
        if (score >= 0 && score <= 180) {
          setDirectScore(score);
          setShowScoreConfirmation(true);

          // Add to points log
          setPointsLog((prevLog) => [
            {
              timestamp: Date.now(),
              darts: [],
              totalScore: score,
              transcript: `Final score: ${score}`,
            },
            ...prevLog.slice(0, 9),
          ]);
        }
      } else {
        // If just "final" or "klar" without a number, show score confirmation for current recognized darts
        if (recognizedDarts.length > 0) {
          setShowScoreConfirmation(true);

          // Add to points log if not already added
          if (!showScoreConfirmation) {
            setPointsLog((prevLog) => [
              {
                timestamp: Date.now(),
                darts: [...recognizedDarts],
                totalScore: totalScore,
                transcript: `Final command: ${totalScore}`,
              },
              ...prevLog.slice(0, 9),
            ]);
          }
        }
      }
      return;
    }

    // Check for just a number (direct score input)
    const justNumberMatch = lowerText.match(/^(\d+)$/);
    if (justNumberMatch) {
      const score = parseInt(justNumberMatch[1]);
      if (score >= 0 && score <= 180) {
        setDirectScore(score);
        setShowScoreConfirmation(true);

        // Add to points log
        setPointsLog((prevLog) => [
          {
            timestamp: Date.now(),
            darts: [],
            totalScore: score,
            transcript: `Direct score: ${score}`,
          },
          ...prevLog.slice(0, 9),
        ]);
        return;
      }
    }

    // Check for "darts" command in English or "pilar" in Swedish to start manual dart input
    if (lowerText.includes("darts") || lowerText.includes("pilar")) {
      setIsManualDartInput(true);
      setManualDarts([]);
      return;
    }

    // If in manual dart input mode, process individual darts
    if (isManualDartInput) {
      // Extract a single dart from the text
      const darts = extractDartScores(lowerText);
      if (darts.length > 0) {
        // Add the new dart to the manual darts array
        const newDart = darts[0];
        setManualDarts((prevDarts) => {
          const updatedDarts = [...prevDarts, newDart];

          // If we have 3 darts or the user says "done", calculate the score
          if (updatedDarts.length >= 3 || lowerText.includes("done")) {
            const totalScore = updatedDarts.reduce(
              (sum, dart) => sum + dart.value * dart.multiplier,
              0
            );

            // Add to points log
            setPointsLog((prevLog) => [
              {
                timestamp: Date.now(),
                darts: [...updatedDarts],
                totalScore,
                transcript:
                  "Manual dart input: " +
                  updatedDarts.map((d) => d.description).join(", "),
              },
              ...prevLog.slice(0, 9),
            ]);

            // Set recognized darts and total score
            setRecognizedDarts(updatedDarts);
            setTotalScore(totalScore);
            setShowScoreConfirmation(true);
            setIsManualDartInput(false);

            return updatedDarts;
          }

          return updatedDarts;
        });

        return;
      }
    }

    // Check for trigger words: "Scored" or "Träffat" in Swedish
    if (lowerText.includes("scored") || lowerText.includes("träffat")) {
      // Extract the dart scores from the text
      const darts = extractDartScores(lowerText);

      if (darts.length > 0) {
        // Limit to 3 darts maximum
        const limitedDarts = darts.slice(0, 3);
        setRecognizedDarts(limitedDarts);

        // Calculate total score
        const score = limitedDarts.reduce(
          (sum, dart) => sum + dart.value * dart.multiplier,
          0
        );
        setTotalScore(score);

        // Add to points log
        setPointsLog((prevLog) => [
          {
            timestamp: Date.now(),
            darts: [...limitedDarts],
            totalScore: score,
            transcript: text,
          },
          ...prevLog.slice(0, 9), // Keep only the 10 most recent entries
        ]);

        // Show score confirmation instead of auto-submitting
        setShowScoreConfirmation(true);

        // If we recognized 3 darts, stop listening after a short delay
        if (limitedDarts.length >= 3) {
          // Add a small delay to allow the user to see what was recognized
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              recognitionRef.current.stop();
              setIsListening(false);
            }
          }, 1500);
        }
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

  // Handle accepting the recognized score
  const handleAcceptScore = () => {
    if (directScore !== null) {
      // Submit the direct score
      setIsSubmitting(true);
      setTimeout(() => {
        onScore(directScore, 3, 1); // Use default 3 darts and multiplier 1
        resetInput();
        setIsSubmitting(false);
      }, 150);
    } else if (recognizedDarts.length > 0) {
      // Submit the recognized darts score
      handleSubmitScore();
    }

    setShowScoreConfirmation(false);
  };

  // Reset the input state
  const resetInput = () => {
    setTranscript("");
    setRecognizedDarts([]);
    setTotalScore(0);
    setDirectScore(null);
    setIsManualDartInput(false);
    setManualDarts([]);
    setShowScoreConfirmation(false);

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

  // Toggle language between English and Swedish
  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === "en-US" ? "sv-SE" : "en-US"));
  };

  // Function to remove a dart from the recognized darts
  const removeDart = (index: number) => {
    setRecognizedDarts((prevDarts) => {
      const updatedDarts = prevDarts.filter((_, i) => i !== index);

      // Recalculate total score
      const newTotalScore = updatedDarts.reduce(
        (sum, dart) => sum + dart.value * dart.multiplier,
        0
      );
      setTotalScore(newTotalScore);

      return updatedDarts;
    });
  };

  // Function to remove a dart from manual darts
  const removeManualDart = (index: number) => {
    setManualDarts((prevDarts) => prevDarts.filter((_, i) => i !== index));
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: { xs: 0.5, sm: 1 },
      }}
    >
      {/* Top controls with language toggle and start listening button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {/* Language toggle */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip
            title={`Recognition Language: ${
              language === "en-US" ? "English" : "Swedish"
            }`}
          >
            <Button
              onClick={toggleLanguage}
              color="primary"
              variant="outlined"
              size="small"
              startIcon={<Language />}
              sx={{ mr: 1 }}
            >
              {language === "en-US" ? "EN" : "SV"}
            </Button>
          </Tooltip>
        </Box>

        {/* Start listening button */}
        {!isListening && (
          <Button
            variant="contained"
            color="primary"
            onClick={toggleListening}
            startIcon={<Mic />}
            size="small"
          >
            Start Listening
          </Button>
        )}

        {/* Stop listening button */}
        {isListening && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={toggleListening}
            startIcon={<MicOff />}
            size="small"
          >
            Stop Listening
          </Button>
        )}
      </Box>

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

      {/* Main voice input area with central mic button */}
      <Paper
        elevation={1}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          mb: 2,
          borderRadius: 2,
          position: "relative",
          overflow: "auto",
        }}
      >
        {isListening ? (
          // Listening state - show active listening UI
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Microphone and listening indicator */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: `${pulse} 1.5s infinite ease-in-out`,
                mb: 2,
              }}
            >
              <Mic color="primary" sx={{ fontSize: 40 }} />
            </Box>

            <Typography
              variant="h6"
              color="primary"
              fontWeight="bold"
              gutterBottom
            >
              {isManualDartInput
                ? `Dart Input (${manualDarts.length}/3)`
                : "Listening..."}
            </Typography>

            {/* Voice command instructions - more prominent */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                width: "100%",
                borderRadius: 2,
                mb: 3,
                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
                borderLeft: "4px solid",
                borderColor: "info.main",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="info.main"
                gutterBottom
              >
                Voice Commands:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body2">
                  • Say <b>just a number</b> like <b>"120"</b> to enter a direct
                  score
                </Typography>
                <Typography variant="body2">
                  • Say <b>{language === "en-US" ? '"Final"' : '"Klar"'}</b> to
                  confirm the current score
                </Typography>
                <Typography variant="body2">
                  • Say <b>{language === "en-US" ? '"Darts"' : '"Pilar"'}</b> to
                  enter darts one by one
                </Typography>
                <Typography variant="body2">
                  • Say{" "}
                  <b>
                    {language === "en-US"
                      ? '"Scored triple 20, double 20, 5"'
                      : '"Träffat trippel 20, dubbel 20, 5"'}
                  </b>{" "}
                  to enter multiple darts
                </Typography>
              </Box>
            </Paper>

            {/* Live transcript display */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                width: "100%",
                borderRadius: 2,
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.9),
                borderLeft: "4px solid",
                borderColor: "primary.main",
                mb: 3,
                position: "relative",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="primary.main"
                gutterBottom
              >
                Currently Hearing:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {transcript || "Waiting for speech..."}
              </Typography>
            </Paper>

            {/* Manual dart input guidance */}
            {isManualDartInput && (
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  width: "100%",
                  borderRadius: 2,
                  mb: 3,
                  borderLeft: "4px solid",
                  borderColor: "secondary.main",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="secondary.main"
                  gutterBottom
                >
                  Manual Dart Input Mode
                </Typography>
                <Typography variant="body2" paragraph>
                  Say each dart one at a time. For example: "Triple 20"
                </Typography>
                <Typography variant="body2">
                  Say "Done" when finished or continue until 3 darts are
                  entered.
                </Typography>

                {manualDarts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Darts entered:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      {manualDarts.map((dart, index) => (
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
                          onDelete={() => removeManualDart(index)}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            {/* Score confirmation - Make it more prominent */}
            {showScoreConfirmation && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  width: "100%",
                  borderRadius: 2,
                  mb: 3,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.success.main, 0.1),
                  borderLeft: "4px solid",
                  borderColor: "success.main",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="success.main"
                  gutterBottom
                  align="center"
                >
                  Score Recognized!
                </Typography>

                {directScore !== null ? (
                  // Direct score display
                  <Box sx={{ textAlign: "center", my: 2 }}>
                    <Typography
                      variant="h3"
                      color="success.main"
                      fontWeight="bold"
                    >
                      {directScore}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      points
                    </Typography>
                  </Box>
                ) : (
                  // Darts display
                  <Box sx={{ my: 2 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        flexWrap: "wrap",
                        gap: 1,
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
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
                          size="medium"
                          onDelete={() => removeDart(index)}
                        />
                      ))}
                    </Stack>
                    <Typography
                      variant="h4"
                      align="center"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {totalScore} points
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={resetInput}
                    startIcon={<Close />}
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAcceptScore}
                    startIcon={<CheckCircle />}
                    size="large"
                  >
                    Accept Score
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Direct score input display */}
            {directScore !== null && !showScoreConfirmation && (
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  width: "100%",
                  borderRadius: 2,
                  mb: 3,
                  borderLeft: "4px solid",
                  borderColor: "success.main",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="success.main"
                  gutterBottom
                >
                  Direct Score Input
                </Typography>
                <Typography variant="h4" align="center" sx={{ my: 1 }}>
                  {directScore} points
                </Typography>
              </Paper>
            )}

            {/* Recognized darts in current session */}
            {recognizedDarts.length > 0 &&
              !isManualDartInput &&
              directScore === null &&
              !showScoreConfirmation && (
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    width: "100%",
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Recognized Darts:
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
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
                        onDelete={() => removeDart(index)}
                      />
                    ))}
                  </Stack>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Total: {totalScore} points
                  </Typography>
                </Paper>
              )}

            {/* Points log */}
            {pointsLog.length > 0 && (
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  width: "100%",
                  borderRadius: 2,
                  mb: 3,
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Recognition History:
                </Typography>
                {pointsLog.map((log, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom:
                        index < pointsLog.length - 1 ? "1px solid" : "none",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: "italic", mb: 1 }}
                    >
                      "{log.transcript}"
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      {log.darts.map((dart, dartIndex) => (
                        <Chip
                          key={dartIndex}
                          label={dart.description}
                          size="small"
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
                      <Chip
                        label={`Total: ${log.totalScore}`}
                        size="small"
                        color="success"
                      />
                    </Stack>
                  </Box>
                ))}
              </Paper>
            )}

            <VibrationButton
              variant="outlined"
              color="secondary"
              onClick={toggleListening}
              startIcon={<MicOff />}
              vibrationPattern={[50, 50, 50]}
              sx={{ mt: 2 }}
            >
              Stop Listening
            </VibrationButton>
          </Box>
        ) : (
          // Not listening state - show instructions
          <>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              align="center"
            >
              Voice Input Mode
            </Typography>

            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                my: 3,
              }}
            >
              <Mic color="primary" sx={{ fontSize: 50 }} />
            </Box>

            <Typography variant="body1" align="center" paragraph>
              Tap the microphone button below to start listening
            </Typography>

            {/* More prominent voice command instructions in non-listening state */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                width: "100%",
                maxWidth: 500,
                borderRadius: 2,
                mb: 3,
                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
                borderLeft: "4px solid",
                borderColor: "info.main",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="info.main"
                gutterBottom
                align="center"
              >
                Voice Commands
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Direct Score Input:
                  </Typography>
                  <Chip
                    label="120"
                    color="secondary"
                    sx={{ fontWeight: "bold", mr: 1 }}
                  />
                  <Chip
                    label={language === "en-US" ? "Final" : "Klar"}
                    color="secondary"
                    sx={{ fontWeight: "bold" }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Just say a number like <b>"120"</b> or{" "}
                    {language === "en-US" ? '"Final"' : '"Klar"'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Manual Dart Input:
                  </Typography>
                  <Chip
                    label={language === "en-US" ? "Darts" : "Pilar"}
                    color="secondary"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Then say each dart:{" "}
                    {language === "en-US"
                      ? '"Triple 20", "Double 5"'
                      : '"Trippel 20", "Dubbel 5"'}
                    , etc.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Multiple Darts:
                  </Typography>
                  <Chip
                    label={
                      language === "en-US"
                        ? "Scored twenty, triple nineteen, double twelve"
                        : "Träffat tjugo, trippel nitton, dubbel tolv"
                    }
                  />
                </Box>
              </Box>
            </Paper>

            <VibrationButton
              variant="contained"
              color="primary"
              size="large"
              onClick={toggleListening}
              startIcon={<Mic />}
              vibrationPattern={100}
              sx={{ mt: 2 }}
            >
              Start Listening
            </VibrationButton>

            {/* Show points log even when not listening */}
            {pointsLog.length > 0 && (
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  width: "100%",
                  borderRadius: 2,
                  mt: 3,
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Recognition History:
                </Typography>
                {pointsLog.map((log, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      pb: 2,
                      borderBottom:
                        index < pointsLog.length - 1 ? "1px solid" : "none",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: "italic", mb: 1 }}
                    >
                      "{log.transcript}"
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      {log.darts.map((dart, dartIndex) => (
                        <Chip
                          key={dartIndex}
                          label={dart.description}
                          size="small"
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
                      <Chip
                        label={`Total: ${log.totalScore}`}
                        size="small"
                        color="success"
                      />
                    </Stack>
                  </Box>
                ))}
              </Paper>
            )}
          </>
        )}
      </Paper>

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

      {/* Action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="outlined"
          onClick={resetInput}
          disabled={
            (recognizedDarts.length === 0 && directScore === null) ||
            isSubmitting
          }
        >
          Clear
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Voice Input Help">
            <IconButton
              color="primary"
              onClick={() => setInfoDialogOpen(true)}
              size="medium"
            >
              <Info />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitScore}
            disabled={
              (recognizedDarts.length === 0 && directScore === null) ||
              !isValidScore ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </Box>
      </Box>

      {/* Permission dialog */}
      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        aria-labelledby="permission-dialog-title"
      >
        <DialogTitle id="permission-dialog-title">
          Microphone Access Required
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This feature requires microphone access to recognize your voice.
            Please allow microphone access when prompted by your browser.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPermissionDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={requestMicrophonePermission}
            color="primary"
            variant="contained"
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dart count selection dialog */}
      <Dialog
        open={dartCountDialogOpen}
        onClose={() => setDartCountDialogOpen(false)}
        aria-labelledby="dart-count-dialog-title"
      >
        <DialogTitle id="dart-count-dialog-title">
          How many darts did you use?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the number of darts you used for this score.
          </DialogContentText>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              mt: 2,
            }}
          >
            {[1, 2, 3].map((count) => (
              <Button
                key={count}
                variant="outlined"
                onClick={() => handleDartCountSelection(count)}
                sx={{ minWidth: 60 }}
              >
                {count}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDartCountDialogOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        aria-labelledby="info-dialog-title"
      >
        <DialogTitle id="info-dialog-title">Voice Input Help</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="subtitle1" gutterBottom>
              How to use voice input:
            </Typography>
            <Typography variant="body2" paragraph>
              1. Tap the microphone button to start listening.
            </Typography>
            <Typography variant="body2" paragraph>
              2. Speak clearly and say your dart scores.
            </Typography>
            <Typography variant="body2" paragraph>
              3. You can use the following voice commands:
            </Typography>

            <Box sx={{ ml: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                Direct score:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Just say a number like <b>"120"</b> or{" "}
                {language === "en-US" ? '"Final"' : '"Klar"'}
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                Manual dart input:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                {language === "en-US" ? '"Darts"' : '"Pilar"'}
              </Typography>

              <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                Multiple darts:
              </Typography>
              <Typography variant="body2" sx={{ ml: 2 }}>
                {language === "en-US"
                  ? '"Scored triple 20, double 5, 1"'
                  : '"Träffat trippel 20, dubbel 5, 1"'}
              </Typography>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} color="primary">
            Close
          </Button>
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
