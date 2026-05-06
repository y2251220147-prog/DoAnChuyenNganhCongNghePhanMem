import { useState } from "react";
import api from "../../services/api";

export default function AddGuest() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const submit = async (e) => {

        e.preventDefault();

        await api.post("/guests", {
            event_id: 1,
            name,
            email,
            phone
        });

        alert("Guest added");

    };

    return (

        <form onSubmit={submit}>

            <h2>Add Guest</h2>

            <input
                placeholder="Name"
                onChange={(e) => setName(e.target.value)}
            />

            <input
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                placeholder="Phone"
                onChange={(e) => setPhone(e.target.value)}
            />

            <button>Add</button>

        </form>

    );
}