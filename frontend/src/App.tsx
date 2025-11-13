import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import axios from './api/axiosInstance';
import ProjectBoard from './ProjectBoard';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './utils/ProtectedRoute';
import AuthContext from './context/AuthContext';
import {
  Typography, List, ListItem, ListItemText,
  TextField, Button, Box, ListItemButton,
  IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MainLayout from "./layout/MainLayout";

// Interfaz para la lista simple de Proyectos
interface Project {
  id: string;
  name: string;
}

// Componente para la página principal (la lista de proyectos)
function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { user, logoutUser } = useContext(AuthContext)!;

  const fetchProjects = useCallback(() => {
    axios.get('/api/projects/')
      .then((r) => setProjects(r.data))
      .catch(() => console.error("Error al obtener proyectos"));
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    axios.post('/api/projects/', { name: newProjectName })
      .then(() => {
        setNewProjectName('');
        fetchProjects();
      });
  };

  return (
    <Box>
      {/* HEADER DE PÁGINA */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Proyectos de {user?.username}
        </Typography>
        <Button variant="contained" color="secondary" onClick={logoutUser}>
          Cerrar sesión
        </Button>
      </Box>

      {/* FORM DE NUEVO PROYECTO */}
      <Box
        component="form"
        onSubmit={handleCreateProject}
        sx={{ display: "flex", gap: 2, mb: 4 }}
      >
        <TextField
          label="Nuevo proyecto"
          variant="outlined"
          fullWidth
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />

        <Button variant="contained" color="primary" type="submit">
          Crear
        </Button>
      </Box>

      {/* LISTA DE PROYECTOS */}
      <List sx={{ bgcolor: "background.paper", borderRadius: 3, p: 2 }}>
        {projects.map((project) => (
          <ListItem
            key={project.id}
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                color="error"
                onClick={() => setProjectToDelete(project)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton
              component={RouterLink}
              to={`/project/${project.id}`}
              sx={{
                borderRadius: 2,
                "&:hover": { bgcolor: "secondary.light" },
              }}
            >
              <ListItemText primary={project.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <Dialog open={!!projectToDelete} onClose={() => setProjectToDelete(null)}>
        <DialogTitle>Eliminar proyecto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que quieres eliminar "{projectToDelete?.name}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectToDelete(null)}>Cancelar</Button>
          <Button color="error" onClick={() => {
              if (projectToDelete) {
                axios.delete(`/api/projects/${projectToDelete.id}/`)
                  .then(fetchProjects);
              }
              setProjectToDelete(null);
          }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Componente App (Router principal) ---
function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<ProjectBoard />} />
        </Route>
      </Routes>
    </MainLayout>
  );
}

export default App;