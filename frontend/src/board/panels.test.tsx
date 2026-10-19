import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import ProjectBoard from "../ProjectBoard";
import MainLayout from "../layout/MainLayout";
import AuthContext from "../context/AuthContext";
import api from "../api/axiosInstance";
vi.mock("../api/axiosInstance", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../hooks/useProject", () => ({
  useProject: () => ({
    project: {
      id: "p",
      name: "Mi tablero",
      description: "Trabajo en equipo",
      columns: [],
    },
    loading: false,
    error: "",
    busy: false,
    reload: vi.fn(),
    mutate: vi.fn(),
    reorder: vi.fn(),
  }),
}));
async function click(element: HTMLElement) {
  await act(async () => {
    userEvent.click(element);
  });
}
function board() {
  return render(
    <MemoryRouter initialEntries={["/project/p"]}>
      <AuthContext.Provider
        value={{
          user: {
            id: 1,
            username: "member",
            is_staff: false,
            is_superuser: false,
          },
          authTokens: null,
          loading: false,
          error: "",
          loginUser: vi.fn(),
          logoutUser: vi.fn(),
          retrySession: vi.fn(),
        }}
      >
        <MainLayout>
          <Routes>
            <Route path="/project/:projectId" element={<ProjectBoard />} />
          </Routes>
        </MainLayout>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.get).mockReset();
  vi.mocked(api.get).mockImplementation((path: string) =>
    Promise.resolve({
      data: path.includes("capabilities") ? { rag_available: true } : [],
    }),
  );
});
afterEach(() => vi.restoreAllMocks());

test("assistant starts hidden without requests, can open/close and remembers its preference", async () => {
  const first = board();
  expect(
    screen.queryByRole("complementary", { name: "Asistente del proyecto" }),
  ).not.toBeInTheDocument();
  expect(api.get).not.toHaveBeenCalled();
  await act(async () => {
    await click(screen.getByRole("button", { name: "Mostrar asistente" }));
  });
  expect(
    await screen.findByRole("complementary", {
      name: "Asistente del proyecto",
    }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Ocultar asistente" }),
  ).toHaveAttribute("aria-expanded", "true");
  first.unmount();
  const second = board();
  expect(
    await screen.findByRole("complementary", {
      name: "Asistente del proyecto",
    }),
  ).toBeVisible();
  await click(screen.getByRole("button", { name: "Ocultar asistente" }));
  expect(
    screen.queryByRole("complementary", { name: "Asistente del proyecto" }),
  ).not.toBeInTheDocument();
  second.unmount();
  board();
  expect(
    screen.getByRole("button", { name: "Mostrar asistente" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("panels toggle independently and hiding the assistant preserves a draft", async () => {
  board();
  await act(async () => {
    await click(screen.getByRole("button", { name: "Mostrar asistente" }));
  });
  await screen.findByText("Disponible");
  await act(async () => {
    await userEvent.type(
      screen.getByLabelText("Pregunta sobre tu proyecto"),
      "Qué falta?",
    );
  });
  await click(screen.getByRole("button", { name: "Contraer navegación" }));
  expect(
    screen.getByRole("complementary", { name: "Asistente del proyecto" }),
  ).toBeVisible();
  await click(screen.getByRole("button", { name: "Ocultar asistente" }));
  expect(
    screen.getByRole("button", { name: "Expandir navegación" }),
  ).toBeInTheDocument();
  await click(screen.getByRole("button", { name: "Mostrar asistente" }));
  expect(screen.getByLabelText("Pregunta sobre tu proyecto")).toHaveValue(
    "Qué falta?",
  );
});

test("malformed preferences use defaults and write failures do not block the assistant", async () => {
  localStorage.setItem("tracker.assistant-expanded", "invalid");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  board();
  expect(
    screen.getByRole("button", { name: "Mostrar asistente" }),
  ).toBeInTheDocument();
  await act(async () => {
    await click(screen.getByRole("button", { name: "Mostrar asistente" }));
  });
  expect(
    await screen.findByRole("complementary", {
      name: "Asistente del proyecto",
    }),
  ).toBeVisible();
});
