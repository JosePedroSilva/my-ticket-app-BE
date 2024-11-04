const jwt = require('jsonwebtoken');

// Token authentication middleware
const authenticateTokenMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        console.warn('[AUTH] No token provided');
        return res.status(401).send('Access denied');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('[AUTH] Invalid token');
            return res.status(403).send('Invalid token');
        }

        req.user = user;
        console.info('[AUTH] Token verified successfully');
        next();
    });
};

module.exports = authenticateTokenMiddleware;
