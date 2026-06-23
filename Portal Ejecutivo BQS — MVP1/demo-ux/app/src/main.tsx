import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "@/auth/session";
import { ToastProvider } from "@/components/ui/Toast";
import { App } from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
