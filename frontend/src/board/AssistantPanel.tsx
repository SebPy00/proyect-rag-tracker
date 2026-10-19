import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import SendRounded from "@mui/icons-material/SendRounded";
import api from "../api/axiosInstance";
import { Capabilities, Message } from "./types";
export default function AssistantPanel({ projectId }: { projectId: string }) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setCapabilities(null);
    setMessages([]);
    Promise.all([
      api.get<Capabilities>("/api/capabilities/"),
      api.get<Message[]>(`/api/projects/${projectId}/history/`),
    ])
      .then(([caps, history]) => {
        if (active) {
          setCapabilities(caps.data);
          setMessages(history.data);
        }
      })
      .catch(() => {
        if (active)
          setError("No pudimos consultar la disponibilidad del asistente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages]);
  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || !capabilities?.rag_available || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/projects/${projectId}/ask/`, {
        question: question.trim(),
      });
      const response = await api.get<Message[]>(
        `/api/projects/${projectId}/history/`,
      );
      setMessages(response.data);
      setQuestion("");
    } catch (error: unknown) {
      const response = (
        error as { response?: { data?: { detail?: string; code?: string } } }
      ).response;
      if (response?.data?.code === "ai_disabled")
        setCapabilities((c) => c && { ...c, rag_available: false });
      setError(
        response?.data?.detail ||
          "No se pudo obtener una respuesta. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }
  const available = !!capabilities?.rag_available;
  return (
    <Paper
      variant="outlined"
      component="aside"
      aria-label="Asistente del proyecto"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 300,
        maxHeight: { lg: "calc(100vh - 230px)" },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ p: 2.5, borderBottom: 1, borderColor: "divider" }}
      >
        <AutoAwesomeOutlined color="primary" />
        <Typography variant="h6" sx={{ flex: 1 }}>
          Asistente
        </Typography>
        <Chip
          size="small"
          label={
            available ? "Disponible" : loading ? "Consultando" : "En pausa"
          }
          color={available ? "success" : "default"}
        />
      </Stack>
      <Box sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
        {loading && (
          <CircularProgress size={22} aria-label="Consultando capacidades" />
        )}
        {!loading && !available && (
          <Alert severity="info" icon={<AutoAwesomeOutlined />}>
            El asistente está temporalmente no disponible. Puedes seguir
            organizando tus proyectos y tareas con normalidad.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {available && !messages.length && (
          <Box sx={{ py: 3 }}>
            <Typography fontWeight={600}>
              Una nueva perspectiva sobre tu proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pregunta sobre las tareas del tablero para encontrar información
              relacionada.
            </Typography>
          </Box>
        )}
        <Box role="log" aria-label="Historial del asistente" aria-live="polite">
          {messages.map((message, i) => (
            <Box
              key={i}
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor:
                  message.sender === "user" ? "primary.light" : "#f8fafc",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                {message.sender === "user" ? "Tú" : "Asistente"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  mt: 0.5,
                }}
              >
                {message.text}
              </Typography>
            </Box>
          ))}
          <div ref={end} />
        </Box>
      </Box>
      <Box
        component="form"
        onSubmit={ask}
        sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
      >
        <Stack spacing={1}>
          <TextField
            label="Pregunta sobre tu proyecto"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!available || busy}
            multiline
            maxRows={4}
            inputProps={{ maxLength: 4000 }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={
              busy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendRounded />
              )
            }
            disabled={!available || busy || !question.trim()}
          >
            {busy ? "Consultando…" : "Enviar pregunta"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
