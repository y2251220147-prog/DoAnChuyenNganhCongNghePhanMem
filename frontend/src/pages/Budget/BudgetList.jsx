/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BudgetList() {

    const [budget, setBudget] = useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const res = await api.get("/budget/1");

        setBudget(res.data);

    };

    return (

        <div>

            <h2>Budget Management</h2>

            <table>

                <thead>

                    <tr>
                        <th>Item</th>
                        <th>Cost</th>
                    </tr>

                </thead>

                <tbody>

                    {budget.map((b) => (

                        <tr key={b.id}>

                            <td>{b.item}</td>

                            <td>{b.cost}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );
}