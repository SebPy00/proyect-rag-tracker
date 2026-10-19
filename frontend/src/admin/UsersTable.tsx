import { useContext, useState } from "react";
import {
  Avatar,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ManagedUser, deleteUser, updateUser } from "../api/usersApi";
import AuthContext from "../context/AuthContext";
import { useFeedback } from "../components/Feedback";
import ConfirmDialog from "../components/ConfirmDialog";
import UserActionsMenu from "./UserActionsMenu";
export default function UsersTable({
  users,
  onEdit,
  onChange,
}: {
  users: ManagedUser[];
  onEdit: (user: ManagedUser) => void;
  onChange: () => Promise<void>;
}) {
  const auth = useContext(AuthContext)!;
  const notify = useFeedback();
  const [target, setTarget] = useState<{
    user: ManagedUser;
    remove: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (!target) return;
    setBusy(true);
    try {
      if (target.remove) await deleteUser(target.user.id);
      else
        await updateUser(target.user.id, { is_active: !target.user.is_active });
      await onChange();
      setTarget(null);
      notify("Usuario actualizado");
    } catch {
      notify(
        "No pudimos completar el cambio. Revisa los permisos y la conexión.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Usuarios del workspace">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: "primary.light",
                        color: "primary.main",
                        fontSize: 14,
                      }}
                    >
                      {user.username[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {user.username}
                      {user.id === auth.user?.id ? " (tú)" : ""}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {user.is_superuser
                    ? "Superusuario"
                    : user.is_staff
                      ? "Administrador"
                      : "Miembro"}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={user.is_active ? "success" : "default"}
                    label={user.is_active ? "Activo" : "Inactivo"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <UserActionsMenu
                    user={user}
                    disabled={
                      busy ||
                      (!auth.user?.is_superuser &&
                        (user.is_staff || user.is_superuser))
                    }
                    onEdit={onEdit}
                    onDelete={(user) => setTarget({ user, remove: true })}
                    onToggleActive={(user) =>
                      setTarget({ user, remove: false })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {target && (
        <ConfirmDialog
          confirmLabel={
            target.remove
              ? "Eliminar"
              : target.user.is_active
                ? "Desactivar"
                : "Activar"
          }
          title={
            target.remove
              ? "Eliminar usuario"
              : target.user.is_active
                ? "Desactivar usuario"
                : "Activar usuario"
          }
          description={
            target.remove
              ? `Se eliminará “${target.user.username}” y todos sus proyectos y tareas. Esta acción es irreversible.`
              : `Se cambiará el acceso de “${target.user.username}” al workspace.`
          }
          busy={busy}
          onClose={() => setTarget(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
