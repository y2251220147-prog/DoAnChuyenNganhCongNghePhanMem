/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function GuestList() {

    const [guests, setGuests] = useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const res = await api.get("/guests/1");

        setGuests(res.data);

    };

    return (

        <div>

            <h2>Guest List</h2>

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>

                    </tr>

                </thead>

                <tbody>

                    {guests.map((g) => (

                        <tr key={g.id}>

                            <td>{g.name}</td>
                            <td>{g.email}</td>
                            <td>{g.phone}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}