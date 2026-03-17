import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminUsers from "./pages/AdminUsers";
import BudgetList from "./pages/Budget/BudgetList";
import CheckinScanner from "./pages/Checkin/CheckinScanner";
import Dashboard from "./pages/Dashboard/Dashboard";
import Events from "./pages/Events/EventList";
import AddGuest from "./pages/Guests/AddGuest";
import GuestList from "./pages/Guests/GuestList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import StaffList from "./pages/Staff/StaffList";
import TimelineList from "./pages/Timeline/TimelineList";
function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/events" element={<Events />} />

        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/guests" element={<GuestList />} />

        <Route path="/guests/add" element={<AddGuest />} />

        <Route path="/staff" element={<StaffList />} />

        <Route path="/timeline" element={<TimelineList />} />

        <Route path="/budget" element={<BudgetList />} />

        <Route path="/checkin" element={<CheckinScanner />} />
      </Routes>

    </BrowserRouter>

  );

}

export default App;