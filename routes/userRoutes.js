const express = require('express');
const db = require('../config/database');
const authenticateTokenMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Protected route for testing
router.get('/protected', authenticateTokenMiddleware, (req, res) => {
    res.status(200).send({ message: 'Protected route', user: req.user });
});

// Update username
router.post('/update-username', authenticateTokenMiddleware, (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    const query = `UPDATE users SET username = ? WHERE id = ?`;
    db.run(query, [username, req.user.id], (err) => {
        if (err) return res.status(500).send('Error updating username');

        res.status(200).send('Username updated');
    });
});

module.exports = router;
