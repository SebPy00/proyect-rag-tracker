import { ReactNode, useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import AuthContext from "../context/AuthContext";
export default function MainLayout({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext)!;
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (location.pathname === "/login") return <>{children}</>;
  const navigation = (
    <Stack sx={{ height: "100%", p: 2.5 }} spacing={1}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 4, px: 1, py: 1 }}
      >
        <Avatar
          variant="rounded"
          sx={{ bgcolor: "primary.main", fontWeight: 800 }}
        >
          P
        </Avatar>
        <Box>
          <Typography fontWeight={800}>Project Tracker</Typography>
          <Typography variant="caption" color="text.secondary">
            Tu espacio de trabajo
          </Typography>
        </Box>
      </Stack>
      <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
        Workspace
      </Typography>
      <Button
        component={Link}
        to="/"
        onClick={() => setOpen(false)}
        startIcon={<DashboardRounded />}
        sx={{
          justifyContent: "flex-start",
          bgcolor: !location.pathname.startsWith("/admin")
            ? "primary.light"
            : undefined,
        }}
      >
        Proyectos
      </Button>
      {auth.user?.is_staff && (
        <Button
          component={Link}
          to="/admin/users"
          onClick={() => setOpen(false)}
          startIcon={<GroupOutlined />}
          sx={{
            justifyContent: "flex-start",
            bgcolor: location.pathname.startsWith("/admin")
              ? "primary.light"
              : undefined,
          }}
        >
          Usuarios
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
      <Divider />
      {auth.user && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 2 }}>
          <Avatar
            sx={{
              bgcolor: "#e0e7ff",
              color: "primary.dark",
              width: 34,
              height: 34,
            }}
          >
            {auth.user.username[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap variant="body2" fontWeight={700}>
              {auth.user.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {auth.user.is_staff ? "Administrador" : "Miembro"}
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar sesión" onClick={auth.logoutUser}>
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: -9999,
          "&:focus": { left: 8, top: 8, zIndex: 1500, bgcolor: "white", p: 2 },
        }}
      >
        Saltar al contenido
      </Box>
      <Box
        component="nav"
        aria-label="Navegación principal"
        sx={{
          display: { xs: "none", md: "block" },
          width: 248,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "white",
          position: "fixed",
          height: "100vh",
        }}
      >
        {navigation}
      </Box>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 270 } } }}
      >
        {navigation}
      </Drawer>
      <Box
        component="main"
        id="main-content"
        sx={{
          ml: { md: "248px" },
          p: { xs: 2, md: 4 },
          width: { xs: "100%", md: "calc(100% - 248px)" },
          minWidth: 0,
        }}
      >
        <IconButton
          aria-label="Abrir navegación"
          onClick={() => setOpen(true)}
          sx={{ display: { md: "none" }, mb: 1 }}
        >
          <MenuRounded />
        </IconButton>
        {children}
      </Box>
    </Box>
  );
}
