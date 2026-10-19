import { moveItem } from "./move";
import { Project } from "./types";
const project: Project = {
  id: "p",
  name: "Board",
  description: null,
  columns: [
    {
      id: "a",
      title: "Todo",
      order: 0,
      tasks: [
        { id: "t1", title: "First", description: null, column: "a", order: 0 },
        { id: "t2", title: "Second", description: null, column: "a", order: 1 },
      ],
    },
    { id: "b", title: "Done", order: 1, tasks: [] },
  ],
};
test("moves to an empty column without mutating the original and normalizes order", () => {
  const next = moveItem(project, "t1", "b");
  expect(next.columns[1].tasks[0]).toMatchObject({
    id: "t1",
    column: "b",
    order: 0,
  });
  expect(next.columns[0].tasks[0]).toMatchObject({ id: "t2", order: 0 });
  expect(project.columns[0].tasks).toHaveLength(2);
});
test("reorders tasks and columns, ignores missing targets", () => {
  expect(
    moveItem(project, "t1", "t2").columns[0].tasks.map((t) => t.id),
  ).toEqual(["t2", "t1"]);
  expect(moveItem(project, "a", "b").columns.map((c) => c.id)).toEqual([
    "b",
    "a",
  ]);
  expect(moveItem(project, "t1", "missing")).toBe(project);
});
