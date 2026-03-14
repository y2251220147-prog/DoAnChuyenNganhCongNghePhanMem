import { BrowserRouter, Route, Routes } from "react-router-dom"

import Dashboard from "../pages/Dashboard/Dashboard"

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes