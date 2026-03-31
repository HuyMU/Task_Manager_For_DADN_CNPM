const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false }
        });

        const dbName = process.env.DB_NAME;
        console.log(`Connecting to database: ${dbName}`);
        await connection.query(`USE \`${dbName}\`;`);

        // Drop existing tables
        console.log('Dropping existing tables...');
        await connection.query('DROP TABLE IF EXISTS tasks;');
        await connection.query('DROP TABLE IF EXISTS users;');
        await connection.query('DROP TABLE IF EXISTS custom_roles;');

        console.log('Creating table: custom_roles');
        const createRolesTable = `
            CREATE TABLE IF NOT EXISTS custom_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createRolesTable);

        console.log('Creating table: users');
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'member') DEFAULT 'member',
                custom_role_id INT,
                is_reviewer BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (custom_role_id) REFERENCES custom_roles(id) ON DELETE SET NULL
            );
        `;
        await connection.query(createUsersTable);

        console.log('Creating table: tasks');
        const createTasksTable = `
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                assigned_role_id INT,
                status ENUM('pending', 'in_progress', 'pending_review', 'completed') DEFAULT 'pending',
                due_date DATETIME,
                evidence_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_role_id) REFERENCES custom_roles(id) ON DELETE SET NULL
            );
        `;
        await connection.query(createTasksTable);

        // Seed default admin account
        console.log('Checking for default admin...');
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (rows.length === 0) {
            console.log('Seeding default admin account...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            await connection.query(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                ['admin', hashedPassword, 'admin']
            );
            console.log('Admin seeded: User: [admin] / Password: [123456]');
        }

        console.log('Database and tables have been initialized successfully!');
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error setting up the database:', error);
        process.exit(1);
    }
}

setupDatabase();
