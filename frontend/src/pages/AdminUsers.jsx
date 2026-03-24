import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import { changeRole, getUsers } from "../services/userService";

export default function AdminUsers() {

    const [users, setUsers] = useState([]);

    useEffect(() => {

        // eslint-disable-next-line react-hooks/immutability
        loadUsers();

    }, []);

    const loadUsers = async () => {

        const res = await getUsers();

        setUsers(res.data);

    };

    const handleRole = async (id) => {

        await changeRole(id, "admin");

        loadUsers();

    };

    return (

        <Layout>

            <h2>User List</h2>

            {users.map(u => (

                <div key={u.id}>

                    {u.name} - {u.email} - {u.role}

                    <button onClick={() => handleRole(u.id)}>
                        Make Admin
                    </button>

                </div>

            ))}

        </Layout>

    );

}