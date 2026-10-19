import { createTheme } from "@mui/material/styles";
const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5", light: "#eeedff", dark: "#3730a3" },
    secondary: { main: "#0f766e" },
    background: { default: "#f6f7fb", paper: "#ffffff" },
    text: { primary: "#17233b", secondary: "#64748b" },
    divider: "#e5e9f2",
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontSize: "1.8rem", fontWeight: 750, letterSpacing: "-0.04em" },
    h5: { fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.025em" },
    h6: { fontSize: "1rem", fontWeight: 700 },
    body1: { fontSize: ".94rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, minHeight: 38 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: "#e5e9f2" } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiDialogActions: {
      styleOverrides: { root: { padding: "16px 24px", gap: 8 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { color: "#64748b", background: "#f8fafc", fontWeight: 600 },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*:focus-visible": { outline: "3px solid #818cf8", outlineOffset: 3 },
        "::selection": { background: "#ddd6fe" },
      },
    },
  },
});
export default theme;
