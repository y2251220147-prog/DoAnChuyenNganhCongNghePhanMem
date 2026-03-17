export default function Dashboard() {

    return (

        <div>

            <h1>Dashboard</h1>

            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

                <div style={{ background: "#eee", padding: "20px", width: "200px" }}>
                    <h3>Total Events</h3>
                    <h2>12</h2>
                </div>

                <div style={{ background: "#eee", padding: "20px", width: "200px" }}>
                    <h3>Total Staff</h3>
                    <h2>25</h2>
                </div>

                <div style={{ background: "#eee", padding: "20px", width: "200px" }}>
                    <h3>Total Guests</h3>
                    <h2>140</h2>
                </div>

            </div>

        </div>

    );

}