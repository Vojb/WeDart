import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Mic, MicOff, Language, CheckCircle, Close } from "@mui/icons-material";
import VibrationButton from "./VibrationButton";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import { vibrateDevice } from "../theme/ThemeProvider";

// Define a pulse animation for the microphone
const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

interface VoiceInputProps {
  onScore: (score: number, darts: number, lastDartMultiplier?: number) => void;
  currentPlayerScore?: number;
  doubleOutRequired?: boolean;
  onListeningChange?: (isListening: boolean) => void;
}

// Language options for speech recognition
const LANGUAGE_OPTIONS = [
  { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
  { code: "bg-BG", name: "Bulgarian" },
  { code: "cs-CZ", name: "Czech" },
  { code: "da-DK", name: "Danish" },
  { code: "de-DE", name: "German" },
  { code: "el-GR", name: "Greek" },
  { code: "en-AU", name: "English (Australia)" },
  { code: "en-CA", name: "English (Canada)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "en-IE", name: "English (Ireland)" },
  { code: "en-US", name: "English (US)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "fi-FI", name: "Finnish" },
  { code: "fr-CA", name: "French (Canada)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "hi-IN", name: "Hindi" },
  { code: "it-IT", name: "Italian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "nl-NL", name: "Dutch" },
  { code: "no-NO", name: "Norwegian" },
  { code: "pl-PL", name: "Polish" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)" },
  { code: "ro-RO", name: "Romanian" },
  { code: "ru-RU", name: "Russian" },
  { code: "sv-SE", name: "Swedish" },
  { code: "tr-TR", name: "Turkish" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
];

// Number dictionaries for different languages
const NUMBER_DICTIONARIES: Record<string, Record<string, number>> = {
  // English numbers
  en: {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  },
  // Swedish numbers
  sv: {
    noll: 0,
    ett: 1,
    en: 1,
    två: 2,
    tva: 2,
    tre: 3,
    fyra: 4,
    fem: 5,
    sex: 6,
    sju: 7,
    åtta: 8,
    atta: 8,
    nio: 9,
    tio: 10,
    elva: 11,
    tolv: 12,
    tretton: 13,
    fjorton: 14,
    femton: 15,
    sexton: 16,
    sjutton: 17,
    arton: 18,
    nitton: 19,
    tjugo: 20,
    trettio: 30,
    fyrtio: 40,
    femtio: 50,
    sextio: 60,
    sjuttio: 70,
    åttio: 80,
    attio: 80,
    nittio: 90,
    hundra: 100,
  },
  // German numbers
  de: {
    null: 0,
    eins: 1,
    zwei: 2,
    drei: 3,
    vier: 4,
    fünf: 5,
    funf: 5,
    sechs: 6,
    sieben: 7,
    acht: 8,
    neun: 9,
    zehn: 10,
    elf: 11,
    zwölf: 12,
    zwolf: 12,
    dreizehn: 13,
    vierzehn: 14,
    fünfzehn: 15,
    funfzehn: 15,
    sechzehn: 16,
    siebzehn: 17,
    achtzehn: 18,
    neunzehn: 19,
    zwanzig: 20,
    dreißig: 30,
    dreissig: 30,
    vierzig: 40,
    fünfzig: 50,
    funfzig: 50,
    sechzig: 60,
    siebzig: 70,
    achtzig: 80,
    neunzig: 90,
    hundert: 100,
  },
};

const VoiceInput: React.FC<VoiceInputProps> = ({
  onScore,
  currentPlayerScore,
  doubleOutRequired,
  onListeningChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognizedScore, setRecognizedScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "unknown"
  >("unknown");
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [showScoreConfirmation, setShowScoreConfirmation] = useState(false);
  const [language, setLanguage] = useState<string>("sv-SE");
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [confirmScoreDialogOpen, setConfirmScoreDialogOpen] = useState(false);
  const [scoreToConfirm, setScoreToConfirm] = useState<number | null>(null);
  const [lastEnteredScore, setLastEnteredScore] = useState<number | null>(null);
  const [switchingPlayer, setSwitchingPlayer] = useState(false);
  const [showLastScore, setShowLastScore] = useState(false);

  // Reference to the transcription object
  const transcriptionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  // Check if SpeechRecognition is available
  const isSpeechRecognitionAvailable =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Notify parent component when listening state changes
  useEffect(() => {
    console.log("Listening state changed:", isListening);
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  // Check microphone permission on component mount
  useEffect(() => {
    if (!isSpeechRecognitionAvailable) {
      return;
    }

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setPermissionStatus(permissionStatus.state);

          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);

            if (permissionStatus.state === "denied") {
              stopListening();
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

  // Initialize component and start listening automatically
  useEffect(() => {
    // Check if we should be listening but aren't
    if (
      isSpeechRecognitionAvailable &&
      permissionStatus === "granted" &&
      !showScoreConfirmation &&
      !isListening &&
      !transcriptionRef.current
    ) {
      console.log("Auto-starting listening");
      // Start listening automatically when component is mounted and not showing score
      startListening();
    }
  }, [
    isSpeechRecognitionAvailable,
    permissionStatus,
    showScoreConfirmation,
    isListening,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get language base code (e.g., "en" from "en-US")
  const getLanguageBase = (languageCode: string): string => {
    return languageCode.split("-")[0].toLowerCase();
  };

  // Process the transcript to find a score
  const processTranscript = (text: string): number | null => {
    if (!text || text.trim() === "") return null;

    const lowerText = text.toLowerCase().trim();
    console.log("Processing transcript:", lowerText);

    // Try to extract a number directly from the text
    const extractedNumber = extractNumber(lowerText);
    if (
      extractedNumber !== null &&
      extractedNumber >= 0 &&
      extractedNumber <= 180
    ) {
      return extractedNumber;
    }

    // Try to parse spoken number words based on the current language
    const languageBase = getLanguageBase(language);
    const numberDictionary =
      NUMBER_DICTIONARIES[languageBase] || NUMBER_DICTIONARIES["en"];

    // Look for number words in the transcript
    let foundScore = 0;
    let foundAnyNumber = false;

    // Simple word matching for numbers
    for (const [word, value] of Object.entries(numberDictionary)) {
      if (lowerText.includes(word)) {
        // For tens values (20, 30, 40, etc.)
        if (value >= 20 && value % 10 === 0) {
          foundScore += value;
          foundAnyNumber = true;

          // Look for ones digits that might follow
          for (let i = 1; i <= 9; i++) {
            const onesWord = Object.entries(numberDictionary).find(
              ([_, v]) => v === i
            )?.[0];
            if (onesWord && lowerText.includes(`${word} ${onesWord}`)) {
              foundScore += i;
              break;
            }
          }
        }
        // For "hundred"/"hundra"/"hundert"
        else if (value === 100) {
          if (foundAnyNumber) {
            // If we already found a number, multiply it by 100
            foundScore *= 100;
          } else {
            // Otherwise, just use 100
            foundScore = 100;
            foundAnyNumber = true;
          }
        }
        // For single digits or teens if we haven't found a tens value yet
        else if (!foundAnyNumber && value < 100) {
          foundScore = value;
          foundAnyNumber = true;
        }
      }
    }

    if (foundAnyNumber && foundScore >= 0 && foundScore <= 180) {
      return foundScore;
    }

    return null;
  };

  // Extract number from text
  const extractNumber = (text: string): number | null => {
    // Try to match three-digit numbers (100-180)
    const threeDigitMatch = text.match(/\b(1[0-7][0-9]|180)\b/);
    if (threeDigitMatch) {
      return parseInt(threeDigitMatch[1]);
    }

    // Try to match two-digit numbers (10-99)
    const twoDigitMatch = text.match(/\b([1-9][0-9])\b/);
    if (twoDigitMatch) {
      return parseInt(twoDigitMatch[1]);
    }

    // Try to match single-digit numbers (0-9)
    const singleDigitMatch = text.match(/\b([0-9])\b/);
    if (singleDigitMatch) {
      return parseInt(singleDigitMatch[1]);
    }

    return null;
  };

  // Submit the score after confirmation
  const submitScore = (score: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setRecognizedScore(score);
    setShowScoreConfirmation(true);
    setLastEnteredScore(score);
    setShowLastScore(true);

    // Validate the score before submitting
    if (score < 0 || score > 180) {
      console.error("Invalid score:", score);
      setErrorMessage("Invalid score. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Check if this would be a bust
    if (currentPlayerScore !== undefined && score > currentPlayerScore) {
      console.log(
        "Bust detected:",
        score,
        "is greater than remaining",
        currentPlayerScore
      );
      // Still show the score but mark as bust
    }

    // Check if double out is required for checkout
    if (
      doubleOutRequired &&
      currentPlayerScore !== undefined &&
      currentPlayerScore === score
    ) {
      // For double out, we need to ensure the last dart is a double
      // Default to assuming the last dart is a double for checkout
      const lastDartMultiplier = 2;
      console.log("Checkout with double out:", score);

      // Submit the score to the game with double out
      onScore(score, 3, lastDartMultiplier);
    } else {
      // Normal score submission
      console.log("Submitting score:", score);

      // Submit the score to the game
      onScore(score, 3, 1); // Use default 3 darts and multiplier 1
    }

    // Show "Next Player" indication for 2 seconds
    setSwitchingPlayer(true);

    // Vibrate device to indicate player switch
    vibrateDevice([100, 50, 100]);

    // Reset after showing confirmation and automatically start listening again
    setTimeout(() => {
      setShowScoreConfirmation(false);
      setIsSubmitting(false);
      setTranscript("");
      setRecognizedScore(null);
      setSwitchingPlayer(false);

      // Keep showing the last score for a bit longer
      setTimeout(() => {
        setShowLastScore(false);
      }, 3000);

      // Automatically start listening again after a short delay
      setTimeout(() => {
        if (permissionStatus === "granted") {
          startListening();
        }
      }, 500);
    }, 2000); // Reduced from 3000ms to 2000ms to make the transition faster
  };

  // Start speech recognition
  const startListening = () => {
    if (!isSpeechRecognitionAvailable) {
      setErrorMessage("Speech recognition is not supported in your browser.");
      return;
    }

    // Stop any existing transcription
    stopListening();

    try {
      // Create a new transcription object using the Progressier approach
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognitionAPI =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        transcriptionRef.current = new SpeechRecognitionAPI();

        // Configure the transcription
        transcriptionRef.current.lang = language;
        transcriptionRef.current.interimResults = true;

        // Handle results
        transcriptionRef.current.addEventListener("result", (e: any) => {
          const resultText = e.results[0][0].transcript;
          setTranscript(resultText);

          // Only process final results to avoid premature score detection
          if (e.results[0].isFinal) {
            const detectedScore = processTranscript(resultText);
            if (detectedScore !== null) {
              // Show confirmation dialog instead of immediately submitting

              if (detectedScore !== null) {
                // Validate the score before submitting
                if (detectedScore < 0 || detectedScore > 180) {
                  setErrorMessage("Invalid score. Please try again.");
                  setScoreToConfirm(null);
                  return;
                }

                // Submit the confirmed score
                submitScore(detectedScore);
                setTranscript("");
                setRecognizedScore(null);
                setShowScoreConfirmation(false);
              } else {
                // If not confirmed, do NOT automatically resume listening
                // Just reset the score to confirm
                setScoreToConfirm(null);
              }

              // Stop listening while confirming
              stopListening();
            }
          }
        });

        // Handle end event
        transcriptionRef.current.addEventListener("end", () => {
          console.log("Speech recognition ended");
          setIsListening(false);
          transcriptionRef.current = null;
        });

        // Handle start event
        transcriptionRef.current.addEventListener("start", () => {
          console.log("Speech recognition started");
          setIsListening(true);
          setErrorMessage(null);
        });

        // Handle errors
        transcriptionRef.current.addEventListener("error", (e: any) => {
          console.error("Speech recognition error:", e.error);

          if (e.error === "not-allowed" || e.error === "permission-denied") {
            setPermissionStatus("denied");
            setErrorMessage(
              "Microphone access was denied. Please enable microphone access in your browser settings."
            );
          } else {
            setErrorMessage(`Speech recognition error: ${e.error}`);
          }

          setIsListening(false);
        });

        // Start the transcription
        transcriptionRef.current.start();
        // Set listening state immediately to avoid UI flicker
        setIsListening(true);
      } else {
        setErrorMessage("Speech recognition is not supported in your browser.");
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setErrorMessage("Could not start speech recognition. Please try again.");
      setIsListening(false);
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (transcriptionRef.current) {
      try {
        transcriptionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
      transcriptionRef.current = null;
    }
    // Set listening state immediately to avoid UI flicker
    setIsListening(false);
  };

  // Toggle listening state

  // Request microphone permission and start listening
  const requestMicrophonePermission = () => {
    setPermissionDialogOpen(false);
    startListening();
  };

  // Open language selection dialog
  const openLanguageDialog = () => {
    setLanguageDialogOpen(true);
  };

  // Change language
  const changeLanguage = (languageCode: string) => {
    setLanguage(languageCode);
    setLanguageDialogOpen(false);

    // Restart listening if active
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  // Handle score confirmation
  const handleScoreConfirmation = (confirmed: boolean) => {
    setConfirmScoreDialogOpen(false);

    if (confirmed && scoreToConfirm !== null) {
      // Validate the score before submitting
      if (scoreToConfirm < 0 || scoreToConfirm > 180) {
        setErrorMessage("Invalid score. Please try again.");
        setScoreToConfirm(null);
        return;
      }

      // Submit the confirmed score
      submitScore(scoreToConfirm);
    } else {
      // If not confirmed, do NOT automatically resume listening
      // Just reset the score to confirm
      setScoreToConfirm(null);
    }
  };

  // Calculate remaining score if currentPlayerScore is provided
  const remainingScore =
    currentPlayerScore !== undefined && recognizedScore !== null
      ? currentPlayerScore - recognizedScore
      : undefined;

  // Determine if this would be a bust (score < 0)
  const isBust = remainingScore !== undefined && remainingScore < 0;

  // Check if it's a valid checkout
  const isCheckout = remainingScore !== undefined && remainingScore === 0;

  // Get current language display name
  const getCurrentLanguageName = () => {
    const langOption = LANGUAGE_OPTIONS.find(
      (option) => option.code === language
    );
    return langOption ? langOption.name : "English (US)";
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
      {/* Top controls with language selection only - only show when not displaying score */}
      {!showScoreConfirmation && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          {/* Language selection */}
          <Tooltip title={`Current language: ${getCurrentLanguageName()}`}>
            <Button
              onClick={openLanguageDialog}
              color="primary"
              variant="outlined"
              size="small"
              startIcon={<Language />}
            >
              {language.split("-")[0].toUpperCase()}
            </Button>
          </Tooltip>

          {/* Listening status indicator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid",
              borderColor: isListening ? "success.main" : "error.main",
              borderRadius: 4,
              px: 1.5,
              py: 0.5,
              backgroundColor: (theme) =>
                alpha(
                  isListening
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                  0.05
                ),
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: isListening ? "success.main" : "error.main",
                mr: 1,
                ...(isListening && {
                  animation: `${pulse} 1.5s infinite ease-in-out`,
                }),
              }}
            />
            <Typography
              variant="body2"
              color={isListening ? "success.main" : "error.main"}
              fontWeight="medium"
            >
              {isListening ? "Listening" : "Not listening"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Conditional rendering based on whether we're showing score or input UI */}
      {recognizedScore !== null && showScoreConfirmation ? (
        // Score display area - show when score is confirmed
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            mb: { xs: 1, sm: 2 },
            p: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            position: "relative",
            backgroundColor: (theme) => alpha(theme.palette.success.light, 0.1),
            border: "1px solid",
            borderColor: "success.light",
            transition: "all 0.3s ease-in-out",
          }}
        >
          {/* Remaining score indicator */}
          {remainingScore !== undefined && !isBust && (
            <Typography
              variant="body2"
              sx={{
                position: "absolute",
                top: 8,
                right: 12,
                opacity: 0.7,
                fontWeight: "bold",
                fontSize: "1rem",
                color: isCheckout ? "success.main" : "text.secondary",
              }}
            >
              {Math.max(0, remainingScore)}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
              animation: `${pulse} 1.5s 1`,
            }}
          >
            <CheckCircle color="success" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" color="success.main" fontWeight="bold">
              Score Added
            </Typography>
          </Box>

          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: "500",
              color: isBust
                ? "error.main"
                : isCheckout
                ? "success.main"
                : "text.primary",
              my: 1,
              animation: "fadeIn 0.5s ease-in-out",
              "@keyframes fadeIn": {
                "0%": { opacity: 0, transform: "scale(0.9)" },
                "100%": { opacity: 1, transform: "scale(1)" },
              },
            }}
          >
            {recognizedScore}
          </Typography>

          {/* Status display */}
          {remainingScore !== undefined && (
            <Typography
              variant="body1"
              sx={{
                mt: 0.5,
                fontWeight: "bold",
                fontSize: "1.1rem",
                color: isBust
                  ? "error.main"
                  : isCheckout
                  ? "success.main"
                  : "text.secondary",
                padding: isBust || isCheckout ? "4px 12px" : 0,
                borderRadius: 2,
                backgroundColor: isBust
                  ? alpha("#f44336", 0.1)
                  : isCheckout
                  ? alpha("#4caf50", 0.1)
                  : "transparent",
              }}
            >
              {isBust ? "Bust!" : isCheckout ? "Checkout!" : ""}
            </Typography>
          )}

          {/* Next Player Indication */}
          {switchingPlayer && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                animation: "fadeInUp 0.5s ease-out",
                "@keyframes fadeInUp": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <Typography
                variant="h6"
                color="primary.main"
                fontWeight="bold"
                sx={{
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                  padding: "6px 16px",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.main",
                }}
              >
                Next Player
              </Typography>
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              opacity: 0.7,
              animation: "fadeIn 1s ease-in-out",
            }}
          >
            Ready for next player...
          </Typography>

          <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
            <CircularProgress size={16} sx={{ mr: 1, opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary">
              Listening will start automatically
            </Typography>
          </Box>
        </Paper>
      ) : (
        // Main voice input area - only show when not displaying score
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
                Say your score...
              </Typography>

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
            </Box>
          ) : (
            // Not listening state - show instructions and permission request if needed
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                align="center"
              >
                Voice Score Input
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

              {permissionStatus === "granted" ? (
                <>
                  <Typography variant="body1" align="center" paragraph>
                    Initializing voice recognition...
                  </Typography>
                  <CircularProgress size={24} />
                </>
              ) : (
                <>
                  <Typography variant="body1" align="center" paragraph>
                    Microphone access is required
                  </Typography>
                  <VibrationButton
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={requestMicrophonePermission}
                    startIcon={<Mic />}
                    vibrationPattern={100}
                    sx={{ mt: 2 }}
                  >
                    Allow Microphone
                  </VibrationButton>
                </>
              )}
            </Box>
          )}

          {/* Error message */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mt: 2, width: "100%" }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}
        </Paper>
      )}

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

      {/* Language selection dialog */}
      <Dialog
        open={languageDialogOpen}
        onClose={() => setLanguageDialogOpen(false)}
        aria-labelledby="language-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="language-dialog-title">
          Select Recognition Language
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {LANGUAGE_OPTIONS.map((option) => (
              <Button
                key={option.code}
                variant={language === option.code ? "contained" : "outlined"}
                onClick={() => changeLanguage(option.code)}
                sx={{ justifyContent: "flex-start", textAlign: "left" }}
              >
                {option.name}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLanguageDialogOpen(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Score confirmation dialog */}
      <Dialog
        open={confirmScoreDialogOpen}
        onClose={() => handleScoreConfirmation(false)}
        aria-labelledby="confirm-score-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: "80%", sm: 400 },
          },
        }}
      >
        <DialogTitle
          id="confirm-score-dialog-title"
          sx={{ textAlign: "center", pb: 1 }}
        >
          Confirm Score
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography
              variant="h2"
              color="primary"
              gutterBottom
              sx={{
                fontWeight: "bold",
                animation: "pulse 1s infinite ease-in-out",
                "@keyframes pulse": {
                  "0%": { opacity: 0.8 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.8 },
                },
              }}
            >
              {scoreToConfirm}
            </Typography>
            <DialogContentText>
              Is this the correct score you want to submit?
            </DialogContentText>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <Button
            onClick={() => handleScoreConfirmation(false)}
            color="error"
            variant="outlined"
            startIcon={<MicOff />}
            size="large"
          >
            Try Again
          </Button>
          <Button
            onClick={() => handleScoreConfirmation(true)}
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
            size="large"
            autoFocus
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display last entered score when not showing score confirmation */}
      {!showScoreConfirmation && showLastScore && lastEnteredScore !== null && (
        <>
          {/* Semi-transparent backdrop */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
              animation: "fadeIn 0.3s ease-in-out",
              "@keyframes fadeIn": {
                "0%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
            }}
            onClick={() => setShowLastScore(false)}
          />
          <Paper
            elevation={3}
            sx={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              padding: "12px 24px",
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
              border: "2px solid",
              borderColor: "info.main",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              minWidth: "180px",
              boxShadow: (theme) =>
                `0 4px 20px ${alpha(theme.palette.info.main, 0.25)}`,
            }}
          >
            {/* Close button */}
            <IconButton
              size="small"
              onClick={() => setShowLastScore(false)}
              sx={{
                position: "absolute",
                top: 5,
                right: 5,
                color: "info.main",
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Typography
              variant="body1"
              color="info.main"
              fontWeight="medium"
              sx={{ mb: 0.5 }}
            >
              Last Score
            </Typography>
            <Typography
              variant="h3"
              color="info.dark"
              fontWeight="bold"
              sx={{
                animation: "pulseScore 2s infinite ease-in-out",
                "@keyframes pulseScore": {
                  "0%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.05)" },
                  "100%": { transform: "scale(1)" },
                },
              }}
            >
              {lastEnteredScore}
            </Typography>

            {/* Next Player indication */}
            {switchingPlayer && (
              <Typography
                variant="subtitle1"
                color="primary.main"
                fontWeight="bold"
                sx={{
                  mt: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                  padding: "4px 12px",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "primary.main",
                  animation: "fadeInUp 0.5s ease-out",
                  "@keyframes fadeInUp": {
                    "0%": { opacity: 0, transform: "translateY(10px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                Next Player
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default VoiceInput;

// Add SpeechRecognition to Window interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    transcriptionInProgress: any;
  }
}
