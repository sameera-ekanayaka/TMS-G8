import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Sidebar from "./components/common/Sidebar";
import Navbar from "./components/common/Navbar";

// Lazy-loaded routes
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Users = lazy(() => import("./pages/Users"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Projects = lazy(() => import("./pages/Projects"));

// A simple loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--color-hairline)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);
function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustResetPassword) return <Navigate to="/reset-password" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ResetPasswordRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.mustResetPassword) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { token, user } = useAuth();
  if (token) {
    if (user?.mustResetPassword) return <Navigate to="/reset-password" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-soft)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 overflow-y-auto ed-scroll flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password" 
        element={
          <ResetPasswordRoute>
            <ResetPassword />
          </ResetPasswordRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute>
            <MainLayout><Tasks /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <MainLayout><Projects /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <MainLayout><Users /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <TaskProvider>
              <BrowserRouter>
                <Toaster position="top-right" />
                <Suspense fallback={<PageLoader />}>
                  <AppRoutes />
                </Suspense>
              </BrowserRouter>
            </TaskProvider>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}