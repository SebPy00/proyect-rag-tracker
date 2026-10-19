import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import api from "../api/axiosInstance";
import ConfirmDialog from "../components/ConfirmDialog";
import { useFeedback } from "../components/Feedback";
import { Project } from "../board/types";
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [target, setTarget] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const notify = useFeedback();
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProjects((await api.get<Project[]>("/api/projects/")).data);
    } catch {
      setError("No pudimos cargar tus proyectos.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) return;
    setBusy(true);
    setFormError("");
    try {
      await api.post("/api/projects/", {
        name,
        description: String(form.get("description")).trim(),
      });
      setCreating(false);
      notify("Proyecto creado");
      await load();
    } catch {
      setFormError("No pudimos crear el proyecto. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!target) return;
    setBusy(true);
    try {
      await api.delete(`/api/projects/${target.id}/`);
      setTarget(null);
      notify("Proyecto eliminado");
      await load();
    } catch {
      notify("No pudimos eliminar el proyecto.", true);
    } finally {
      setBusy(false);
    }
  }
  const filtered = projects.filter((p) =>
    `${p.name} ${p.description || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Workspace / Proyectos
          </Typography>
          <Typography variant="h4" component="h1">
            Todo empieza con un proyecto
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Organiza el trabajo y convierte las ideas en próximos pasos.
          </Typography>
        </Box>
        <Button
          sx={{ alignSelf: "flex-start", mt: { sm: 3 } }}
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => {
            setCreating(true);
            setFormError("");
          }}
        >
          Nuevo proyecto
        </Button>
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Chip label={`${projects.length} proyectos`} variant="outlined" />
        <TextField
          label="Buscar proyectos"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>
      {error && (
        <Alert
          severity="error"
          action={<Button onClick={load}>Reintentar</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
          gap: 2.5,
        }}
      >
        {loading
          ? [1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={210} />
            ))
          : filtered.map((project, index) => (
              <Card
                key={project.id}
                variant="outlined"
                sx={{
                  position: "relative",
                  transition: "border-color .2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={`/project/${project.id}`}
                  sx={{ height: "100%" }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: index % 2 ? "#e1f4f0" : "primary.light",
                        color: index % 2 ? "secondary.main" : "primary.main",
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <FolderOutlined />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ pr: 3, overflowWrap: "anywhere" }}
                    >
                      {project.name}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                      sx={{
                        mt: 1,
                        minHeight: 40,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {project.description ||
                        "Un nuevo espacio para tus ideas y tareas."}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mt: 3 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {project.columns.reduce(
                          (n, c) => n + c.tasks.length,
                          0,
                        )}{" "}
                        tareas · {project.columns.length} columnas
                      </Typography>
                      <ArrowForwardRounded fontSize="small" color="primary" />
                    </Stack>
                  </CardContent>
                </CardActionArea>
                <IconButton
                  aria-label={`Eliminar proyecto ${project.name}`}
                  onClick={() => setTarget(project)}
                  sx={{ position: "absolute", top: 18, right: 14 }}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Card>
            ))}
      </Box>
      {!loading && !error && !filtered.length && (
        <Stack alignItems="center" spacing={2} sx={{ py: 10 }}>
          <FolderOutlined sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h5">
            {query ? "No hay coincidencias" : "Tu próximo proyecto te espera"}
          </Typography>
          <Typography color="text.secondary">
            {query
              ? "Prueba con otro nombre."
              : "Crea un proyecto y empieza a organizar tu trabajo."}
          </Typography>
          {!query && (
            <Button
              onClick={() => setCreating(true)}
              startIcon={<AddRounded />}
            >
              Crear mi primer proyecto
            </Button>
          )}
        </Stack>
      )}
      <Dialog
        open={creating}
        onClose={busy ? undefined : () => setCreating(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="new-project-title"
      >
        <Box component="form" onSubmit={create}>
          <DialogTitle id="new-project-title">Un nuevo comienzo</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField
                autoFocus
                required
                label="Nombre del proyecto"
                name="name"
                inputProps={{ maxLength: 200 }}
              />
              <TextField
                label="Descripción (opcional)"
                name="description"
                multiline
                rows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button disabled={busy} type="submit" variant="contained">
              {busy ? "Creando…" : "Crear proyecto"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {target && (
        <ConfirmDialog
          title="Eliminar proyecto"
          description={`Se eliminarán “${target.name}”, sus columnas, tareas e historial. Esta acción no se puede deshacer.`}
          busy={busy}
          onClose={() => setTarget(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
