const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// const generateRefreshToken = (user) => {
//     const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

//     const tokenId = crypto.randomUUID();

//     const testQuery = `INSERT INTO test (testing_int, testing_date, testing_text) VALUES (?, ?, ?)`;

//     db.run(testQuery, [1, datetime('now', '+30 days'), 'test'], (err) => {
//         if (err) {
//             console.error('Error inserting test:', err);
//         }
//         console.log('Test inserted successfully:', { id: 1, testing_int: 1, testing_date: '2022-01-01', testing_text: 'test' });
//     });

//     const query = `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`;

//     db.run(query, [tokenId, user.id, refreshToken, datetime('now', '+30 days')], (err) => {
//         if (err) {
//             console.error('Error inserting refresh token:', err);
//         }
//         console.log('Refresh token inserted successfully:', { id: tokenId, user_id: user.id, token: refreshToken });
//     });

//     return refreshToken;

// }

// Register user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    console.log('[AUTH] Register attempt:', { email });

    if (!email || !password) {
        console.warn('[AUTH] Registration failed: Missing credentials');
        return res.status(400).send('Email and password are required');
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('[AUTH] Password hashing failed:', err);
            return res.status(500).send('Error hashing password');
        }

        const uuid = crypto.randomUUID();
        console.log('[AUTH] Generated UUID:', uuid);

        const query = `INSERT INTO users (id, email, password) VALUES (?, ?, ?)`;

        db.run(query, [uuid, email, hash], function (err) {
            if (err?.message.includes('UNIQUE constraint failed: users.email')) {
                console.warn('[AUTH] Registration failed: Email already exists:', email);
                return res.status(409).send('User already exists');
            }

            if (err) {
                console.error('[AUTH] Database insertion failed:', err);
                return res.status(400).send({ error: err.message });
            }

            const accessToken = generateAccessToken({ id: uuid, email });

            console.info('[AUTH] User registered successfully:', {
                id: uuid,
                email,
                timestamp: new Date().toISOString()
            });

            res.status(201).send({ accessToken, user: { id: uuid, email } });
        });
    });
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt:', { email });

    if (!email || !password) {
        console.warn('[AUTH] Login failed: Missing credentials');
        return res.status(400).send('Email and password are required');
    }

    const query = `SELECT * FROM users WHERE email = ?`;

    db.get(query, [email], (err, user) => {
        if (!user) {
            console.warn('[AUTH] Login failed: User not found:', email);
            return res.status(404).send({ message: 'User not found' });
        }
        if (err) {
            console.error('[AUTH] Database query failed:', err);
            return res.status(500).send('Error finding user');
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error('[AUTH] Password comparison failed:', err);
                return res.status(500).send('Error comparing passwords');
            }
            if (!result) {
                console.warn('[AUTH] Login failed: Invalid password for user:', email);
                return res.status(401).send('Invalid password');
            }

            const accessToken = generateAccessToken({ id: user.id, email: user.email });

            console.info('[AUTH] User logged in successfully:', {
                id: user.id,
                email: user.email,
                timestamp: new Date().toISOString()
            });

            res.status(200).send({ token: accessToken, user: { id: user.id, email: user.email, username: user.username } });
        });
    });
});

module.exports = router;
