// src/admin/UserActionsMenu.tsx

import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState } from "react";

interface Props {
  user: any;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  onToggleActive: (user: any) => void;
}

export default function UserActionsMenu({
  user,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            onEdit(user);
            setAnchorEl(null);
          }}
        >
          Editar
        </MenuItem>

        <MenuItem
          onClick={() => {
            onToggleActive(user);
            setAnchorEl(null);
          }}
        >
          {user.is_active ? "Desactivar" : "Activar"}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onDelete(user);
            setAnchorEl(null);
          }}
        >
          Eliminar
        </MenuItem>
      </Menu>
    </>
  );
}
