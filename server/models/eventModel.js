const db = require("../config/database")

const Event = {

    async getAll() {

        const [rows] = await db.query(
            "SELECT * FROM events ORDER BY date DESC"
        )

        return rows

    },

    async getById(id) {

        const [rows] = await db.query(
            "SELECT * FROM events WHERE id=?",
            [id]
        )

        return rows[0]

    },

    async create(data) {

        const { name, date, location, description } = data

        const [result] = await db.query(
            "INSERT INTO events(name,date,location,description) VALUES(?,?,?,?)",
            [name, date, location, description]
        )

        return result.insertId

    },

    async update(id, data) {

        const { name, date, location, description } = data

        await db.query(
            "UPDATE events SET name=?,date=?,location=?,description=? WHERE id=?",
            [name, date, location, description, id]
        )

    },

    async delete(id) {

        await db.query(
            "DELETE FROM events WHERE id=?",
            [id]
        )

    }

}

module.exports = Event