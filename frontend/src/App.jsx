import { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

import AdminUsers from "./pages/AdminUsers";
import BudgetList from "./pages/Budget/BudgetList";
import CheckinScanner from "./pages/Checkin/CheckinScanner";
import Dashboard from "./pages/Dashboard/Dashboard";
import EventList from "./pages/Events/EventList";
import GuestList from "./pages/Guests/GuestList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import StaffList from "./pages/Staff/StaffList";
import TimelineList from "./pages/Timeline/TimelineList";

// Guard: yêu cầu đăng nhập
function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/" replace />;
  return children;
}

// Guard: redirect về dashboard nếu đã đăng nhập
function GuestOnlyRoute({ children }) {
  const { token } = useContext(AuthContext);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

// Guard: yêu cầu role cụ thể
function RoleRoute({ children, roles }) {
  const { token, user } = useContext(AuthContext);
  if (!token) return <Navigate to="/" replace />;
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: redirect về dashboard nếu đã login */}
        <Route path="/" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
        <Route path="/guests" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><TimelineList /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><BudgetList /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckinScanner /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />

        {/* Admin-only */}
        <Route path="/admin/users" element={
          <RoleRoute roles={["admin"]}>
            <AdminUsers />
          </RoleRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
