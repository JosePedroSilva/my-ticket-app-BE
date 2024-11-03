const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Register user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    console.log('Register request received:', { email });

    if (!email || !password) {
        console.log('Email and password are required');
        return res.status(400).send('Email and password are required');
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        const uuid = crypto.randomUUID();

        const query = `INSERT INTO users (id, email, password) VALUES (?, ?, ?)`;

        db.run(query, [uuid, email, hash], function (err) {
            if (err?.message.includes('UNIQUE constraint failed: users.email')) {
                return res.status(409).send('User already exists');
            }

            if (err) {
                console.error('Error inserting user:', err);
                return res.status(400).send({ error: err.message });
            }

            const accessToken = generateAccessToken({ id: uuid, email });

            console.log('User registered successfully:', { id: uuid, email });
            res.status(201).send({ token: accessToken, user: { id: uuid, email } });
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
        if (!user) return res.status(404).send({ message: 'User not found' });
        if (err) return res.status(500).send('Error finding user');

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send('Error comparing passwords');
            if (!result) return res.status(401).send('Invalid password');

            const accessToken = generateAccessToken({ id: user.id, email: user.email });

            res.status(200).send({ token: accessToken, user: { id: user.id, email: user.email, username: user.username } });
        });
    });
});

module.exports = router;
