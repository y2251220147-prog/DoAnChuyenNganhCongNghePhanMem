import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import OrganizerUsers from "./pages/OrganizerUsers";
import UserProfile from "./pages/UserProfile";
import Events from "./pages/Events/EventList";
import EventDetail from "./pages/Events/EventDetail";
import CreateEvent from "./pages/Events/CreateEvent";
import EditEvent from "./pages/Events/EditEvent";
import GuestList from "./pages/Guests/GuestList";
import AddGuest from "./pages/Guests/AddGuest";
import StaffList from "./pages/Staff/StaffList";
import TimelineList from "./pages/Timeline/TimelineList";
import BudgetList from "./pages/Budget/BudgetList";
import CheckinScanner from "./pages/Checkin/CheckinScanner";

// Protected Route component
function ProtectedRoute({ children, allowedRoles }) {
    const { user, token } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Public routes */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify/:token" element={<VerifyEmail />} />

                {/* Protected routes - all authenticated users */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <UserProfile />
                    </ProtectedRoute>
                } />

                <Route path="/events" element={
                    <ProtectedRoute>
                        <Events />
                    </ProtectedRoute>
                } />

                <Route path="/events/create" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <CreateEvent />
                    </ProtectedRoute>
                } />

                <Route path="/events/edit/:id" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <EditEvent />
                    </ProtectedRoute>
                } />

                <Route path="/events/:id" element={
                    <ProtectedRoute>
                        <EventDetail />
                    </ProtectedRoute>
                } />

                <Route path="/guests" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <GuestList />
                    </ProtectedRoute>
                } />

                <Route path="/guests/add" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <AddGuest />
                    </ProtectedRoute>
                } />

                <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <StaffList />
                    </ProtectedRoute>
                } />

                <Route path="/timeline" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <TimelineList />
                    </ProtectedRoute>
                } />

                <Route path="/budget" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <BudgetList />
                    </ProtectedRoute>
                } />

                <Route path="/checkin" element={
                    <ProtectedRoute allowedRoles={["admin", "organizer"]}>
                        <CheckinScanner />
                    </ProtectedRoute>
                } />

                {/* Admin only */}
                <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminUsers />
                    </ProtectedRoute>
                } />

                {/* Organizer only */}
                <Route path="/organizer/users" element={
                    <ProtectedRoute allowedRoles={["organizer"]}>
                        <OrganizerUsers />
                    </ProtectedRoute>
                } />

            </Routes>

        </BrowserRouter>

    );

}

export default App;