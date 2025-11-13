import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "./api/axiosInstance";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskDetailModal from "./TaskDetailModal";
import {
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Paper,
  TextField,
  Typography,
  Modal,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// --- Interfaces ---
interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  column: string;
}
interface Column {
  id: string;
  title: string;
  tasks: Task[];
}
interface Project {
  id: string;
  name: string;
  columns: Column[];
}
interface Message {
  sender: "user" | "ai";
  text: string;
  created_at: string;
}

// --- Componente TaskCard ---
function TaskCard({
  task,
  isOver,
  onCardClick,
  onDeleteClick,
}: {
  task: Task;
  isOver: boolean;
  onCardClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "Task", task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    marginBottom: "8px",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Paper
        elevation={isDragging ? 8 : 2}
        onClick={() => onCardClick(task)}
        sx={{
          p: 2,
          "&:hover": { backgroundColor: "#f9f9f9" },
          cursor: "pointer",
          position: "relative",
          borderTop: isOver ? "3px solid #1976d2" : "none",
          marginTop: isOver ? "-3px" : "0",
        }}
      >
        <Typography variant="body1" sx={{ paddingRight: "30px" }}>
          {task.title}
        </Typography>
        {task.description && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {task.description}
          </Typography>
        )}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(task);
          }}
          sx={{ position: "absolute", top: 4, right: 4, padding: "4px" }}
          aria-label="delete task"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Paper>
    </div>
  );
}

