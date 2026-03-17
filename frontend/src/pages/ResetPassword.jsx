import { useState } from "react";
import { resetPassword } from "../services/authService";

export default function ResetPassword() {

    const [oldPassword, setOld] = useState("");
    const [newPassword, setNew] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await resetPassword({ oldPassword, newPassword });

            alert("Password updated");

        } catch (err) {

            alert(err.response.data.message);

        }

    };

    return (

        <div>

            <h2>Reset Password</h2>

            <form onSubmit={handleSubmit}>

                <input type="password" placeholder="Old password" onChange={(e) => setOld(e.target.value)} />

                <input type="password" placeholder="New password" onChange={(e) => setNew(e.target.value)} />

                <button>Update</button>

            </form>

        </div>

    );

}