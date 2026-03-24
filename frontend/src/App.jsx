import { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

import AdminUsers from "./pages/AdminUsers";
import BudgetList from "./pages/Budget/BudgetList";
import CheckinScanner from "./pages/Checkin/CheckinScanner";
import Dashboard from "./pages/Dashboard/Dashboard";
import EventDetail from "./pages/Events/EventDetail";
import EventList from "./pages/Events/EventList";
import Feedback from "./pages/Feedback/Feedback";
import GuestList from "./pages/Guests/GuestList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reports from "./pages/Reports/Reports";
import ResetPassword from "./pages/ResetPassword";
import StaffList from "./pages/Staff/StaffList";
import TimelineList from "./pages/Timeline/TimelineList";
import VenueList from "./pages/Venues/VenueList";
import NotificationCenter from "./pages/Notifications/NotificationCenter";

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/" replace />;
}
function GuestOnlyRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? <Navigate to="/dashboard" replace /> : children;
}
function RoleRoute({ children, roles }) {
  const { token, user } = useContext(AuthContext);
  if (!token) return <Navigate to="/" replace />;
  if (roles && (!user || !roles.includes(user.role))) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="/guests" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><TimelineList /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><BudgetList /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckinScanner /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />
        <Route path="/venues" element={<ProtectedRoute><VenueList /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />

        <Route path="/admin/users" element={<RoleRoute roles={["admin"]}><AdminUsers /></RoleRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
