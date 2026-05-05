require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER,
        password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
        multipleStatements: true
    });
    await db.query('SET FOREIGN_KEY_CHECKS=0');
    
    const checkCol = async (table, col) => {
        const [rows] = await db.query(
            'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',
            [table, col]
        );
        return rows.length > 0;
    };

    // 1. departments.manager_id
    if (!(await checkCol('departments', 'manager_id'))) {
        await db.query('ALTER TABLE departments ADD COLUMN manager_id INT DEFAULT NULL AFTER name');
        console.log('✅ Added departments.manager_id');
    } else console.log('⏭️  departments.manager_id exists');

    // 2. users.role_in_dept
    if (!(await checkCol('users', 'role_in_dept'))) {
        await db.query('ALTER TABLE users ADD COLUMN role_in_dept VARCHAR(100) DEFAULT NULL AFTER department_id');
        console.log('✅ Added users.role_in_dept');
    } else console.log('⏭️  users.role_in_dept exists');

    // 3. events.department_id
    if (!(await checkCol('events', 'department_id'))) {
        await db.query('ALTER TABLE events ADD COLUMN department_id INT DEFAULT NULL');
        console.log('✅ Added events.department_id');
    } else console.log('⏭️  events.department_id exists');

    // 4. Xóa coordination_unit
    if (await checkCol('events', 'coordination_unit')) {
        await db.query('ALTER TABLE events DROP COLUMN coordination_unit');
        console.log('✅ Dropped events.coordination_unit');
    } else console.log('⏭️  coordination_unit already removed');

    // 5. FK departments.manager_id -> users
    try {
        await db.query('ALTER TABLE departments ADD CONSTRAINT dept_manager_fk FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL');
        console.log('✅ FK dept.manager_id added');
    } catch(e) { console.log('⏭️  FK dept.manager_id:', e.code); }

    // 6. FK events.department_id -> departments
    try {
        await db.query('ALTER TABLE events ADD CONSTRAINT events_dept_fk FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL');
        console.log('✅ FK events.department_id added');
    } catch(e) { console.log('⏭️  FK events.dept:', e.code); }

    await db.query('SET FOREIGN_KEY_CHECKS=1');
    await db.end();
    console.log('\n🎉 Migration v4.1 done!');
}

migrate().catch(e => { console.error('❌', e.message); process.exit(1); });
