import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axiosInstance";
import { Project } from "../board/types";
import { useFeedback } from "../components/Feedback";
import { moveItem } from "../board/move";
export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const notify = useFeedback();
  const load = useCallback(async () => {
    const { data } = await api.get<Project>(`/api/projects/${projectId}/`);
    data.columns.sort((a, b) => a.order - b.order);
    data.columns.forEach((c) => c.tasks.sort((a, b) => a.order - b.order));
    setProject(data);
    setError("");
  }, [projectId]);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await load();
    } catch {
      setError(
        "No pudimos abrir el proyecto. Comprueba tu acceso y la conexión.",
      );
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function mutate(
    operation: () => Promise<unknown>,
    message: string,
  ): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
      await load();
      notify(message);
      return true;
    } catch {
      notify(
        "No pudimos completar el cambio. Actualiza el tablero e inténtalo de nuevo.",
        true,
      );
      try {
        await load();
      } catch {
        setError("No pudimos sincronizar el tablero. Reintenta la carga.");
      }
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reorder(activeId: string, overId: string) {
    if (!project || lock.current) return;
    const next = moveItem(project, activeId, overId);
    if (next === project) return;
    setProject(next);
    await mutate(
      () =>
        api.post(`/api/projects/${projectId}/reorder/`, {
          columns: next.columns.map((c) => ({
            id: c.id,
            tasks: c.tasks.map((t) => t.id),
          })),
        }),
      "Tablero reorganizado",
    );
  }
  return { project, loading, error, busy, reload, mutate, reorder };
}
