// src/admin/UserFormModal.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import { createUser, updateUser } from "../api/usersApi";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user: any | null;
  refresh: () => void;
}

export default function UserFormModal({
  open,
  onClose,
  user,
  refresh,
}: UserFormModalProps) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    setForm({
      username: user?.username || "",
      password: "",
    });
  }, [user]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (user) await updateUser(user.id, form);
    else await createUser(form);

    refresh();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {user ? "Editar Usuario" : "Crear Usuario"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Usuario"
          name="username"
          value={form.username}
          onChange={handleChange}
          fullWidth
        />

        {!user && (
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
