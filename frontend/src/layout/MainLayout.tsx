import { Box, AppBar, Toolbar, Typography } from "@mui/material";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "primary.main",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Seguimiento de Proyectos
          </Typography>
          {auth?.user && (
            <Typography variant="body1">
              Hola, <strong>{auth.user.username}</strong>
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          py: 3,
          px: 2,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
