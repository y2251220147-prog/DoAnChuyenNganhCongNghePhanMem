import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/authService";

export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { loginUser } = useContext(AuthContext);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const res = await login({ email, password });

            loginUser(res.data.token);

            alert("Login success");

            navigate("/dashboard");

        } catch (err) {

            alert(err.response?.data?.message || "Login failed");

        }

    };

    return (

        <div>

            <h2>Login</h2>

            <form onSubmit={handleSubmit}>

                <input
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button>Login</button>

            </form>

        </div>

    );

}