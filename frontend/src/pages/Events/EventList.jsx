import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteEvent, getEvents } from "../../services/eventService";
import "../../styles/event.css";

export default function EventList() {

    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    const loadEvents = async () => {

        const res = await getEvents();

        setEvents(res.data);

    };

    useEffect(() => {

        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadEvents();

    }, []);

    const handleDelete = async (id) => {

        if (window.confirm("Delete this event?")) {

            await deleteEvent(id);

            loadEvents();

        }

    };

    return (

        <div className="event-container">

            <div className="event-header">

                <h2>Event Management</h2>

                <button
                    className="create-btn"
                    onClick={() => navigate("/events/create")}
                >
                    Create Event
                </button>

            </div>

            <table className="event-table">

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Description</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {events.map((event) => (

                        <tr key={event.id}>

                            <td>{event.name}</td>

                            <td>{event.date}</td>

                            <td>{event.location}</td>

                            <td>{event.description}</td>

                            <td>

                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(event.id)}
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );
}