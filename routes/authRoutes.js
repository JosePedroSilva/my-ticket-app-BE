const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        const query = `INSERT INTO users (email, password) VALUES (?, ?)`;

        db.run(query, [email, hash], function (err) {
            if (err?.message.includes('UNIQUE constraint failed: users.email')) {
                return res.status(409).send('User already exists');
            }

            if (err) {
                return res.status(400).send({ error: err.message });
            }

            const token = jwt.sign({ id: this.lastID, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(201).send({ token });
        });
    });
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    const query = `SELECT * FROM users WHERE email = ?`;

    db.get(query, [email], (err, user) => {
        if (!user) return res.status(404).send('User not found');
        if (err) return res.status(500).send('Error finding user');

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send('Error comparing passwords');
            if (!result) return res.status(401).send('Invalid password');

            const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.status(200).send({ token });
        });
    });
});

module.exports = router;
