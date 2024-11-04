const express = require('express');
const db = require('../config/database');
const authenticateTokenMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Update username
router.post('/update-username', authenticateTokenMiddleware, (req, res) => {
    const { username } = req.body;
    console.log('[POST /update-username] Updating username:', { username, userId: req.user.id });

    if (!username) {
        return res.status(400).send('Username is required');
    }

    const query = `UPDATE users SET username = ? WHERE id = ?`;
    db.run(query, [username, req.user.id], (err) => {
        if (err) {
            console.error('[POST /update-username] Error:', err);
            return res.status(500).send('Error updating username');
        }

        console.log('[POST /update-username] Username updated successfully');
        res.status(200).send('Username updated');
    });
});

module.exports = router;
