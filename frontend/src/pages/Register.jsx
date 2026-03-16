import { useState } from "react";
import { register } from "../services/authService";

export default function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await register({ name, email, password });

            alert("Register success");

        } catch (err) {

            alert(err.response.data.message);

        }

    };

    return (

        <div>

            <h2>Register</h2>

            <form onSubmit={handleSubmit}>

                <input placeholder="Name" onChange={(e) => setName(e.target.value)} />

                <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />

                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

                <button>Register</button>

            </form>

        </div>

    );

}