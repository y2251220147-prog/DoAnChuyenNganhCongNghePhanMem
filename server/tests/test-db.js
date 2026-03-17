const db = require("../config/database");

db.query("SELECT 1", (err, result) => {
    if (err) {
        console.log("Query error:", err);
    } else {
        console.log("Database query success:", result);
    }
});