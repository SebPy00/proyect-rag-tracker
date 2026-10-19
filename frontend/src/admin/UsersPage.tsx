import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import UsersTable from "./UsersTable";
import UserFormModal from "./UserFormModal";
import { getUsers, ManagedUser } from "../api/usersApi";
export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [dialog, setDialog] = useState<{ user: ManagedUser | null } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setUsers(await getUsers());
    setError("");
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await load();
    } catch {
      setError("No pudimos cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            Workspace / Administración
          </Typography>
          <Typography variant="h4" component="h1">
            Personas y acceso
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Gestiona quién puede acceder a este espacio de trabajo.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => setDialog({ user: null })}
          sx={{ alignSelf: "flex-start", mt: { sm: 3 } }}
        >
          Crear usuario
        </Button>
      </Stack>
      <TextField
        label="Buscar usuarios"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {error && (
        <Alert
          severity="error"
          action={<Button onClick={reload}>Reintentar</Button>}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      {loading ? (
        <Skeleton variant="rounded" height={260} />
      ) : (
        <UsersTable
          users={filtered}
          onEdit={(user) => setDialog({ user })}
          onChange={load}
        />
      )}
      {!loading && !filtered.length && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No se encontraron usuarios.
        </Typography>
      )}
      {dialog && (
        <UserFormModal
          key={dialog.user?.id || "new"}
          onClose={() => setDialog(null)}
          user={dialog.user}
          refresh={load}
        />
      )}
    </>
  );
}
