import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import ThemeProvider from "./theme/ThemeProvider";
import React from "react";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;
