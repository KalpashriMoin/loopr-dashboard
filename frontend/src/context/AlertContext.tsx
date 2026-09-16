import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Stack, Alert, Slide } from "@mui/material";
import { AlertMessage } from "../types";

interface AlertContextValue {
  notify: (message: string, severity?: AlertMessage["severity"]) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, severity: AlertMessage["severity"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setAlerts((prev) => [...prev, { id, message, severity }]);
      // Auto-dismiss after 5s, like a toast
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <AlertContext.Provider value={{ notify }}>
      {children}
      <Stack
        spacing={1}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 2000,
          maxWidth: 380,
        }}
      >
        {alerts.map((alert) => (
          <Slide key={alert.id} direction="left" in mountOnEnter unmountOnExit>
            <Alert
              severity={alert.severity}
              variant="filled"
              onClose={() => dismiss(alert.id)}
              sx={{ borderRadius: 3, boxShadow: 4 }}
            >
              {alert.message}
            </Alert>
          </Slide>
        ))}
      </Stack>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextValue => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within an AlertProvider");
  return ctx;
};
