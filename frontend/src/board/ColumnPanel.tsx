import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column, Task } from "./types";
import TaskCard from "./TaskCard";
export default function ColumnPanel({
  column,
  busy,
  onOpen,
  onDeleteTask,
  onAdd,
  onRename,
  onDelete,
}: {
  column: Column;
  busy: boolean;
  onOpen: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAdd: (column: Column) => void;
  onRename: (column: Column) => void;
  onDelete: (column: Column) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: column.id, data: { type: "column" }, disabled: busy });
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        flex: "0 0 300px",
        width: 300,
        p: 1.5,
        bgcolor: isOver ? "primary.light" : "#eef1f7",
        border: "1px solid",
        borderColor: isOver ? "#c7d2fe" : "transparent",
        borderRadius: 3,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          disabled={busy}
          aria-label={`Mover columna ${column.title}`}
          sx={{ touchAction: "none", cursor: "grab" }}
        >
          <DragIndicatorRounded fontSize="small" />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ flex: 1, overflowWrap: "anywhere", minWidth: 0 }}
        >
          {column.title}
        </Typography>
        <Chip
          size="small"
          label={column.tasks.length}
          sx={{ height: 23, bgcolor: "white" }}
        />
        <IconButton
          size="small"
          aria-label={`Renombrar columna ${column.title}`}
          disabled={busy}
          onClick={() => onRename(column)}
        >
          <EditOutlined sx={{ fontSize: 17 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label={`Eliminar columna ${column.title}`}
          disabled={busy}
          onClick={() => onDelete(column)}
        >
          <DeleteOutlineRounded sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>
      <Box sx={{ minHeight: 100 }}>
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              disabled={busy}
              onOpen={onOpen}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        {!column.tasks.length && (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Arrastra una tarea aquí o crea la primera.
            </Typography>
          </Box>
        )}
      </Box>
      <Button
        fullWidth
        startIcon={<AddRounded />}
        onClick={() => onAdd(column)}
        disabled={busy}
        sx={{ justifyContent: "flex-start" }}
      >
        Añadir tarea
      </Button>
    </Box>
  );
}
