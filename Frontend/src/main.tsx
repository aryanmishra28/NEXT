// src/main.tsx (drop-in replacement)
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Filter out browser extension errors from console (safer)
if (typeof window !== "undefined") {
  const originalError = console.error.bind(console);
  console.error = (...args: any[]) => {
    try {
      const errorMessage = args.map(a => (typeof a === "string" ? a : String(a))).join(" ");

      // Ignore noisy extension messages
      if (
        errorMessage.includes("message channel closed") ||
        errorMessage.includes("asynchronous response") ||
        errorMessage.includes("Extension context invalidated") ||
        errorMessage.includes("chrome-extension://") ||
        errorMessage.includes("moz-extension://")
      ) {
        return;
      }
    } catch (e) {
      // If anything goes wrong while checking, fall back to original logging
      originalError(...args);
      return;
    }

    originalError(...args);
  };

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const errorMessage = event.reason?.message || String(event.reason || "");
      if (
        errorMessage.includes("message channel closed") ||
        errorMessage.includes("asynchronous response") ||
        errorMessage.includes("Extension context invalidated")
      ) {
        event.preventDefault();
        return;
      }
    } catch (e) {
      // ignore
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
