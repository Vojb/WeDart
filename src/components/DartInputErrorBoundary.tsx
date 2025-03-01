import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class DartInputErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("DartInput Error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Paper
          sx={{
            p: 3,
            m: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h5" color="error">
            Dart Input Error
          </Typography>

          <Typography variant="body1">
            There was a problem loading the dart input.
          </Typography>

          {this.state.error && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "#f8f8f8",
                borderRadius: 1,
                width: "100%",
                overflow: "auto",
              }}
            >
              <Typography
                variant="body2"
                color="error"
                component="pre"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {this.state.error.toString()}
              </Typography>

              {this.state.errorInfo && (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ mt: 2, fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default DartInputErrorBoundary;
