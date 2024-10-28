const express = require('express');
const db = require('../config/database');
const authenticateTokenMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

async function getProjectsByUserId(userId) {
    const query = `
        SELECT projects.*
        FROM projects
        JOIN project_user ON projects.id = project_user.project_id
        WHERE project_user.user_id = ?
    `;

    return new Promise((resolve, reject) => {
        db.all(query, userId, (err, projects) => {
            if (err) {
                console.error('Error getting projects:', err);
                return reject(err);
            }

            resolve(projects);
        });
    });
}

router.get('/all-projects', authenticateTokenMiddleware, (req, res) => {
    const userId = req.user.id;

    console.log('User ID:', userId);

    getProjectsByUserId(userId)
        .then((projects) => {
            if (projects.length === 0) {
                console.warn('No projects found for user ID:', userId);
            }
            res.status(200).send(projects);
        })
        .catch((err) => {
            console.error('Error getting projects:', err);
            res.status(400).send({ 'Error getting projects': err });
        });
});

router.post('/create-project', authenticateTokenMiddleware, (req, res) => {
    const { name, description, status, start_date, due_date } = req.body;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).send('Project name is required');
    }

    const projectId = crypto.randomUUID();

    const query = `
        INSERT INTO projects (id, name, description, status, start_date, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [projectId, name, description, status, start_date, due_date], function (err) {
        if (err) {
            console.error('Error creating project:', err);
            return res.status(400).send('Error creating project');
        }

        const projectUserQuery = `
            INSERT INTO project_user (user_id, project_id, role)
            VALUES (?, ?, ?)
        `;

        db.run(projectUserQuery, [userId, projectId, 'admin'], function (err) {
            if (err) {
                console.error('Error creating project-user:', err);
                return res.status(400).send('Error creating project-user');
            }

            res.status(201).send({ id: projectId, name, description, status, start_date, due_date });
        });
    });
});




module.exports = router;
