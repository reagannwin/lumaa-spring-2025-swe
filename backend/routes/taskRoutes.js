const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const pool = require('../config/db');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    const tasks = await pool.query('SELECT * FROM tasks WHERE userId = $1', [req.user.userId]);
    res.json(tasks.rows);
});

router.post('/', authenticateToken, async (req, res) => {
    const { title, description } = req.body;
    const newTask = await pool.query(
        'INSERT INTO tasks (title, description, userId) VALUES ($1, $2, $3) RETURNING *',
        [title, description, req.user.userId]
    );
    res.json(newTask.rows[0]);
});

module.exports = router;
