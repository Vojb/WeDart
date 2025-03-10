import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Mic, EmojiEvents, ExpandMore } from "@mui/icons-material";
import VibrationButton from "./VibrationButton";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";

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
// const LANGUAGE_OPTIONS = [
//   { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
//   { code: "bg-BG", name: "Bulgarian" },
//   { code: "cs-CZ", name: "Czech" },
//   { code: "da-DK", name: "Danish" },
//   { code: "de-DE", name: "German" },
//   { code: "el-GR", name: "Greek" },
//   { code: "en-AU", name: "English (Australia)" },
//   { code: "en-CA", name: "English (Canada)" },
//   { code: "en-GB", name: "English (UK)" },
//   { code: "en-IE", name: "English (Ireland)" },
//   { code: "en-US", name: "English (US)" },
//   { code: "es-ES", name: "Spanish (Spain)" },
//   { code: "es-MX", name: "Spanish (Mexico)" },
//   { code: "fi-FI", name: "Finnish" },
//   { code: "fr-CA", name: "French (Canada)" },
//   { code: "fr-FR", name: "French (France)" },
//   { code: "hi-IN", name: "Hindi" },
//   { code: "it-IT", name: "Italian" },
//   { code: "ja-JP", name: "Japanese" },
//   { code: "ko-KR", name: "Korean" },
//   { code: "nl-NL", name: "Dutch" },
//   { code: "no-NO", name: "Norwegian" },
//   { code: "pl-PL", name: "Polish" },
//   { code: "pt-BR", name: "Portuguese (Brazil)" },
//   { code: "pt-PT", name: "Portuguese (Portugal)" },
//   { code: "ro-RO", name: "Romanian" },
//   { code: "ru-RU", name: "Russian" },
//   { code: "sk-SK", name: "Slovak" },
//   { code: "sv-SE", name: "Swedish" },
//   { code: "th-TH", name: "Thai" },
//   { code: "tr-TR", name: "Turkish" },
//   { code: "zh-CN", name: "Chinese (Simplified)" },
//   { code: "zh-HK", name: "Chinese (Hong Kong)" },
//   { code: "zh-TW", name: "Chinese (Traditional)" },
// ];

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
  onListeningChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [recognizedScore, setRecognizedScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "unknown"
  >("unknown");
  const [showScoreConfirmation, setShowScoreConfirmation] = useState(false);
  const [language, setLanguage] = useState<string>("sv-SE");
  const countdownIntervalRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const [inCooldown, setInCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownIntervalRef = useRef<number | null>(null);
  // New state for dart count dialog
  const [dartCountDialogOpen, setDartCountDialogOpen] = useState(false);
  const [selectedDartCount, setSelectedDartCount] = useState<number>(3);
  const [winDialogOpen, setWinDialogOpen] = useState(false);

  // Reference to the transcription object
  const transcriptionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null);

  // Clean up intervals when component unmounts
  useEffect(() => {
    return () => {
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      // Clear cooldown interval
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }

      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Clear timeout if any
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Stop listening if active
      stopListening();
    };
  }, []);

  // Log current player score for debugging
  useEffect(() => {
    console.log(transcript, "Current player score:", currentPlayerScore);
  }, [currentPlayerScore]);

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

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      if (transcriptionRef.current) {
        try {
          transcriptionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition on unmount:", error);
        }
        transcriptionRef.current = null;
      }
    };
  }, []);

  // Get language base code (e.g., "en" from "en-US")
  const getLanguageBase = (languageCode: string): string => {
    return languageCode.split("-")[0].toLowerCase();
  };

  // Process the transcript to find a score
  const processTranscript = (text: string): number | null => {
    // Immediately return null if in cooldown to prevent any score processing
    if (inCooldown) {
      console.log("In cooldown period, ignoring transcript:", text);
      return null;
    }

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
    if (isSubmitting || inCooldown) {
      console.log("Not submitting score - already submitting or in cooldown");
      return;
    }

    setIsSubmitting(true);
    setRecognizedScore(score);
    setShowScoreConfirmation(true);

    // Clear transcript again to be extra safe
    setTranscript("");

    // Validate the score before submitting
    if (score > 180) {
      console.error("Invalid score:", score);

      setErrorMessage("Invalid score. Please try again.");
      setIsSubmitting(false);
      setTranscript("");
      return;
    }

    // Check if this would be a winning score
    if (currentPlayerScore !== undefined && score === currentPlayerScore) {
      console.log("Game winning score detected!", score, currentPlayerScore);

      setDartCountDialogOpen(true);
      setIsSubmitting(false);
      // For winning scores, we don't start the cooldown interval
      // The score will be submitted by handleDartCountSelection
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

    // Start cooldown period (4 seconds)
    setInCooldown(true);
    setCooldownSeconds(4);

    // Clear any existing cooldown interval
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    // Set up cooldown interval
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Clear interval when cooldown reaches 0
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          setInCooldown(false);

          // Only submit the score after cooldown is finished
          console.log("Cooldown finished, now submitting score to game");
          // Submit the score to the game
          // Always use lastDartMultiplier of 2 to ensure it works with double-out rule
          onScore(score, 3, 2); // Use default 3 darts and always use double as last dart

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setIsSubmitting(false);
  };

  // Handle speech recognition result with transcript logging
  const handleSpeechRecognitionResult = (e: any) => {
    // Ignore results if in cooldown
    if (inCooldown) {
      console.log("In cooldown period, ignoring speech recognition results");
      return;
    }

    const resultText = e.results[0][0].transcript;
    setTranscript(resultText);

    // Add to transcript log
    setTranscriptLog((prev) => {
      // Keep only the last 10 entries
      const newLog = [...prev, resultText];
      if (newLog.length > 10) {
        return newLog.slice(newLog.length - 10);
      }
      return newLog;
    });

    // Only process final results to avoid premature score detection
    if (e.results[0].isFinal) {
      const detectedScore = processTranscript(resultText);
      console.log(
        "Detected score:",
        detectedScore,
        "Current player score:",
        currentPlayerScore
      );

      if (detectedScore !== null) {
        // Clear transcript immediately to prevent double registration
        setTranscript("");

        // Immediately stop the current recognition session to prevent duplicate processing
        if (transcriptionRef.current) {
          try {
            transcriptionRef.current.stop();
          } catch (error) {
            console.error("Error stopping speech recognition:", error);
          }
        }

        // Submit the detected score
        submitScore(detectedScore);
      }
    }
  };

  const stopListening = () => {
    console.log("stop listening");
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (transcriptionRef.current) {
      try {
        transcriptionRef.current.stop();
        // Don't set to null here, as the 'end' event will handle cleanup
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        // If there was an error stopping, we should clean up the reference
        transcriptionRef.current = null;
      }
    }

    // Set listening state immediately to avoid UI flicker
    setIsListening(false);
  };

  // Handle speech recognition end event properly
  const handleSpeechRecognitionEnd = () => {
    console.log("Speech recognition ended");
    setIsListening(false);

    // Store the current state of transcriptionRef before nullifying it
    transcriptionRef.current = null;

    // Don't restart listening if in cooldown
    if (inCooldown) {
      console.log("In cooldown period, not restarting speech recognition");
      return;
    }

    // Always restart listening unless component is unmounting or permission is denied
    if (permissionStatus === "granted") {
      const delay = 300;
      console.log(`Auto-restarting speech recognition in ${delay}ms`);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        // Only check permission status and cooldown status before restarting
        if (permissionStatus === "granted" && !inCooldown) {
          // Clear transcript before starting new recognition session
          setTranscript("");
          startListening();
        } else if (inCooldown) {
          console.log("Still in cooldown, not starting speech recognition");
        }
      }, delay);
    }
  };

  // Start listening with improved error handling
  const startListening = () => {
    // Prevent starting if already listening or in cooldown
    if (isListening || transcriptionRef.current || inCooldown) {
      console.log(
        "Not starting speech recognition - already listening or in cooldown"
      );
      return;
    }

    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      // Check if speech recognition is available
      if (isSpeechRecognitionAvailable) {
        // Create a new speech recognition instance
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        transcriptionRef.current = new SpeechRecognition();

        // Configure the speech recognition
        transcriptionRef.current.continuous = true; // Set to true to keep listening
        transcriptionRef.current.interimResults = true;
        transcriptionRef.current.lang = language;

        // Handle results
        transcriptionRef.current.addEventListener(
          "result",
          handleSpeechRecognitionResult
        );

        // Handle end event
        transcriptionRef.current.addEventListener(
          "end",
          handleSpeechRecognitionEnd
        );

        // Handle start event
        transcriptionRef.current.addEventListener("start", () => {
          console.log("Speech recognition started");
          setIsListening(true);
          setErrorMessage(null);
        });

        // Start the speech recognition
        transcriptionRef.current.start();

        // Notify parent component about listening state change
        if (onListeningChange) {
          onListeningChange(true);
        }
      } else {
        console.error("Speech recognition not available");
        setErrorMessage("Speech recognition not available on this device");
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setErrorMessage("Error starting speech recognition");
      setIsListening(false);
      transcriptionRef.current = null;
    }
  };

  // Change language
  const changeLanguage = (languageCode: string) => {
    setLanguage(languageCode);
    // Restart listening if active
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 300);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === "sv-SE" ? "en-US" : "sv-SE";
    changeLanguage(newLanguage);
  };

  // Clear transcript log
  const clearTranscriptLog = () => {
    setTranscriptLog([]);
  };

  // Handle dart count selection for winning throw
  const handleDartCountSelection = (dartCount: number) => {
    setSelectedDartCount(dartCount);
    setDartCountDialogOpen(false);

    if (recognizedScore !== null) {
      // Show win dialog
      setWinDialogOpen(true);

      // Submit the score with the selected dart count
      console.log(
        "Submitting winning score with dart count:",
        recognizedScore,
        dartCount
      );
      // For a winning score, always use 2 as the lastDartMultiplier to indicate a double-out
      onScore(recognizedScore, dartCount, 2);
    }
  };

  // Close win dialog
  const handleCloseWinDialog = () => {
    setWinDialogOpen(false);
    setRecognizedScore(null);
    setIsSubmitting(false);
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
      {/* Listening status indicator */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: isListening
            ? alpha("#4caf50", 0.1)
            : "background.paper",
          border: isListening ? "1px solid #4caf50" : "none",
        }}
      >
        {inCooldown ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
              flex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Typography variant="body1" fontWeight="bold">
                Cooldown: {cooldownSeconds}s
              </Typography>
              <Typography variant="body2">
                Waiting before accepting new score
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {recognizedScore} Points
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  // Clear cooldown
                  if (cooldownIntervalRef.current) {
                    clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                  }
                  setInCooldown(false);
                  setCooldownSeconds(0);

                  // Reset score states
                  setRecognizedScore(null);

                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                }}
                sx={{
                  height: "fit-content",
                  alignSelf: "center",
                  ml: 2,
                }}
              >
                Undo
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                mb: 1,
              }}
            >
              <Typography variant="h6">Voice Input</Typography>

              {/* Language toggle */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {language === "sv-SE" ? "Swedish" : "English"}
                </Typography>
                <Switch
                  checked={language === "en-US"}
                  onChange={toggleLanguage}
                  color="primary"
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                position: "relative",
              }}
            >
              <IconButton
                color={isListening ? "success" : "primary"}
                sx={{
                  width: 80,
                  height: 80,
                  animation: isListening ? `${pulse} 1.5s infinite` : "none",
                  backgroundColor: isListening
                    ? alpha("#4caf50", 0.1)
                    : alpha("#1976d2", 0.1),
                  "&:hover": {
                    backgroundColor: isListening
                      ? alpha("#4caf50", 0.2)
                      : alpha("#1976d2", 0.2),
                  },
                }}
              >
                <Mic sx={{ fontSize: 40 }} />
              </IconButton>

              {isListening && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -25,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="success.main"
                    fontWeight="bold"
                  >
                    Listening...
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Transcript log */}
      <Accordion sx={{ mb: 2 }} elevation={2}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            display: "flex",
            flex: 0.4,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Transcript Log
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              clearTranscriptLog();
            }}
            disabled={transcriptLog.length === 0}
            sx={{ mr: 2 }}
          >
            Clear
          </Button>
        </AccordionSummary>

        <AccordionDetails sx={{ maxHeight: 200, overflow: "auto" }}>
          {transcriptLog.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 2 }}
            >
              No transcripts yet. Start speaking when the microphone is active.
            </Typography>
          ) : (
            <List dense>
              {transcriptLog.map((text, index) => (
                <ListItem
                  key={index}
                  divider={index < transcriptLog.length - 1}
                >
                  <ListItemText
                    primary={text}
                    secondary={`Entry ${transcriptLog.length - index}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Show error message if any */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Dart count dialog for winning score */}
      <Dialog
        open={dartCountDialogOpen}
        onClose={() => {
          setDartCountDialogOpen(false);
          setIsSubmitting(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>How many darts did you use?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You've scored {recognizedScore} to finish the game!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select how many darts you used to finish.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}>
            {[1, 2, 3].map((count) => (
              <VibrationButton
                key={count}
                variant={selectedDartCount === count ? "contained" : "outlined"}
                size="large"
                onClick={() => handleDartCountSelection(count)}
                sx={{ width: "30%", height: 60, fontSize: "1.5rem" }}
                vibrationPattern={50}
              >
                {count}
              </VibrationButton>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Win dialog */}
      <Dialog
        open={winDialogOpen}
        onClose={handleCloseWinDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <EmojiEvents color="primary" sx={{ mr: 1 }} />
          Game Won!
        </DialogTitle>
        <DialogContent>
          <Typography variant="h5" color="primary" gutterBottom>
            Congratulations!
          </Typography>
          <Typography variant="body1" paragraph>
            You've finished the game with a score of {recognizedScore}!
          </Typography>
          <Typography variant="body2">
            Darts used: {selectedDartCount}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseWinDialog}
            color="primary"
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
