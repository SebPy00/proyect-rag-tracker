import { KeyboardCoordinateGetter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Nested task rectangles must not intercept horizontal column keyboard moves.
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  args,
) => {
  const { active, droppableContainers, droppableRects } = args.context;
  const rectangles = new Map(droppableRects);
  for (const container of droppableContainers.getEnabled()) {
    if (
      active?.data.current?.type === "column" &&
      container.data.current?.type !== "column"
    ) {
      rectangles.delete(container.id);
    }
    if (
      active?.data.current?.type === "task" &&
      container.id === active.data.current.columnId
    ) {
      rectangles.delete(container.id);
    }
  }
  return sortableKeyboardCoordinates(event, {
    ...args,
    context: { ...args.context, droppableRects: rectangles },
  });
};
