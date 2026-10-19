import { lazy, Suspense } from "react";
import { LinearProgress } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./utils/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
const ProjectBoard = lazy(() => import("./ProjectBoard"));
const UsersPage = lazy(() => import("./admin/UsersPage"));
export default function App() {
  return (
    <MainLayout>
      <Suspense fallback={<LinearProgress aria-label="Cargando vista" />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectBoard />} />
          </Route>
          <Route element={<ProtectedRoute admin />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}
