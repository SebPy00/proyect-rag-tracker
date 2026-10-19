import {
  Box,
  ButtonBase,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SubjectRounded from "@mui/icons-material/SubjectRounded";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./types";
export default function TaskCard({
  task,
  disabled,
  onOpen,
  onDelete,
}: {
  task: Task;
  disabled: boolean;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.column },
    disabled,
  });
  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        mb: 1.5,
        opacity: isDragging ? 0.35 : 1,
        borderColor: isOver ? "primary.main" : "divider",
        boxShadow: "0 2px 4px #17233b05",
        "&:hover": { borderColor: "#b9b4f8" },
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ px: 1, pt: 0.5 }}>
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          aria-label={`Mover tarea ${task.title}`}
          disabled={disabled}
          sx={{ touchAction: "none", cursor: "grab" }}
        >
          <DragIndicatorRounded fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          TAREA · {task.id.slice(0, 4).toUpperCase()}
        </Typography>
        <IconButton
          size="small"
          aria-label={`Eliminar tarea ${task.title}`}
          disabled={disabled}
          onClick={() => onDelete(task)}
        >
          <DeleteOutlineRounded fontSize="small" />
        </IconButton>
      </Stack>
      <ButtonBase
        onClick={() => onOpen(task)}
        disabled={disabled}
        sx={{
          display: "block",
          textAlign: "left",
          width: "100%",
          px: 2,
          pb: 2,
          pt: 0.5,
          borderRadius: 2,
        }}
      >
        <Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
          {task.title}
        </Typography>
        {task.description && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            >
              {task.description}
            </Typography>
            <SubjectRounded
              sx={{ fontSize: 16, mt: 1, color: "text.secondary" }}
            />
          </Box>
        )}
      </ButtonBase>
    </Paper>
  );
}
