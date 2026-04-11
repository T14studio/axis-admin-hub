import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";

import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import LeadsPage from "./pages/admin/LeadsPage";
import PropertiesPage from "./pages/admin/PropertiesPage";
import PropertyForm from "./pages/admin/PropertyForm";
import ContractsPage from "./pages/admin/ContractsPage";
import ContractForm from "./pages/admin/ContractForm";
import ClientsPage from "./pages/admin/ClientsPage";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<AdminPage><Dashboard /></AdminPage>} />
            <Route path="/admin/leads" element={<AdminPage><LeadsPage /></AdminPage>} />
            <Route path="/admin/properties" element={<AdminPage><PropertiesPage /></AdminPage>} />
            <Route path="/admin/properties/:id" element={<AdminPage><PropertyForm /></AdminPage>} />
            <Route path="/admin/contracts" element={<AdminPage><ContractsPage /></AdminPage>} />
            <Route path="/admin/contracts/:id" element={<AdminPage><ContractForm /></AdminPage>} />
            <Route path="/admin/clients" element={<AdminPage><ClientsPage /></AdminPage>} />
            <Route path="/admin/users" element={<AdminPage><UsersPage /></AdminPage>} />
            <Route path="/admin/settings" element={<AdminPage><SettingsPage /></AdminPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
