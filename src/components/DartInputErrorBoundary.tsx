import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      m: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: (theme) =>
        theme.palette.mode === "dark"
          ? "rgba(50, 50, 50, 0.9)"
          : "rgba(255, 235, 235, 0.9)",
    }}
  >
    <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
    <Typography variant="h5" color="error" gutterBottom>
      Dart Input Error
    </Typography>
    <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
      There was a problem loading the dart input component.
    </Typography>
    <Typography
      variant="body2"
      sx={{
        mb: 2,
        color: "text.secondary",
        maxWidth: "100%",
        overflow: "auto",
      }}
    >
      <code>{error.message}</code>
    </Typography>
    <Button variant="contained" color="primary" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </Paper>
);

interface DartInputErrorBoundaryProps {
  children: ReactNode;
}

interface DartInputErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DartInputErrorBoundary extends Component<
  DartInputErrorBoundaryProps,
  DartInputErrorBoundaryState
> {
  constructor(props: DartInputErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): DartInputErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("DartInput component error:", error);
    console.error("Error stack:", errorInfo.componentStack);
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ErrorFallback
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DartInputErrorBoundary;
