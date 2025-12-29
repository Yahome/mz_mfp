import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AppEntry from "./pages/AppEntry";
import FrontendConfig from "./pages/FrontendConfig";
import Login from "./pages/Login";
import AdminResetPatient from "./pages/AdminResetPatient";
import ExportReport from "./pages/ExportReport";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <AppEntry />
        }
      />
      <Route
        path="/admin/config"
        element={
          <AppLayout showFormNav={false}>
            <FrontendConfig />
          </AppLayout>
        }
      />
      <Route
        path="/admin/reset"
        element={
          <AppLayout showFormNav={false}>
            <AdminResetPatient />
          </AppLayout>
        }
      />
      <Route
        path="/export"
        element={
          <AppLayout showFormNav={false}>
            <ExportReport />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
