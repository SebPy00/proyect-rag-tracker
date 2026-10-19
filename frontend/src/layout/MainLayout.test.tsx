import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import AuthContext from "../context/AuthContext";
import MainLayout from "./MainLayout";

const logout = vi.fn();
async function click(element: HTMLElement) {
  await act(async () => {
    userEvent.click(element);
  });
}
function layout(staff = true) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: {
            id: 1,
            username: "datalab-demo",
            is_staff: staff,
            is_superuser: staff,
          },
          authTokens: null,
          loading: false,
          error: "",
          loginUser: vi.fn(),
          logoutUser: logout,
          retrySession: vi.fn(),
        }}
      >
        <MainLayout>
          <Routes>
            <Route path="/" element={<h1>Proyectos de prueba</h1>} />
            <Route path="/admin/users" element={<h1>Usuarios de prueba</h1>} />
          </Routes>
        </MainLayout>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  logout.mockClear();
});
afterEach(() => vi.restoreAllMocks());

test("desktop navigation collapses, retains labelled links/logout and restores preference after remount", async () => {
  const first = layout();
  await click(screen.getByRole("button", { name: "Contraer navegación" }));
  expect(
    screen.getByRole("button", { name: "Expandir navegación" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("Project Tracker")).not.toBeInTheDocument();
  const nav = screen.getByRole("navigation", { name: "Navegación principal" });
  await click(within(nav).getByRole("link", { name: "Usuarios" }));
  expect(
    screen.getByRole("heading", { name: "Usuarios de prueba" }),
  ).toBeInTheDocument();
  await click(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(logout).toHaveBeenCalledTimes(1);
  first.unmount();
  layout();
  expect(
    screen.getByRole("button", { name: "Expandir navegación" }),
  ).toBeInTheDocument();
  await click(screen.getByRole("button", { name: "Expandir navegación" }));
  expect(screen.getByText("Project Tracker")).toBeInTheDocument();
  expect(localStorage.getItem("tracker.sidebar-expanded")).toBe("true");
});

test("blocked storage does not prevent toggling or change member navigation permissions", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  layout(false);
  await click(screen.getByRole("button", { name: "Contraer navegación" }));
  expect(
    screen.getByRole("button", { name: "Expandir navegación" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Usuarios" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Proyectos" })).toBeInTheDocument();
});
