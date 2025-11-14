import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import UsersTable from "./UsersTable";
import UserFormModal from "./UserFormModal";
import { getUsers } from "../api/usersApi";
import { Link as RouterLink } from "react-router-dom";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setOpenModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setOpenModal(true);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center"
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Administración de Usuarios
        </Typography>

        <Button
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/"
          sx={{ borderRadius: 2 }}
        >
          ← Volver a Tableros
        </Button>
      </Box>

      <Button
        variant="contained"
        onClick={handleCreate}
        sx={{ mb: 2, borderRadius: 2 }}
      >
        Crear Usuario
      </Button>

      <UsersTable users={users} onEdit={handleEdit} onChange={loadUsers} />

      <UserFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        user={editingUser}
        refresh={loadUsers}
      />
    </Box>
  );
}
