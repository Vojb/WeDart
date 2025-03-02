import React, { useState, useEffect } from "react";
import { Button, Snackbar, Alert, Typography, Paper } from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import WifiOffIcon from "@mui/icons-material/WifiOff";

/**
 * Component that handles PWA installation prompts and offline status notifications
 */
const PWAInstallPrompt: React.FC = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOfflineReadyMessage, setShowOfflineReadyMessage] = useState(false);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    console.log("PWAInstallPrompt mounted", isOnline);

    const beforeInstallPromptHandler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect if app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
      console.log("PWA was installed");
    });

    // Online/offline detection
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        setShowOfflineMessage(true);
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener("message", (event) => {
      if (event.data?.type === "OFFLINE_READY") {
        setShowOfflineReadyMessage(true);
      }
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptHandler
      );
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }

    // Show the install prompt
    installPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPromptEvent.userChoice;

    // Reset the deferred prompt variable
    setInstallPromptEvent(null);

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
  };

  return (
    <>
      {/* Install prompt button - only shown if not installed and prompt is available */}
      {!isInstalled && installPromptEvent && (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1000,
            padding: 2,
            maxWidth: 320,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="body1" sx={{ mb: 1 }}>
            Install WeDart to use offline and get the best experience!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInstallClick}
            startIcon={<GetAppIcon />}
          >
            Install App
          </Button>
        </Paper>
      )}

      {/* Offline message */}
      <Snackbar
        open={showOfflineMessage}
        autoHideDuration={6000}
        onClose={() => setShowOfflineMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          icon={<WifiOffIcon />}
          onClose={() => setShowOfflineMessage(false)}
        >
          You are currently offline. The app will continue to work with limited
          features.
        </Alert>
      </Snackbar>

      {/* Offline ready message */}
      <Snackbar
        open={showOfflineReadyMessage}
        autoHideDuration={6000}
        onClose={() => setShowOfflineReadyMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setShowOfflineReadyMessage(false)}
        >
          WeDart is now available for offline use!
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallPrompt;
