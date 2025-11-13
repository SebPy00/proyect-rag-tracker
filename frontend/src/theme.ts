// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E88E5",
      dark: "#1565C0",
      light: "#90CAF9",
    },
    secondary: {
      main: "#F5B971",  // un beige más cálido para acentos
      light: "#F5E9DA",
      dark: "#E08A3D",
    },
    background: {
      default: "#F5F5F7", // fondo general
      paper: "#FFFFFF",   // tarjetas / paneles
    },
    text: {
      primary: "#1F2933",
      secondary: "#6B7280",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: "0.95rem",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 999,
          paddingInline: 20,
        },
      },
    },
  },
});

export default theme;
