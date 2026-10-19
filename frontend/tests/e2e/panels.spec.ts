import { test, expect, Locator, Page } from "@playwright/test";
import { workspace } from "./fixture";

const kanban = (page: Page) => page.locator('[aria-label="Tablero Kanban"]');
const nav = (page: Page) =>
  page.getByRole("navigation", { name: "Navegación principal" });
const width = async (element: Locator) => (await element.boundingBox())!.width;
async function noDocumentOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("desktop panels persist independently, recover space and preserve navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await workspace(page);
  await page.goto("/project/demo");
  await expect(
    page.getByRole("heading", { name: "Lanzamiento DataLab" }),
  ).toBeVisible();
  await expect(nav(page)).toHaveCSS("width", "248px");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  const withoutAssistant = await width(kanban(page));
  const firstColumn = page
    .getByRole("button", { name: "Mover columna Por hacer", exact: true })
    .locator("..")
    .locator("..");
  expect(await width(firstColumn)).toBeGreaterThan(300);
  expect(await width(firstColumn)).toBeLessThanOrEqual(400);
  await page.mouse.move(1550, 950);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("sidebar-open-assistant-closed.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Mostrar asistente" }).click();
  await expect(
    page.getByRole("complementary", { name: "Asistente del proyecto" }),
  ).toBeVisible();
  await expect
    .poll(() => width(kanban(page)))
    .toBeCloseTo(withoutAssistant - 344, 0);
  await expect(
    page.getByText(/El asistente está temporalmente no disponible/),
  ).toBeVisible();
  await page.mouse.move(1550, 950);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("panels-open.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Contraer navegación" }).click();
  // Icons stay in the narrow rail while its outer width is still animating.
  expect(
    (await nav(page)
      .getByRole("link", { name: "Proyectos" })
      .locator("svg")
      .boundingBox())!.x,
  ).toBeLessThan(40);
  await expect(nav(page)).toHaveCSS("width", "64px");
  await expect
    .poll(() => width(kanban(page)))
    .toBeCloseTo(withoutAssistant - 344 + 184, 0);
  await expect(
    page.getByRole("button", { name: "Ocultar asistente" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.mouse.move(1550, 950);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("sidebar-closed-assistant-open.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expandir navegación" }),
  ).toBeVisible();
  await expect(page.getByRole("complementary")).toBeVisible();
  await page.getByRole("button", { name: "Ocultar asistente" }).click();
  await expect
    .poll(() => width(kanban(page)))
    .toBeCloseTo(withoutAssistant + 184, 0);
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await page.mouse.move(1550, 950);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("panels-closed.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Mostrar asistente" }),
  ).toBeVisible();
  await expect(nav(page)).toHaveCSS("width", "64px");
  await nav(page).getByRole("link", { name: "Usuarios" }).hover();
  await expect(page.getByRole("tooltip", { name: "Usuarios" })).toBeVisible();
  await nav(page).getByRole("link", { name: "Usuarios" }).click();
  await expect(
    page.getByRole("heading", { name: "Personas y acceso" }),
  ).toBeVisible();
  await nav(page).getByRole("link", { name: "Proyectos" }).click();
  await expect(
    page.getByRole("heading", { name: "Todo empieza con un proyecto" }),
  ).toBeVisible();
  const expand = page.getByRole("button", { name: "Expandir navegación" });
  await expand.focus();
  await page.keyboard.press("Enter");
  await expect(nav(page)).toHaveCSS("width", "248px");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo" }),
  ).toBeVisible();
  await noDocumentOverflow(page);
  expect(errors).toEqual([]);
});

