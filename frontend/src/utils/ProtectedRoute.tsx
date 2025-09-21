import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function ProtectedRoute() {
  const authContext = useContext(AuthContext);

  if (!authContext) return null; // O un spinner de carga

  const { user } = authContext;

  // Si no hay usuario, redirige a la página de login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si hay un usuario, muestra el contenido de la ruta (la página protegida)
  return <Outlet />;
}

export default ProtectedRoute;