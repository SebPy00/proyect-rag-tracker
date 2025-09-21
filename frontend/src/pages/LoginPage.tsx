import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';

function LoginPage() {
  // Usamos 'useContext' para acceder a la información de nuestro AuthContext
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { loginUser } = authContext;

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>
        {/* El evento onSubmit del formulario llama directamente a la función loginUser del contexto */}
        <Box component="form" onSubmit={loginUser} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nombre de Usuario"
            name="username"
            autoComplete="username"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Entrar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;