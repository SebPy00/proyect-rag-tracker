// src/admin/UsersTable.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Paper,
} from "@mui/material";

import UserActionsMenu from "./UserActionsMenu";
import { deleteUser, updateUser } from "../api/usersApi";

interface User {
  id: number;
  username: string;
  is_active: boolean;
}

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onChange: () => void;
}

export default function UsersTable({ users, onEdit, onChange }: Props) {
  const handleDelete = async (user: User) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;

    await deleteUser(user.id);
    onChange();
  };

  const handleToggleActive = async (user: User) => {
    await updateUser(user.id, { is_active: !user.is_active });
    onChange();
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>
                <Switch
                  checked={u.is_active}
                  onChange={() => handleToggleActive(u)}
                />
              </TableCell>

              <TableCell align="right">
                <UserActionsMenu
                  user={u}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
