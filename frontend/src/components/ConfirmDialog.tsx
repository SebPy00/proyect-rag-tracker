import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
export default function ConfirmDialog({
  title,
  description,
  busy,
  onClose,
  onConfirm,
  confirmLabel = "Eliminar",
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      <DialogTitle id="confirm-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Procesando…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
