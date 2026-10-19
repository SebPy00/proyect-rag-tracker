import { FormEvent, useContext, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { createUser, updateUser, ManagedUser } from "../api/usersApi";
import AuthContext from "../context/AuthContext";
import { useFeedback } from "../components/Feedback";
export default function UserFormModal({
  onClose,
  user,
  refresh,
}: {
  onClose: () => void;
  user: ManagedUser | null;
  refresh: () => Promise<void>;
}) {
  const auth = useContext(AuthContext)!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState(user?.is_staff || false);
  const notify = useFeedback();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const data = {
      username: String(form.get("username")).trim(),
      ...(password ? { password } : {}),
      ...(auth.user?.is_superuser ? { is_staff: staff } : {}),
    };
    setBusy(true);
    setError("");
    try {
      if (user) await updateUser(user.id, data);
      else await createUser(data);
      await refresh();
      notify(user ? "Usuario actualizado" : "Usuario creado");
      onClose();
    } catch (error: unknown) {
      const data = (error as { response?: { data?: Record<string, unknown> } })
        .response?.data;
      setError(
        data
          ? Object.entries(data)
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(" ") : value}`,
              )
              .join(" · ")
          : "No pudimos guardar el usuario. Comprueba la conexión.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="user-title"
    >
      <Box component="form" onSubmit={submit}>
        <DialogTitle id="user-title">
          {user ? "Editar usuario" : "Invitar al workspace"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              required
              autoFocus
              label="Nombre de usuario"
              name="username"
              defaultValue={user?.username || ""}
              disabled={busy}
              inputProps={{ maxLength: 150 }}
            />
            <TextField
              label={
                user ? "Nueva contraseña (opcional)" : "Contraseña inicial"
              }
              name="password"
              type="password"
              required={!user}
              autoComplete="new-password"
              disabled={busy}
              helperText="Usa una contraseña larga y única. Compártela por un canal seguro."
            />
            {auth.user?.is_superuser && (
              <FormControlLabel
                control={
                  <Switch
                    checked={staff}
                    onChange={(e) => setStaff(e.target.checked)}
                    disabled={busy || user?.id === auth.user.id}
                  />
                }
                label="Acceso a administración de usuarios"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="contained" type="submit" disabled={busy}>
            {busy ? "Guardando…" : "Guardar usuario"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
