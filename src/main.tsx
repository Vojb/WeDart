import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { registerSW } from "virtual:pwa-register";

// Register the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, click on reload button to update.");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});
updateSW();

const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
