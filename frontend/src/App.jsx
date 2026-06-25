import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import { SocketProvider } from "./context/SocketContext";  // ✅ This should work now
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Users from "./pages/Users";
import ResetPassword from "./pages/ResetPassword";
import Projects from "./pages/Projects";
import Sidebar from "./components/common/Sidebar";
import Navbar from "./components/common/Navbar";

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
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-soft)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto ed-scroll flex flex-col">
        <Navbar />
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
    <AuthProvider>
      <SocketProvider>
        <TaskProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <AppRoutes />
          </BrowserRouter>
        </TaskProvider>
      </SocketProvider>
    </AuthProvider>
  );
}