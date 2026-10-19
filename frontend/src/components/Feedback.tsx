import { createContext, useContext, useState, ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";
const Feedback = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export const useFeedback = () => useContext(Feedback);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  return (
    <Feedback.Provider
      value={(message, error = false) => setNotice({ message, error })}
    >
      {children}
      <Snackbar
        open={!!notice}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          severity={notice?.error ? "error" : "success"}
          onClose={() => setNotice(null)}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Feedback.Provider>
  );
}
