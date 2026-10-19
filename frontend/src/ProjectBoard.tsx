import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  CollisionDetection,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { boardKeyboardCoordinates } from "./board/keyboard";
import api from "./api/axiosInstance";
import { Column, Task } from "./board/types";
import ColumnPanel from "./board/ColumnPanel";
import AssistantPanel from "./board/AssistantPanel";
import TaskDetailModal from "./TaskDetailModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { useProject } from "./hooks/useProject";

const collision: CollisionDetection = (args) => {
  if (args.active.data.current?.type === "column")
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (c) => c.data.current?.type === "column",
      ),
    });
  const hits = pointerWithin(args);
  const tasks = hits.filter(
    (hit) =>
      args.droppableContainers.find((c) => c.id === hit.id)?.data.current
        ?.type === "task",
  );
  return tasks.length ? tasks : hits.length ? hits : closestCorners(args);
};
export default function ProjectBoard() {
  const { projectId } = useParams();
  const { project, loading, error, busy, reload, mutate, reorder } =
    useProject(projectId);
  const [taskDialog, setTaskDialog] = useState<{
    task?: Task;
    column?: Column;
  } | null>(null);
  const [columnDialog, setColumnDialog] = useState<{ column?: Column } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<{
    type: "tasks" | "columns";
    id: string;
    title: string;
  } | null>(null);
  const [activeLabel, setActiveLabel] = useState("");
  const [editingProject, setEditingProject] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: boardKeyboardCoordinates,
    }),
  );
  async function saveTask(data: {
    title: string;
    description: string;
    column: string;
  }) {
    const task = taskDialog?.task;
    const order =
      project?.columns.find((c) => c.id === data.column)?.tasks.length || 0;
    const ok = await mutate(
      () =>
        task
          ? api.patch(`/api/tasks/${task.id}/`, {
              ...data,
              ...(data.column !== task.column ? { order } : {}),
            })
          : api.post("/api/tasks/", { ...data, order }),
      task ? "Tarea actualizada" : "Tarea creada",
    );
    if (ok) setTaskDialog(null);
  }
  async function saveColumn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title")).trim();
    if (!title) return;
    const column = columnDialog?.column;
    if (
      await mutate(
        () =>
          column
            ? api.patch(`/api/columns/${column.id}/`, { title })
            : api.post("/api/columns/", {
                title,
                project: projectId,
                order: project?.columns.length || 0,
              }),
        column ? "Columna actualizada" : "Columna creada",
      )
    )
      setColumnDialog(null);
  }
  async function remove() {
    if (!deleting) return;
    if (
      await mutate(
        () => api.delete(`/api/${deleting.type}/${deleting.id}/`),
        "Elemento eliminado",
      )
    )
      setDeleting(null);
  }
  if (loading)
    return (
      <Stack spacing={3}>
        <Skeleton width="60%" height={70} />
        <Skeleton variant="rounded" height={400} />
      </Stack>
    );
  if (error || !project)
    return (
      <Alert
        severity="error"
        action={<Button onClick={reload}>Reintentar</Button>}
      >
        {error || "Proyecto no disponible."}
      </Alert>
    );
  return (
    <>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackRounded />}
        sx={{ mb: 2 }}
      >
        Todos los proyectos
      </Button>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ overflowWrap: "anywhere" }}
          >
            {project.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {project.description ||
              "Haz que el trabajo avance, una tarea a la vez."}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          <Button
            startIcon={<EditOutlined />}
            disabled={busy}
            onClick={() => setEditingProject(true)}
          >
            Editar proyecto
          </Button>
          <Chip
            label={`${project.columns.reduce((n, c) => n + c.tasks.length, 0)} tareas`}
            variant="outlined"
          />
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            disabled={busy}
            onClick={() => setColumnDialog({})}
          >
            Nueva columna
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ height: 4, mb: 2 }}>
        {busy && <LinearProgress aria-label="Guardando tablero" />}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 1fr) 320px",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {!project.columns.length && (
            <Paper variant="outlined" sx={{ p: 5, mb: 2, textAlign: "center" }}>
              <Typography variant="h5">
                Dale forma a tu flujo de trabajo
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Crea columnas como Pendiente, En curso y Completado.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={() => setColumnDialog({})}
              >
                Crear primera columna
              </Button>
            </Paper>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={collision}
            onDragStart={({ active }) => {
              const item =
                project.columns.find((c) => c.id === active.id) ||
                project.columns
                  .flatMap((c) => c.tasks)
                  .find((t) => t.id === active.id);
              setActiveLabel(
                (item && ("title" in item ? item.title : "")) || "",
              );
            }}
            onDragCancel={() => setActiveLabel("")}
            onDragEnd={({ active, over }) => {
              setActiveLabel("");
              if (over && active.id !== over.id)
                void reorder(String(active.id), String(over.id));
            }}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  "Pulsa espacio para arrastrar. Usa las flechas para mover y espacio para soltar. Escape cancela.",
              },
            }}
          >
            <Box
              aria-label="Tablero Kanban"
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                overflowX: "auto",
                pb: 3,
                minHeight: 220,
              }}
            >
              <SortableContext
                items={project.columns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {project.columns.map((column) => (
                  <ColumnPanel
                    key={column.id}
                    column={column}
                    busy={busy}
                    onOpen={(task) => setTaskDialog({ task })}
                    onDeleteTask={(task) =>
                      setDeleting({
                        type: "tasks",
                        id: task.id,
                        title: task.title,
                      })
                    }
                    onAdd={(column) => setTaskDialog({ column })}
                    onRename={(column) => setColumnDialog({ column })}
                    onDelete={(column) =>
                      setDeleting({
                        type: "columns",
                        id: column.id,
                        title: column.title,
                      })
                    }
                  />
                ))}
              </SortableContext>
              {!!project.columns.length && (
                <Button
                  startIcon={<AddRounded />}
                  disabled={busy}
                  onClick={() => setColumnDialog({})}
                  sx={{ flexShrink: 0 }}
                >
                  Añadir columna
                </Button>
              )}
            </Box>
            <DragOverlay>
              {activeLabel && (
                <Paper
                  sx={{
                    p: 2,
                    width: 280,
                    boxShadow: "0 16px 48px #17233b30",
                    border: "1px solid #818cf8",
                    transform: "rotate(2deg)",
                  }}
                >
                  <Typography fontWeight={600}>{activeLabel}</Typography>
                </Paper>
              )}
            </DragOverlay>
          </DndContext>
          <Typography variant="caption" color="text.secondary">
            Usa el asa para arrastrar. Con teclado: espacio, flechas y espacio
            para soltar. También puedes cambiar de columna desde el detalle de
            una tarea.
          </Typography>
        </Box>
        <AssistantPanel key={project.id} projectId={project.id} />
      </Box>
      {editingProject && (
        <Dialog
          open
          onClose={busy ? undefined : () => setEditingProject(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="edit-project-title"
        >
          <Box
            component="form"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const name = String(form.get("name")).trim();
              if (!name) return;
              if (
                await mutate(
                  () =>
                    api.patch(`/api/projects/${projectId}/`, {
                      name,
                      description: String(form.get("description")),
                    }),
                  "Proyecto actualizado",
                )
              )
                setEditingProject(false);
            }}
          >
            <DialogTitle id="edit-project-title">Editar proyecto</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  autoFocus
                  required
                  label="Nombre del proyecto"
                  name="name"
                  defaultValue={project.name}
                  inputProps={{ maxLength: 200 }}
                  disabled={busy}
                />
                <TextField
                  label="Descripción"
                  name="description"
                  defaultValue={project.description || ""}
                  multiline
                  rows={3}
                  disabled={busy}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button disabled={busy} onClick={() => setEditingProject(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={busy}>
                Guardar proyecto
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
      {taskDialog && (
        <TaskDetailModal
          key={taskDialog.task?.id || taskDialog.column?.id}
          task={taskDialog.task}
          columns={
            taskDialog.column
              ? [
                  taskDialog.column,
                  ...project.columns.filter(
                    (c) => c.id !== taskDialog.column?.id,
                  ),
                ]
              : project.columns
          }
          busy={busy}
          onClose={() => setTaskDialog(null)}
          onSave={saveTask}
        />
      )}
      {columnDialog && (
        <Dialog
          open
          onClose={busy ? undefined : () => setColumnDialog(null)}
          fullWidth
          maxWidth="xs"
          aria-labelledby="column-title"
        >
          <Box component="form" onSubmit={saveColumn}>
            <DialogTitle id="column-title">
              {columnDialog.column ? "Renombrar columna" : "Nueva columna"}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                required
                fullWidth
                label="Nombre de la columna"
                name="title"
                defaultValue={columnDialog.column?.title || ""}
                inputProps={{ maxLength: 100 }}
                sx={{ mt: 1 }}
                disabled={busy}
              />
            </DialogContent>
            <DialogActions>
              <Button disabled={busy} onClick={() => setColumnDialog(null)}>
                Cancelar
              </Button>
              <Button variant="contained" type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Guardar columna"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
      {deleting && (
        <ConfirmDialog
          title={`Eliminar ${deleting.type === "tasks" ? "tarea" : "columna"}`}
          description={`Se eliminará “${deleting.title}”${deleting.type === "columns" ? " y todas sus tareas" : ""}. Esta acción no se puede deshacer.`}
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
