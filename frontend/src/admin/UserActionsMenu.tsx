import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import { useState } from "react";
import { ManagedUser } from "../api/usersApi";
export default function UserActionsMenu({
  user,
  disabled,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  user: ManagedUser;
  disabled: boolean;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onToggleActive: (user: ManagedUser) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const action = (callback: (user: ManagedUser) => void) => {
    setAnchor(null);
    callback(user);
  };
  return (
    <>
      <IconButton
        disabled={disabled}
        aria-label={`Acciones de ${user.username}`}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreHorizRounded />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => action(onEdit)}>Editar</MenuItem>
        <MenuItem onClick={() => action(onToggleActive)}>
          {user.is_active ? "Desactivar acceso" : "Activar acceso"}
        </MenuItem>
        <MenuItem sx={{ color: "error.main" }} onClick={() => action(onDelete)}>
          Eliminar usuario
        </MenuItem>
      </Menu>
    </>
  );
}
