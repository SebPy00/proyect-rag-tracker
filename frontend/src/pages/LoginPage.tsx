import { FormEvent, useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import AuthContext from "../context/AuthContext";
export default function LoginPage() {
  const auth = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await auth.loginUser(
        String(form.get("username")),
        String(form.get("password")),
      );
      navigate("/", { replace: true });
    } catch {
      setError(
        "No pudimos iniciar sesión. Revisa tus credenciales y la conexión.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (auth.user) return <Navigate to="/" replace />;
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
      }}
    >
      <Stack
        sx={{
          background: "linear-gradient(145deg, #171f42, #3730a3)",
          color: "white",
          p: { xs: 4, md: 8 },
          justifyContent: "space-between",
          minHeight: { md: "100vh" },
        }}
        spacing={5}
      >
        <Typography fontWeight={800}>◧ &nbsp; PROJECT TRACKER</Typography>
        <Box>
          <Chip
            label="Menos ruido. Más claridad."
            sx={{ bgcolor: "#ffffff18", color: "white", mb: 3 }}
          />
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: 36, md: 56 },
              fontWeight: 750,
              letterSpacing: "-.045em",
              lineHeight: 1.1,
            }}
          >
            Dale espacio
            <br />a tus proyectos.
          </Typography>
          <Typography sx={{ mt: 3, color: "#c7d2fe", maxWidth: 400 }}>
            Organiza ideas, conecta tareas y sigue el progreso de tu equipo en
            un solo lugar.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "#c7d2fe" }}>
          Un tablero claro para cada próximo paso.
        </Typography>
      </Stack>
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{ p: { xs: 3, md: 6 } }}
      >
        <Paper sx={{ maxWidth: 400, width: "100%", bgcolor: "transparent" }}>
          <Typography variant="h4" component="h1">
            Bienvenido de nuevo
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            Inicia sesión en tu espacio de trabajo.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={submit}>
            <Stack spacing={2.5}>
              <TextField
                required
                autoFocus
                fullWidth
                label="Nombre de usuario"
                name="username"
                autoComplete="username"
                disabled={busy}
              />
              <TextField
                required
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                disabled={busy}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={busy || auth.loading}
                endIcon={<ArrowForwardRounded />}
              >
                {busy ? "Iniciando sesión…" : "Entrar al workspace"}
              </Button>
            </Stack>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            ¿Necesitas acceso? Contacta con el administrador de tu organización.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
