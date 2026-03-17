/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StaffList() {

    const [staff, setStaff] = useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const res = await api.get("/staff/1");

        setStaff(res.data);

    };

    return (

        <div>

            <h2>Staff Assignment</h2>

            <table>

                <thead>

                    <tr>
                        <th>User ID</th>
                        <th>Role</th>
                    </tr>

                </thead>

                <tbody>

                    {staff.map((s) => (

                        <tr key={s.id}>

                            <td>{s.user_id}</td>
                            <td>{s.role}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );
}