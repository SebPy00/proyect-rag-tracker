import { FormEvent, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { Task, Column } from "./board/types";
export default function TaskDetailModal({
  task,
  columns,
  busy,
  onClose,
  onSave,
}: {
  task?: Task;
  columns: Column[];
  busy: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    column: string;
  }) => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [column, setColumn] = useState(task?.column || columns[0]?.id || "");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() && column)
      onSave({ title: title.trim(), description, column });
  }
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="task-title"
    >
      <Box component="form" onSubmit={submit}>
        <DialogTitle id="task-title">
          {task ? "Detalle de la tarea" : "Nueva tarea"}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Cada pequeño paso cuenta.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              inputProps={{ maxLength: 200 }}
              disabled={busy}
            />
            <TextField
              label="Descripción"
              multiline
              minRows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              placeholder="Añade contexto, detalles o próximos pasos…"
            />
            <TextField
              select
              label="Columna"
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              disabled={busy}
            >
              {columns.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.title}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !title.trim()}
          >
            {busy ? "Guardando…" : "Guardar tarea"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
