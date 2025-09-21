import React, { useState, useEffect } from 'react';
import { Box, Button, Modal, TextField, Typography } from '@mui/material';

// Reutilizamos la interfaz 'Task' que ya tenemos en ProjectBoard
// (En un proyecto más grande, moveríamos esto a un archivo de tipos compartido)
interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

// Definimos qué 'props' recibirá nuestro componente modal
interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: { title: string; description: string | null }) => void;
}

// Estilos para la caja del modal (para centrarlo y darle apariencia)
const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function TaskDetailModal({ task, onClose, onSave }: TaskDetailModalProps) {
  // Estados internos para manejar los cambios en el formulario
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');

  // Sincroniza el estado si la tarea seleccionada cambia
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
  }, [task]);

  const handleSave = () => {
    onSave({
      title: editedTitle,
      description: editedDescription,
    });
  };

  return (
    <Modal
      open={true} // El modal es visible si se renderiza
      onClose={onClose} // Función que se llama al hacer clic fuera del modal
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Editar Tarea
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Título de la Tarea"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label="Descripción"
          multiline
          rows={4}
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" sx={{ ml: 1 }}>
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default TaskDetailModal;