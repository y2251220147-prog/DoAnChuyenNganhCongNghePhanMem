import { Link } from "react-router-dom";

export default function Sidebar() {

    return (

        <div className="sidebar">

            <h2>Event Manager</h2>

            <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                <Link to="/dashboard">Dashboard</Link>
                <Link to="/events">Events</Link>
                <Link to="/staff">Staff</Link>
                <Link to="/guests">Guests</Link>
                <Link to="/timeline">Timeline</Link>
                <Link to="/budget">Budget</Link>
                <Link to="/feedback">Feedback</Link>
                <Link to="/checkin">Checkin</Link>
                <Link to="/admin/users">Users</Link>

            </nav>

        </div>

    );

}