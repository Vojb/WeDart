import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import ThemeProvider from "./theme/ThemeProvider";
import React from "react";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </ThemeProvider>
  );
};

export default App;
