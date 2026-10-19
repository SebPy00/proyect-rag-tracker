import { arrayMove } from "@dnd-kit/sortable";
import { Project } from "./types";
export function moveItem(
  project: Project,
  activeId: string,
  overId: string,
): Project {
  const columns = project.columns.map((c) => ({
    ...c,
    tasks: c.tasks.map((t) => ({ ...t })),
  }));
  const sourceColumn = columns.findIndex((c) => c.id === activeId);
  if (sourceColumn !== -1) {
    const destination = columns.findIndex(
      (c) => c.id === overId || c.tasks.some((t) => t.id === overId),
    );
    return destination === -1
      ? project
      : { ...project, columns: arrayMove(columns, sourceColumn, destination) };
  }
  const source = columns.find((c) => c.tasks.some((t) => t.id === activeId));
  const destination = columns.find(
    (c) => c.id === overId || c.tasks.some((t) => t.id === overId),
  );
  if (!source || !destination || activeId === overId) return project;
  const from = source.tasks.findIndex((t) => t.id === activeId);
  const to = destination.tasks.findIndex((t) => t.id === overId);
  if (source === destination)
    source.tasks = arrayMove(
      source.tasks,
      from,
      to === -1 ? source.tasks.length - 1 : to,
    );
  else {
    const [task] = source.tasks.splice(from, 1);
    task.column = destination.id;
    destination.tasks.splice(
      to === -1 ? destination.tasks.length : to,
      0,
      task,
    );
  }
  return {
    ...project,
    columns: columns.map((c, order) => ({
      ...c,
      order,
      tasks: c.tasks.map((t, index) => ({ ...t, order: index })),
    })),
  };
}