// --- Componente ColumnContainer ---
function ColumnContainer({
  column,
  isOver,
  overTaskId,
  onCardClick,
  onDeleteClick,
  onOpenAddTaskModal,
  onUpdateColumnTitle,
  onDeleteColumn,
}: {
  column: Column;
  isOver: boolean;
  overTaskId: string | null;
  onCardClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  onOpenAddTaskModal: (columnId: string) => void;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id, data: { type: "Column" } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);

  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      onUpdateColumnTitle(column.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleTitleBlur();
    else if (event.key === "Escape") {
      setEditedTitle(column.title);
      setIsEditing(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Paper
          elevation={3}
          sx={{
            width: 300,
            minWidth: 300,
            backgroundColor: isOver ? "#e3f2fd" : "#f0f2f5",
            borderRadius: 2,
            boxShadow: 3,
        
            /* 🔥 Fix definitivo */
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              pb: 1,
              flexShrink: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {isEditing ? (
              <TextField
                autoFocus
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                variant="standard"
                fullWidth
              />
            ) : (
              <Typography
                variant="h6"
                sx={{ cursor: "pointer", flexGrow: 1 }}
                onClick={() => setIsEditing(true)}
                {...listeners}
              >
                {column.title}
              </Typography>
            )}
            <IconButton size="small" onClick={() => onDeleteColumn(column.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        
          {/* Lista de tareas scrollable */}
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 0,      // 👈 evita que empuje al botón
              overflowY: "auto",
              p: 2,
              pt: 0,
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: 3,
              },
            }}
          >
            <SortableContext items={column.tasks.map((t: Task) => t.id)}>
              {column.tasks.map((task: Task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isOver={overTaskId === task.id}
                  onCardClick={onCardClick}
                  onDeleteClick={onDeleteClick}
                />
              ))}
            </SortableContext>
          </Box>
          
          {/* Botón fijo al fondo */}
          <Box sx={{ p: 2, pt: 1, flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onOpenAddTaskModal(column.id)}
              sx={{ width: "100%" }}
            >
              Añadir Tarea
            </Button>
          </Box>
        </Paper>
    </div>
  );
}

// --- Componente AddColumn ---
function AddColumn({ onAddColumn }: { onAddColumn: (title: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (title.trim()) {
      onAddColumn(title.trim());
      setTitle("");
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <Button
        variant="outlined"
        onClick={() => setIsEditing(true)}
        sx={{ minWidth: 300, width: 300, height: "fit-content" }}
      >
        + Añadir otra lista
      </Button>
    );
  }

  return (
    <Paper sx={{ p: 1, width: 300, minWidth: 300 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          autoFocus
          label="Título de la lista"
          variant="outlined"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Box sx={{ mt: 1 }}>
          <Button type="submit" variant="contained">
            Añadir
          </Button>
          <IconButton
            onClick={() => setIsEditing(false)}
            size="small"
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

// --- ChatBox ---
function ChatBox({
  messages,
  question,
  setQuestion,
  onAsk,
  isLoading,
}: {
  messages: Message[];
  question: string;
  setQuestion: (q: string) => void;
  onAsk: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 400,
        minWidth: 400,
        height: "100%", // ocupar todo el alto del grid
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography variant="h6" sx={{ p: 2, borderBottom: "1px solid #ddd" }}>
        Pregúntale a tu Proyecto
      </Typography>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          pr: 1,
          "&::-webkit-scrollbar": { width: 6 },
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                display: "inline-block",
                maxWidth: "80%",
                backgroundColor:
                  msg.sender === "user" ? "#1976d2" : "#e0e0e0",
                color: msg.sender === "user" ? "white" : "black",
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {msg.text}
              </Typography>
            </Paper>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, px: 0.5, color: "text.secondary" }}
            >
              {formatMessageTime(msg.created_at)}
            </Typography>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ textAlign: "left" }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={onAsk}
        sx={{
          p: 2,
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          label="Escribe tu pregunta..."
          variant="outlined"
          size="small"
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          endIcon={<SendIcon />}
        >
          Enviar
        </Button>
      </Box>
    </Paper>
  );
}

// --- Componente Principal del Tablero ---
function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [ragQuestion, setRagQuestion] = useState("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  const fetchProjectData = useCallback(() => {
    if (projectId) {
      const projectUrl = `${process.env.REACT_APP_API_URL}/api/projects/${projectId}/`;
      const historyUrl = `${process.env.REACT_APP_API_URL}/api/projects/${projectId}/history/`;

      axios
        .get<Project>(projectUrl)
        .then((response) => {
          const projectData = response.data;
          const sortedColumns = projectData.columns.map((col: Column) => ({
            ...col,
            tasks: col.tasks.sort((a: Task, b: Task) => a.order - b.order),
          }));
          const sortedProject = { ...projectData, columns: sortedColumns };
          setProject(sortedProject);
        })
        .catch((error) =>
          console.error("Hubo un error al obtener el proyecto!", error)
        );

      axios
        .get<Message[]>(historyUrl)
        .then((response) => {
          setMessages(response.data);
        })
        .catch((error) =>
          console.error("Hubo un error al obtener el historial del chat!", error)
        );
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleOpenModal = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  const handleUpdateTask = (updatedData: {
    title: string;
    description: string | null;
  }) => {
    if (!selectedTask) return;

    axios
      .patch(
        `${process.env.REACT_APP_API_URL}/api/tasks/${selectedTask.id}/`,
        updatedData
      )
      .then(() => {
        handleCloseModal();
        fetchProjectData();
      })
      .catch((error) => console.error("Error al actualizar la tarea:", error));
  };

  const handleOpenConfirmDialog = (task: Task) => setTaskToDelete(task);
  const handleCloseConfirmDialog = () => setTaskToDelete(null);

  const handleConfirmDelete = () => {
    if (!taskToDelete) return;

    axios
      .delete(
        `${process.env.REACT_APP_API_URL}/api/tasks/${taskToDelete.id}/`
      )
      .then(() => {
        fetchProjectData();
        handleCloseConfirmDialog();
      })
      .catch((error) => console.error("Error al eliminar la tarea:", error));
  };

  const handleOpenAddTaskModal = (columnId: string) => {
    setTargetColumnId(columnId);
    setAddTaskModalOpen(true);
  };

  const handleCloseAddTaskModal = () => {
    setAddTaskModalOpen(false);
    setTargetColumnId(null);
    setNewTaskTitle("");
    setNewTaskDescription("");
  };

  const handleAddTask = () => {
    if (!targetColumnId || !newTaskTitle.trim()) return;

    const column = project?.columns.find((c) => c.id === targetColumnId);
    if (!column) return;

    axios
      .post(`${process.env.REACT_APP_API_URL}/api/tasks/`, {
        title: newTaskTitle,
        description: newTaskDescription,
        column: targetColumnId,
        order: column.tasks.length + 1,
      })
      .then(() => {
        fetchProjectData();
        handleCloseAddTaskModal();
      });
  };

  const handleUpdateColumnTitle = (columnId: string, newTitle: string) => {
    axios
      .patch(`${process.env.REACT_APP_API_URL}/api/columns/${columnId}/`, {
        title: newTitle,
      })
      .then(() => fetchProjectData())
      .catch((error) =>
        console.error("Error al actualizar la columna:", error)
      );
  };

  const handleCreateColumn = (title: string) => {
    if (!project) return;

    axios
      .post(`${process.env.REACT_APP_API_URL}/api/columns/`, {
        title: title,
        project: projectId,
        order: project.columns.length + 1,
      })
      .then(() => fetchProjectData());
  };

  const handleOpenDeleteColumnDialog = (columnId: string) => {
    const column = project?.columns.find((c) => c.id === columnId);
    if (column) setColumnToDelete(column);
  };

  const handleCloseDeleteColumnDialog = () => setColumnToDelete(null);

  const handleConfirmColumnDelete = () => {
    if (!columnToDelete) return;

    axios
      .delete(
        `${process.env.REACT_APP_API_URL}/api/columns/${columnToDelete.id}/`
      )
      .then(() => {
        fetchProjectData();
        handleCloseDeleteColumnDialog();
      });
  };

  const handleAskQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ragQuestion.trim() || !projectId) return;

    setIsLoadingAnswer(true);
    const currentQuestion = ragQuestion;
    setRagQuestion("");

    axios
      .post(`/api/projects/${projectId}/ask/`, { question: currentQuestion })
      .then(() => {
        fetchProjectData();
      })
      .catch((error) => {
        const errorMessage: Message = {
          sender: "ai",
          text: "Hubo un error al procesar la pregunta.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error("Error al preguntar a la IA:", error);
      })
      .finally(() => {
        setIsLoadingAnswer(false);
      });
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "Column" && project) {
      setActiveColumn(
        project.columns.find((c) => c.id === active.id) || null
      );
    }

    if (type === "Task" && project) {
      for (const column of project.columns) {
        const task = column.tasks.find((t) => t.id === active.id);
        if (task) {
          setActiveTask(task);
          return;
        }
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over || !project) {
      setOverTaskId(null);
      setOverColumnId(null);
      return;
    }

    const overId = over.id as string;
    const isOverTask = over.data.current?.type === "Task";

    const colId: string | null =
      over.data.current?.type === "Column"
        ? overId
        : project.columns.find((col) =>
            col.tasks.some((t) => t.id === overId)
          )?.id || null;

    setOverColumnId(colId);
    setOverTaskId(isOverTask ? overId : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setOverTaskId(null);
    setOverColumnId(null);
    setActiveTask(null);
    setActiveColumn(null);

    const { active, over } = event;
    if (!project || !over || active.id === over.id) return;

    // Reordenar columnas
    if (active.data.current?.type === "Column") {
      const oldIndex = project.columns.findIndex((c) => c.id === active.id);
      const newIndex = project.columns.findIndex((c) => c.id === over.id);
      const reorderedColumns = arrayMove(project.columns, oldIndex, newIndex);

      setProject({ ...project, columns: reorderedColumns });

      reorderedColumns.forEach((col, index) => {
        axios.patch(
          `${process.env.REACT_APP_API_URL}/api/columns/${col.id}/`,
          {
            order: index + 1,
          }
        );
      });
      return;
    }

    // Reordenar / mover tareas
    if (active.data.current?.type === "Task") {
      const sourceColumn = project.columns.find((col) =>
        col.tasks.some((task) => task.id === active.id)
      );
      const overId = over.id as string;
      const overContainer =
        over.data.current?.type === "Column"
          ? project.columns.find((c) => c.id === overId)
          : project.columns.find((col) =>
              col.tasks.some((task) => task.id === overId)
            );

      if (!sourceColumn || !overContainer) return;

      const taskToMove = active.data.current.task as Task;

      // Movimiento entre columnas
      if (sourceColumn.id !== overContainer.id) {
        setProject((prev) => {
          if (!prev) return null;

          const sourceTasks = sourceColumn.tasks.filter(
            (t) => t.id !== active.id
          );
          const destTasks = [...overContainer.tasks, taskToMove];

          return {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === sourceColumn.id)
                return { ...col, tasks: sourceTasks };
              if (col.id === overContainer.id)
                return { ...col, tasks: destTasks };
              return col;
            }),
          };
        });

        axios
          .patch(`${process.env.REACT_APP_API_URL}/api/tasks/${active.id}/`, {
            column: overContainer.id,
          })
          .then(() => fetchProjectData());
      } else {
        // Reorden dentro de la misma columna
        const oldIndex = sourceColumn.tasks.findIndex(
          (t) => t.id === active.id
        );
        const newIndex = sourceColumn.tasks.findIndex(
          (t) => t.id === over.id
        );
        const reorderedTasks = arrayMove(
          sourceColumn.tasks,
          oldIndex,
          newIndex
        );

        setProject((prev) =>
          prev
            ? {
                ...prev,
                columns: prev.columns.map((c) =>
                  c.id === sourceColumn.id
                    ? { ...c, tasks: reorderedTasks }
                    : c
                ),
              }
            : null
        );

        reorderedTasks.forEach((task, index) => {
          axios.patch(
            `${process.env.REACT_APP_API_URL}/api/tasks/${task.id}/`,
            { order: index + 1 }
          );
        });
      }
    }
  }

  if (!project) return <div>Cargando...</div>;

  return (
    <Box
      sx={{
        // Altura exacta descontando el AppBar (64px desktop)
        height: "calc(100vh - 64px)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* HEADER DEL TABLERO */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: "1px solid #ddd",
          background: "white",
        }}
      >
        <Typography variant="h4">Tablero: {project.name}</Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Volver
        </Button>
      </Box>

      {/* GRID PRINCIPAL: COLUMNAS + CHAT */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          overflow: "hidden",
          gap: 2,
          width: "100%",
          pr: 2,
          py: 1,
        }}
      >
        {/* COLUMNA DE LISTAS (SCROLL HORIZONTAL) */}
        <Box sx={{ overflow: "hidden", minWidth: 0 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                height: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                px: 2,
                "&::-webkit-scrollbar": { height: 10 },
              }}
            >
              <SortableContext
                items={project.columns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {project.columns.map((column) => (
                  <ColumnContainer
                    key={column.id}
                    column={column}
                    isOver={overColumnId === column.id}
                    overTaskId={overTaskId}
                    onCardClick={handleOpenModal}
                    onDeleteClick={handleOpenConfirmDialog}
                    onOpenAddTaskModal={handleOpenAddTaskModal}
                    onUpdateColumnTitle={handleUpdateColumnTitle}
                    onDeleteColumn={handleOpenDeleteColumnDialog}
                  />
                ))}
              </SortableContext>

              {/* Añadir columna */}
              <AddColumn onAddColumn={handleCreateColumn} />
            </Box>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  isOver={false}
                  onCardClick={() => {}}
                  onDeleteClick={() => {}}
                />
              )}

              {activeColumn && (
                <ColumnContainer
                  column={activeColumn}
                  isOver={false}
                  overTaskId={null}
                  onCardClick={() => {}}
                  onDeleteClick={() => {}}
                  onOpenAddTaskModal={() => {}}
                  onUpdateColumnTitle={() => {}}
                  onDeleteColumn={() => {}}
                />
              )}
            </DragOverlay>
          </DndContext>
        </Box>

        {/* CHAT FIJO A LA DERECHA */}
        <ChatBox
          messages={messages}
          question={ragQuestion}
          setQuestion={setRagQuestion}
          onAsk={handleAskQuestion}
          isLoading={isLoadingAnswer}
        />
      </Box>

      {/* MODALES / DIÁLOGOS */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSave={handleUpdateTask}
        />
      )}

      {taskToDelete && (
        <Dialog open onClose={handleCloseConfirmDialog}>
          <DialogTitle>¿Confirmar eliminación?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que quieres eliminar la tarea "
              {taskToDelete.title}"? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} autoFocus color="warning">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {columnToDelete && (
        <Dialog open onClose={handleCloseDeleteColumnDialog}>
          <DialogTitle>¿Confirmar eliminación de columna?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que quieres eliminar la columna "
              {columnToDelete.title}"? Todas las tareas dentro de ella también
              serán eliminadas. Esta acción es irreversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteColumnDialog}>Cancelar</Button>
            <Button
              onClick={handleConfirmColumnDelete}
              autoFocus
              color="warning"
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {addTaskModalOpen && (
        <Modal open={addTaskModalOpen} onClose={handleCloseAddTaskModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2">
              Añadir Nueva Tarea
            </Typography>
            <TextField
              autoFocus
              margin="normal"
              label="Título de la Tarea"
              fullWidth
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <TextField
              margin="normal"
              label="Descripción (opcional)"
              fullWidth
              multiline
              rows={4}
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
            />
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={handleCloseAddTaskModal}>Cancelar</Button>
              <Button
                onClick={handleAddTask}
                variant="contained"
                sx={{ ml: 1 }}
              >
                Guardar Tarea
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}

export default ProjectBoard;
