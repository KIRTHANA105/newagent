import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { StoreProvider, useStore } from "./context/Store";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CreateTask } from "./pages/CreateTask";
import { Teams } from "./pages/Teams";
import { Logs } from "./pages/Logs";
import { SupabaseTest } from "./pages/SupabaseTest";

// Auth Guard Wrapper - must be inside StoreProvider
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// AppRoutes - must be inside StoreProvider
const AppRoutes = () => {
  const { currentUser } = useStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/supabase-test"
        element={<SupabaseTest />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateTask />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <Layout>
              <Teams />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Layout>
              <Logs />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// Inner component that uses the store - must be inside StoreProvider
const AppContent = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
