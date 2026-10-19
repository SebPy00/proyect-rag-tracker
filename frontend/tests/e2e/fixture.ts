import { Page } from "@playwright/test";
import { Project } from "../../src/board/types";

export async function workspace(
  page: Page,
  options: {
    authenticated?: boolean;
    staff?: boolean;
    columns?: number;
    ai?: boolean;
  } = {},
) {
  const {
    authenticated = true,
    staff = true,
    columns = 3,
    ai = false,
  } = options;
  const jwt = (kind: string) =>
    `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, kind })).toString("base64url")}.test-signature`;
  const tokens = { access: jwt("access"), refresh: jwt("refresh") };
  const user = {
    id: 1,
    username: "datalab-demo",
    is_staff: staff,
    is_superuser: staff,
  };
  const project: Project = {
    id: "demo",
    name: "Lanzamiento DataLab",
    description:
      "Un espacio para planificar, priorizar y avanzar con claridad.",
    columns: Array.from({ length: columns }, (_, order) => ({
      id: `col-${order}`,
      title:
        ["Por hacer", "En progreso", "Completado"][order] ||
        `Etapa ${order + 1}`,
      order,
      tasks:
        order < 2
          ? [
              {
                id: `task-${order}`,
                column: `col-${order}`,
                title: [
                  "Definir objetivos del proyecto",
                  "Diseñar el flujo de trabajo",
                ][order],
                description:
                  "Reunir las decisiones y los próximos pasos del equipo.",
                order: 0,
              },
            ]
          : [],
    })),
  };
  if (authenticated)
    await page.addInitScript((value) => {
      // Seed only once; a reload must exercise the application's own persisted state.
      if (!sessionStorage.getItem("test-session-seeded")) {
        localStorage.setItem("authTokens", JSON.stringify(value));
        sessionStorage.setItem("test-session-seeded", "true");
      }
    }, tokens);
  await page.route(
    (url) =>
      url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/"),
    async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const method = request.method();
      let data: unknown;
      if (path === "/auth/jwt/create/") data = tokens;
      else if (path === "/api/me/") data = user;
      else if (path === "/api/projects/" && method === "GET") data = [project];
      else if (path === "/api/projects/demo/" && method === "GET")
        data = project;
      else if (path === "/api/capabilities/")
        data = { ai_enabled: ai, embeddings_enabled: ai, rag_available: ai };
      else if (path.endsWith("/history/")) data = [];
      else if (path === "/api/users/") data = [user];
      else if (path.endsWith("/reorder/")) {
        const allTasks = project.columns.flatMap((c) => c.tasks);
        project.columns = request
          .postDataJSON()
          .columns.map((c: { id: string; tasks: string[] }, order: number) => ({
            ...project.columns.find((column) => column.id === c.id)!,
            order,
            tasks: c.tasks.map((id, index) => ({
              ...allTasks.find((t) => t.id === id)!,
              column: c.id,
              order: index,
            })),
          }));
        data = { status: "ok" };
      } else if (path.startsWith("/api/tasks/") && method === "PATCH") {
        const task = project.columns
          .flatMap((c) => c.tasks)
          .find((t) => path.includes(t.id))!;
        Object.assign(task, request.postDataJSON());
        data = task;
      } else
        throw new Error(`Unexpected frontend API request: ${method} ${path}`);
      await route.fulfill({ json: data });
    },
  );
}
