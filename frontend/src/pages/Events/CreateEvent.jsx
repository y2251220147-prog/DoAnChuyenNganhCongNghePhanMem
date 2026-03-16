import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../services/eventService";

export default function CreateEvent() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");

    const submit = async (e) => {

        e.preventDefault();

        await createEvent({
            name,
            date,
            location,
            description
        });

        navigate("/events");

    };

    return (
        <form onSubmit={submit}>

            <h2>Create Event</h2>

            <input
                placeholder="Event name"
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="date"
                onChange={(e) => setDate(e.target.value)}
            />

            <input
                placeholder="Location"
                onChange={(e) => setLocation(e.target.value)}
            />

            <textarea
                placeholder="Description"
                onChange={(e) => setDescription(e.target.value)}
            />

            <button>Create</button>

        </form>
    );

}