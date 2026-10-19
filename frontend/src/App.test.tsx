import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import AuthContext from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./utils/ProtectedRoute";
import AssistantPanel from "./board/AssistantPanel";
import api from "./api/axiosInstance";
vi.mock("./api/axiosInstance", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
const context = {
  user: null,
  authTokens: null,
  loading: false,
  error: "",
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  retrySession: vi.fn(),
};

test("login exposes labelled fields and an inline error on rejected credentials", async () => {
  context.loginUser.mockRejectedValueOnce(new Error("Invalid"));
  render(
    <MemoryRouter>
      <AuthContext.Provider value={context}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText(/Nombre de usuario/), "member");
  await userEvent.type(screen.getByLabelText(/^Contraseña/), "wrong-password");
  await act(async () => {
    await userEvent.click(
      screen.getByRole("button", { name: /Entrar al workspace/ }),
    );
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No pudimos iniciar sesión",
  );
  expect(context.loginUser).toHaveBeenCalledWith("member", "wrong-password");
});

test("assistant disables submission when backend capabilities disable AI", async () => {
  vi.mocked(api.get).mockImplementation((path: string) =>
    Promise.resolve({
      data: path.includes("capabilities")
        ? { rag_available: false, ai_enabled: false, embeddings_enabled: false }
        : [],
    }),
  );
  render(<AssistantPanel projectId="project" />);
  expect(
    await screen.findByText(/El asistente está temporalmente no disponible/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Enviar pregunta/ }),
  ).toBeDisabled();
  expect(screen.getByLabelText("Pregunta sobre tu proyecto")).toBeDisabled();
  expect(api.post).not.toHaveBeenCalled();
});

test("assistant errors remain alerts and are never presented as assistant messages", async () => {
  vi.mocked(api.get).mockImplementation((path: string) =>
    Promise.resolve({
      data: path.includes("capabilities") ? { rag_available: true } : [],
    }),
  );
  vi.mocked(api.post).mockRejectedValueOnce({
    response: { data: { detail: "Servicio no disponible" } },
  });
  render(<AssistantPanel projectId="project" />);
  const input = await screen.findByLabelText("Pregunta sobre tu proyecto");
  await screen.findByText("Disponible");
  await userEvent.type(input, "Qué falta?");
  await act(async () => {
    await userEvent.click(
      screen.getByRole("button", { name: /Enviar pregunta/ }),
    );
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Servicio no disponible",
  );
  expect(screen.getByRole("log")).not.toHaveTextContent(
    "Servicio no disponible",
  );
  expect(screen.getByRole("log")).not.toHaveTextContent("Asistente");
});

test("administration route rejects a regular member", () => {
  render(
    <MemoryRouter initialEntries={["/admin/users"]}>
      <AuthContext.Provider
        value={{
          ...context,
          user: {
            id: 1,
            username: "member",
            is_staff: false,
            is_superuser: false,
          },
        }}
      >
        <Routes>
          <Route element={<ProtectedRoute admin />}>
            <Route
              path="/admin/users"
              element={<div>Administración privada</div>}
            />
          </Route>
          <Route path="/" element={<div>Workspace público del miembro</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  expect(screen.getByText("Workspace público del miembro")).toBeInTheDocument();
  expect(screen.queryByText("Administración privada")).not.toBeInTheDocument();
});
