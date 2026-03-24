import { useState } from "react";
import api from "../../services/api";

export default function CheckinScanner() {

    const [qr, setQr] = useState("");

    const checkin = async () => {

        await api.post("/checkin", { qr_code: qr });

        alert("Checkin success");

    };

    return (

        <div>

            <h2>QR Checkin</h2>

            <input
                placeholder="scan qr"
                onChange={(e) => setQr(e.target.value)}
            />

            <button onClick={checkin}>
                Checkin
            </button>

        </div>

    );

}