test("mobile Drawer stays expanded and tablet keeps the assistant below Kanban", async ({
  page,
}) => {
  await workspace(page);
  await page.goto("/project/demo");
  await page.getByRole("button", { name: "Contraer navegación" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await expect(
    page.getByRole("presentation").getByText("Project Tracker"),
  ).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByRole("presentation")).toHaveCount(0);
  await expect(nav(page)).toHaveCSS("width", "64px");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page
    .getByRole("presentation")
    .getByRole("link", { name: "Proyectos" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Todo empieza con un proyecto" }),
  ).toBeVisible();
  await page.getByText("Lanzamiento DataLab", { exact: true }).click();
  await page.getByRole("button", { name: "Mostrar asistente" }).click();
  const boardBounds = (await kanban(page).boundingBox())!;
  const assistant = page.getByRole("complementary");
  await expect(assistant).toBeVisible();
  expect((await assistant.boundingBox())!.y).toBeGreaterThan(
    boardBounds.y + boardBounds.height,
  );
  await noDocumentOverflow(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(nav(page)).toHaveCSS("width", "64px");
  expect((await assistant.boundingBox())!.y).toBeGreaterThan(
    (await kanban(page).boundingBox())!.y,
  );
  await noDocumentOverflow(page);
});

test("scroll, task dialogs and keyboard/pointer sorting work after toggling panels", async ({
  page,
}) => {
  await workspace(page, { columns: 5 });
  await page.goto("/project/demo");
  await page.getByRole("button", { name: "Mostrar asistente" }).click();
  await page.getByRole("button", { name: "Contraer navegación" }).click();
  await page.getByRole("button", { name: "Ocultar asistente" }).click();
  const board = kanban(page);
  expect(
    await board.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await board.evaluate((element) => {
    element.scrollLeft = 400;
  });
  expect(await board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
    0,
  );
  await board.evaluate((element) => {
    element.scrollLeft = 0;
  });
  await page
    .getByRole("button", { name: /^Definir objetivos del proyecto Reunir/ })
    .click();
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Objetivos revisados");
  await page.getByRole("button", { name: "Guardar tarea" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const handle = page.getByRole("button", {
    name: "Mover columna Por hacer",
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Por hacer", { exact: true })).toHaveCount(2);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const previous = (await page.locator("[aria-live]").allTextContents()).find(
    (t) => t.includes("Draggable item"),
  );
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    (old) =>
      Array.from(document.querySelectorAll("[aria-live]")).some(
        (n) => n.textContent?.includes("moved over") && n.textContent !== old,
      ),
    previous,
  );
  const keyboardSaved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/reorder/") &&
      response.request().method() === "POST",
  );
  await page.keyboard.press("Space");
  await keyboardSaved;
  await expect
    .poll(
      async () =>
        (await page
          .getByRole("button", {
            name: "Mover columna En progreso",
            exact: true,
          })
          .boundingBox())!.x,
    )
    .toBeLessThan((await handle.boundingBox())!.x);
  const task = page.getByRole("button", {
    name: "Mover tarea Objetivos revisados",
    exact: true,
  });
  const target = page.getByRole("button", {
    name: "Mover columna Completado",
    exact: true,
  });
  await target.scrollIntoViewIfNeeded();
  const from = (await task.boundingBox())!,
    to = (await target.boundingBox())!;
  const pointerSaved = page.waitForRequest(
    (request) =>
      request.url().endsWith("/reorder/") && request.method() === "POST",
  );
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    from.x + from.width / 2 + 12,
    from.y + from.height / 2,
    { steps: 3 },
  );
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 15,
  });
  await page.mouse.up();
  const payload = (await pointerSaved).postDataJSON();
  expect(
    payload.columns.find((c: { id: string }) => c.id === "col-2").tasks,
  ).toContain("task-0");
  await expect(
    page.getByRole("button", {
      name: "Mover tarea Objetivos revisados",
      exact: true,
    }),
  ).toBeVisible();
});

test("member login and collapsed logout preserve access restrictions", async ({
  page,
}) => {
  await workspace(page, { authenticated: false, staff: false });
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: /Nombre de usuario/ })
    .fill("datalab-demo");
  await page.getByLabel(/Contraseña/).fill("frontend-fixture-only");
  await page.getByRole("button", { name: "Entrar al workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Todo empieza con un proyecto" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Contraer navegación" }).click();
  await expect(nav(page).getByRole("link", { name: "Usuarios" })).toHaveCount(
    0,
  );
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "Todo empieza con un proyecto" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo" }),
  ).toBeVisible();
});
