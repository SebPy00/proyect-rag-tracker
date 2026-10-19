import { ReactNode, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { useTheme } from "@mui/material/styles";
import AuthContext from "../context/AuthContext";
import { useStoredBoolean } from "../hooks/useStoredBoolean";

export default function MainLayout({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext)!;
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);
  const [expanded, setExpanded] = useStoredBoolean(
    "tracker.sidebar-expanded",
    true,
  );
  const width = expanded ? 248 : 64;
  if (location.pathname === "/login") return <>{children}</>;

  function navigation(compact: boolean, mobile = false) {
    const links = [
      {
        to: "/",
        label: "Proyectos",
        icon: <DashboardRounded />,
        active: !location.pathname.startsWith("/admin"),
      },
      ...(auth.user?.is_staff
        ? [
            {
              to: "/admin/users",
              label: "Usuarios",
              icon: <GroupOutlined />,
              active: location.pathname.startsWith("/admin"),
            },
          ]
        : []),
    ];
    return (
      <Stack
        sx={{ height: "100%", p: compact ? 1 : 2.5, overflowX: "hidden" }}
        spacing={1}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            minHeight: 64,
            px: compact ? 0 : 1,
            py: 1,
            justifyContent: compact ? "center" : "flex-start",
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "primary.main",
              fontWeight: 800,
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
            }}
          >
            P
          </Avatar>
          {!compact && (
            <Box sx={{ whiteSpace: "nowrap" }}>
              <Typography fontWeight={800}>Project Tracker</Typography>
              <Typography variant="caption" color="text.secondary">
                Tu espacio de trabajo
              </Typography>
            </Box>
          )}
        </Stack>
        <Stack
          direction="row"
          justifyContent={compact ? "center" : "space-between"}
          alignItems="center"
          sx={{ minHeight: 36, mb: 1 }}
        >
          {!compact && (
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ px: 1 }}
            >
              Workspace
            </Typography>
          )}
          {!mobile && (
            <Tooltip
              title={expanded ? "Contraer navegación" : "Expandir navegación"}
              placement="right"
            >
              <IconButton
                size="small"
                aria-label={
                  expanded ? "Contraer navegación" : "Expandir navegación"
                }
                aria-expanded={expanded}
                aria-controls="desktop-navigation-links"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <ChevronLeftRounded /> : <ChevronRightRounded />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Stack
          id={mobile ? "mobile-navigation-links" : "desktop-navigation-links"}
          spacing={1}
        >
          {links.map((link) => (
            <Tooltip key={link.to} title={link.label} placement="right">
              <Button
                component={Link}
                to={link.to}
                aria-label={link.label}
                aria-current={link.active ? "page" : undefined}
                onClick={() => setOpen(false)}
                startIcon={compact ? undefined : link.icon}
                sx={{
                  minWidth: 0,
                  height: 40,
                  px: compact ? 0 : 1.5,
                  justifyContent: compact ? "center" : "flex-start",
                  bgcolor: link.active ? "primary.light" : undefined,
                }}
              >
                {compact ? link.icon : link.label}
              </Button>
            </Tooltip>
          ))}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Divider />
        {auth.user && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={compact ? 0 : 1}
            sx={{ pt: 2, justifyContent: compact ? "center" : undefined }}
          >
            {!compact && (
              <>
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
              </>
            )}
            <Tooltip title="Cerrar sesión" placement="right">
              <IconButton aria-label="Cerrar sesión" onClick={auth.logoutUser}>
                <LogoutRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>
    );
  }
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
          width,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "white",
          position: "fixed",
          height: "100vh",
          transition: (theme) =>
            theme.transitions.create("width", { duration: 220 }),
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      >
        {navigation(!expanded)}
      </Box>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { md: "none" } }}
        slotProps={{ paper: { sx: { width: 270 } } }}
      >
        {navigation(false, true)}
      </Drawer>
      <Box
        component="main"
        id="main-content"
        sx={{
          ml: { md: `${width}px` },
          p: { xs: 2, md: 4 },
          width: { xs: "100%", md: `calc(100% - ${width}px)` },
          minWidth: 0,
          transition: (theme) =>
            theme.transitions.create(["margin-left", "width"], {
              duration: 220,
            }),
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      >
        <IconButton
          aria-label="Abrir navegación"
          aria-expanded={open}
          aria-controls={open ? "mobile-navigation-links" : undefined}
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
