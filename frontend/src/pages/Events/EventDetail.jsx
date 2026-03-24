/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

export default function EventDetail() {

    const { id } = useParams();
    const [event, setEvent] = useState({});

    useEffect(() => {
        load();
    }, []);

    const load = async () => {

        const res = await api.get(`/events/${id}`);

        setEvent(res.data);

    };

    return (

        <div>

            <h2>{event.name}</h2>

            <p>Date: {event.date}</p>

            <p>Location: {event.location}</p>

            <p>{event.description}</p>

        </div>

    );
}