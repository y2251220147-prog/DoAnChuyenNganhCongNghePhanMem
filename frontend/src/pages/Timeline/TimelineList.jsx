/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function TimelineList() {

    const [timeline, setTimeline] = useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const res = await api.get("/timeline/1");

        setTimeline(res.data);

    };

    return (

        <div>

            <h2>Event Timeline</h2>

            <ul>

                {timeline.map((t) => (

                    <li key={t.id}>
                        {t.title} {t.start_time}
                    </li>

                ))}

            </ul>

        </div>

    );
}