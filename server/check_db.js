const db = require('./config/database');
async function check() {
    const [users] = await db.query(`
        SELECT u.id, u.name, u.department_id, d.name as department_name 
        FROM users u 
        LEFT JOIN departments d ON u.department_id = d.id
    `);
    console.log("USERS:", JSON.stringify(users, null, 2));
    process.exit(0);
}
check();
