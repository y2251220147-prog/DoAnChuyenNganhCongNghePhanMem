import { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

// ── Admin / Organizer pages ──────────────────────────────────────────────────
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
import UserEventPortal from "./pages/Portal/UserEventPortal";
import GuestPublicPortal from "./pages/Portal/GuestPublicPortal";
import SearchPage from "./pages/Events/SearchPage";

// ── Employee (User) pages ───────────────────────────────────────────────────
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import { EmployeeExplore, EmployeeMyEvents } from "./pages/Employee/EmployeeEvents";
import EmployeeEventDetail from "./pages/Employee/EmployeeEventDetail";
import EmployeeCalendar from "./pages/Employee/EmployeeCalendar";
import EmployeeNotifications from "./pages/Employee/EmployeeNotifications";
import ProfilePage from "./pages/Profile/ProfilePage";

// ── Route guards ─────────────────────────────────────────────────────────────
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

/** Smart dashboard: redirect User role to employee portal */
function SmartDashboard() {
  const { user } = useContext(AuthContext);
  if (user?.role === "user") return <EmployeeDashboard />;
  return <Dashboard />;
}

/** Smart events: redirect User role to employee explore */
function SmartEvents() {
  const { user } = useContext(AuthContext);
  if (user?.role === "user") return <EmployeeExplore />;
  return <EventList />;
}

/** Smart notifications: redirect User to employee notifications */
function SmartNotifications() {
  const { user } = useContext(AuthContext);
  if (user?.role === "user") return <EmployeeNotifications />;
  return <NotificationCenter />;
}

/** Smart event detail: redirect User to employee detail view */
function SmartEventDetail() {
  const { user } = useContext(AuthContext);
  if (user?.role === "user") return <EmployeeEventDetail />;
  return <EventDetail />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />

        {/* Smart routes — role-aware */}
        <Route path="/dashboard" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><SmartEvents /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><SmartNotifications /></ProtectedRoute>} />

        {/* Employee-only routes */}
        <Route path="/my-events" element={<RoleRoute roles={["user"]}><EmployeeMyEvents /></RoleRoute>} />
        <Route path="/my-portal" element={<ProtectedRoute><UserEventPortal /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute>
          {/* Calendar: user → employee calendar; others → redirect to dashboard */}
          <EmployeeCalendar />
        </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/events/:id" element={<ProtectedRoute><SmartEventDetail /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />

        {/* Admin / Organizer only */}
        <Route path="/guests" element={<RoleRoute roles={["admin","organizer"]}><GuestList /></RoleRoute>} />
        <Route path="/staff" element={<RoleRoute roles={["admin","organizer"]}><StaffList /></RoleRoute>} />
        <Route path="/timeline" element={<RoleRoute roles={["admin","organizer"]}><TimelineList /></RoleRoute>} />
        <Route path="/budget" element={<RoleRoute roles={["admin","organizer"]}><BudgetList /></RoleRoute>} />
        <Route path="/checkin" element={<RoleRoute roles={["admin","organizer"]}><CheckinScanner /></RoleRoute>} />
        <Route path="/reports" element={<RoleRoute roles={["admin","organizer"]}><Reports /></RoleRoute>} />
        <Route path="/venues" element={<RoleRoute roles={["admin","organizer"]}><VenueList /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute roles={["admin"]}><AdminUsers /></RoleRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

        {/* Public */}
        <Route path="/guest-portal" element={<GuestPublicPortal />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
