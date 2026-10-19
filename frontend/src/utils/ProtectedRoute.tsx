import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import AuthContext from "../context/AuthContext";
export default function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const auth = useContext(AuthContext)!;
  if (auth.loading)
    return (
      <Box role="status" sx={{ p: 8, textAlign: "center" }}>
        <CircularProgress aria-label="Verificando sesión" />
      </Box>
    );
  if (auth.error)
    return (
      <Alert
        severity="error"
        action={<Button onClick={auth.retrySession}>Reintentar</Button>}
      >
        {auth.error}
      </Alert>
    );
  if (!auth.user) return <Navigate to="/login" replace />;
  if (admin && !auth.user.is_staff) return <Navigate to="/" replace />;
  return <Outlet />;
}
