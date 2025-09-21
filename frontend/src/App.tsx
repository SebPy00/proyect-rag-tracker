import React, { useState, useEffect, useCallback, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import axios from './api/axiosInstance';
import ProjectBoard from './ProjectBoard';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './utils/ProtectedRoute';
import AuthContext from './context/AuthContext';
import { Container, Typography, List, ListItem, ListItemText, TextField, Button, Box, ListItemButton, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// Interfaz para la lista simple de Proyectos
interface Project {
  id: string;
  name: string;
}

// Componente para la página principal (la lista de proyectos)
function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null); // Estado para el diálogo
  
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext no se encontró");
  const { user, logoutUser } = authContext;

  const fetchProjects = useCallback(() => {
    axios.get('/api/projects/')
      .then(response => { setProjects(response.data); })
      .catch(error => { console.error('Hubo un error al obtener los proyectos!', error); });
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreateProject = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    axios.post('/api/projects/', { name: newProjectName })
      .then(() => {
        setNewProjectName('');
        fetchProjects();
      })
      .catch(error => console.error('Error al crear el proyecto:', error));
  };

  // --- LÓGICA PARA ELIMINAR PROYECTOS ---
  const handleOpenConfirmDialog = (project: Project) => {
    setProjectToDelete(project);
  };
  const handleCloseConfirmDialog = () => {
    setProjectToDelete(null);
  };
  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    axios.delete(`/api/projects/${projectToDelete.id}/`)
      .then(() => {
        fetchProjects();
        handleCloseConfirmDialog();
      })
      .catch(error => console.error('Error al eliminar el proyecto:', error));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>SEBTRELLO</Typography>
        <Button variant="outlined" onClick={logoutUser}>Cerrar Sesión</Button>
      </Box>
      <Typography variant="h5" component="h2" gutterBottom>Proyectos de {user?.username}</Typography>
      <Box component="form" onSubmit={handleCreateProject} sx={{ display: 'flex', gap: 1, mb: 4 }}>
        <TextField label="Nombre del Nuevo Proyecto" variant="outlined" size="small" fullWidth value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
        <Button type="submit" variant="contained">Crear</Button>
      </Box>

      <List>
        {projects.map(project => (
          <ListItem
            key={project.id}
            disablePadding
            // secondaryAction se usa para poner un elemento al final de la fila
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleOpenConfirmDialog(project)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton component={RouterLink} to={`/project/${project.id}`}>
              <ListItemText primary={project.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* --- DIÁLOGO DE CONFIRMACIÓN --- */}
      {projectToDelete && (
        <Dialog open={true} onClose={handleCloseConfirmDialog}>
          <DialogTitle>¿Confirmar eliminación?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de que quieres eliminar el proyecto "{projectToDelete.name}"? Todas sus columnas y tareas serán eliminadas permanentemente.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} autoFocus color="warning">Eliminar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

// --- Componente App (Router principal) ---
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:projectId" element={<ProjectBoard />} />
          </Route>
        </Routes>
      </header>
    </div>
  );
}

export default App;