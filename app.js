const express = require('express');
const { sendDiscordNotification } = require('./discordService');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin } = require('./authMiddleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// --- ACTIVITY LOG HELPER ---
async function logActivity(req, task_id, action) {
    if (!req.user || !req.user.id) return;
    try {
        await pool.query(
            'INSERT INTO activity_logs (task_id, user_id, action) VALUES (?, ?, ?)',
            [task_id, req.user.id, action]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

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
            custom_role_name: user.custom_role_name,
            is_reviewer: user.is_reviewer
        }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ 
            token, 
            role: user.role, 
            username: user.username, 
            custom_role_id: user.custom_role_id,
            custom_role_name: user.custom_role_name,
            is_reviewer: user.is_reviewer
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- USER MANAGEMENT ROUTES ---
app.get('/api/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.username, u.role, u.is_reviewer, r.name as custom_role_name 
            FROM users u 
            LEFT JOIN custom_roles r ON u.custom_role_id = r.id 
            WHERE u.role = 'member'
            ORDER BY u.username
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/users/:id/reviewer', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_reviewer } = req.body;
    try {
        await pool.query('UPDATE users SET is_reviewer = ? WHERE id = ?', [is_reviewer ? 1 : 0, id]);
        res.json({ message: 'Reviewer status updated' });
    } catch (error) {
        console.error('Error updating reviewer status:', error);
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

app.get('/api/tasks/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [tasks] = await pool.query(`
            SELECT t.*, r.name as assigned_role_name 
            FROM tasks t 
            LEFT JOIN custom_roles r ON t.assigned_role_id = r.id 
            WHERE t.id = ?
        `, [id]);
        
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        
        const [logs] = await pool.query(`
            SELECT a.*, u.username 
            FROM activity_logs a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.task_id = ? 
            ORDER BY a.created_at DESC
        `, [id]);
        
        res.json({ ...tasks[0], logs });
    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/tasks', verifyToken, isAdmin, async (req, res) => {
    const { title, description, assigned_role_id, status, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    try {
        const targetRoleId = assigned_role_id || null;
        const targetDueDate = due_date || null;
        const [result] = await pool.query(
            'INSERT INTO tasks (title, description, assigned_role_id, status, due_date) VALUES (?, ?, ?, COALESCE(?, \'pending\'), ?)',
            [title, description, targetRoleId, status, targetDueDate]
        );
        const taskId = result.insertId;
        await logActivity(req, taskId, 'Đã tạo công việc này');
        
        // Notify Discord
        sendDiscordNotification(
            `🚀 New Task Created: ${title}`,
            description || '*No description provided*',
            3066993 // Green color
        );
        
        res.status(201).json({ message: 'Task created successfully', taskId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/tasks/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_role_id, status, due_date, sos_flag } = req.body;
    
    try {
        const [tasks] = await pool.query('SELECT title, assigned_role_id, status, sos_flag FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        const task = tasks[0];

        const newStatus = status || task.status;
        const newSos = sos_flag !== undefined ? sos_flag : task.sos_flag;

        if (req.user.role === 'admin') {
            const targetRoleId = assigned_role_id === undefined ? task.assigned_role_id : (assigned_role_id || null);
            await pool.query(
                'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), assigned_role_id = ?, status = ?, due_date = COALESCE(?, due_date), sos_flag = ? WHERE id = ?',
                [title, description, targetRoleId, newStatus, due_date, newSos, id]
            );
        } else {
            if (status === undefined && sos_flag === undefined) {
                return res.status(400).json({ error: 'Members can only update task status or SOS flag' });
            }
            if (task.assigned_role_id !== null && task.assigned_role_id !== req.user.custom_role_id) {
                return res.status(403).json({ error: 'You are not allowed to update tasks assigned to other roles' });
            }

            await pool.query('UPDATE tasks SET status = ?, sos_flag = ? WHERE id = ?', [newStatus, newSos, id]);
        }

        if (newStatus !== task.status) await logActivity(req, id, `Đã chuyển sang: ${newStatus}`);
        if (newSos !== task.sos_flag) await logActivity(req, id, newSos ? 'Đã BẬT cờ khẩn cấp SOS 🆘' : 'Đã TẮT cờ SOS');
        
        // Discord Notification - Status completed
        if (newStatus === 'completed' && task.status !== 'completed') {
            sendDiscordNotification(
                `✅ Task Completed: ${task.title}`,
                `Task was successfully marked as **Completed** by ${req.user.username}.`,
                3066993 // Green color
            );
        }
        
        // Discord Notification - SOS Flagged
        if (newSos && !task.sos_flag) {
            sendDiscordNotification(
                `🚨 SOS ALERT: ${task.title}`,
                `**${req.user.username}** has raised the SOS flag for this task! Immediate attention may be required.`,
                15158332 // Red color
            );
        }
        
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/tasks/:id/request-review', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { evidence_note } = req.body;

    try {
        const [tasks] = await pool.query('SELECT assigned_role_id FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        const task = tasks[0];

        if (req.user.role !== 'admin' && task.assigned_role_id !== null && task.assigned_role_id !== req.user.custom_role_id) {
            return res.status(403).json({ error: 'You are not allowed to submit this task for review' });
        }

        await pool.query(
            'UPDATE tasks SET status = \'pending_review\', evidence_note = ? WHERE id = ?',
            [evidence_note || null, id]
        );
        await logActivity(req, id, 'Đã gửi yêu cầu duyệt (' + (evidence_note ? 'Có đính kèm evidence' : 'Không có evidence') + ')');
        res.json({ message: 'Task submitted for review' });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/tasks/:id/review', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    try {
        const [tasks] = await pool.query('SELECT assigned_role_id FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        const task = tasks[0];

        const isSelfRoleTask = (task.assigned_role_id !== null && task.assigned_role_id === req.user.custom_role_id);
        const canReview = req.user.role === 'admin' || (req.user.is_reviewer && !isSelfRoleTask);

        if (!canReview) {
            return res.status(403).json({ error: 'You are not allowed to review this task' });
        }

        if (action === 'approve') {
            await pool.query('UPDATE tasks SET status = \'completed\' WHERE id = ?', [id]);
            await logActivity(req, id, 'Đã DUYỆT (Approve) công việc');
            res.json({ message: 'Task approved' });
        } else if (action === 'reject') {
            await pool.query('UPDATE tasks SET status = \'in_progress\', evidence_note = NULL WHERE id = ?', [id]);
            await logActivity(req, id, 'Đã TỪ CHỐI (Reject) công việc');
            res.json({ message: 'Task rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
        }
    } catch (error) {
        console.error('Error reviewing task:', error);
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
    sendDiscordNotification('🟢 System Online', 'Task Manager Backend Server has been successfully restarted and is ready.', 3447003);
});
