const express = require('express');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin } = require('./authMiddleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(express.json());
app.use(express.static('public'));

// --- ROLE MANAGEMENT ROUTES ---
app.get('/api/roles', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM custom_roles ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/roles', verifyToken, isAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });
    try {
        const [result] = await pool.query('INSERT INTO custom_roles (name) VALUES (?)', [name]);
        res.status(201).json({ message: 'Role created', roleId: result.insertId });
    } catch (error) {
        if(error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Role already exists' });
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- AUTHENTICATION ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password, custom_role_id } = req.body;
    if (!username || !password || !custom_role_id) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password, role, custom_role_id) VALUES (?, ?, \'member\', ?)', 
            [username, hashedPassword, custom_role_id]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if(error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
        console.error('Error registering:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query(`
            SELECT u.*, r.name as custom_role_name 
            FROM users u 
            LEFT JOIN custom_roles r ON u.custom_role_id = r.id 
            WHERE u.username = ?
        `, [username]);
        
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ 
            id: user.id, 
            username: user.username, 
            role: user.role,
            custom_role_id: user.custom_role_id,
            custom_role_name: user.custom_role_name
        }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ 
            token, 
            role: user.role, 
            username: user.username, 
            custom_role_id: user.custom_role_id,
            custom_role_name: user.custom_role_name
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- TASK MANAGEMENT ROUTES ---
app.get('/tasks', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT tasks.*, custom_roles.name as assigned_role_name
            FROM tasks
            LEFT JOIN custom_roles ON tasks.assigned_role_id = custom_roles.id
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/tasks', verifyToken, isAdmin, async (req, res) => {
    const { title, description, assigned_role_id, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        const targetRoleId = assigned_role_id || null;
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, assigned_role_id, status) VALUES (?, ?, ?, COALESCE(?, \'pending\'))',
            [title, description, targetRoleId, status]
        );
        res.status(201).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/tasks/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_role_id, status } = req.body;
    
    try {
        const [tasks] = await pool.query('SELECT assigned_role_id FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        const task = tasks[0];

        if (req.user.role === 'admin') {
            const targetRoleId = assigned_role_id === undefined ? task.assigned_role_id : (assigned_role_id || null);
            await pool.query(
                'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), assigned_role_id = ?, status = COALESCE(?, status) WHERE id = ?',
                [title, description, targetRoleId, status, id]
            );
            res.json({ message: 'Task updated successfully' });
        } else {
            if (!status) return res.status(400).json({ error: 'Members can only update task status' });
            
            if (task.assigned_role_id !== null && task.assigned_role_id !== req.user.custom_role_id) {
                return res.status(403).json({ error: 'You are not allowed to update tasks assigned to other roles' });
            }

            await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
            res.json({ message: 'Status updated' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/tasks/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
