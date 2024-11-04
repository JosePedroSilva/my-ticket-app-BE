const express = require('express');
const db = require('../config/database');
const authenticateTokenMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

async function getProjectsByUserId(userId) {
    console.log('Getting projects for user ID:', userId);

    const query = `
        SELECT projects.*
        FROM projects
        JOIN project_user ON projects.id = project_user.project_id
        WHERE project_user.user_id = ?
    `;

    console.log('Executing query:', query);

    return new Promise((resolve, reject) => {
        db.all(query, userId, (err, projects) => {
            if (err) {
                console.error('Error getting projects:', err);
                return reject(err);
            }

            console.log(`Found ${projects.length} projects for user ID ${userId}`);
            projects.forEach((project, index) => {
                console.log(`Project ${index + 1}:`, {
                    id: project.id,
                    name: project.name,
                    status: project.status
                });
            });

            resolve(projects);
        });
    });
}

router.get('/all-projects', authenticateTokenMiddleware, (req, res) => {
    const userId = req.user.id;
    console.log('[GET /all-projects] Request received from user:', userId);

    getProjectsByUserId(userId)
        .then((projects) => {
            if (projects.length === 0) {
                console.warn('[GET /all-projects] No projects found for user ID:', userId);
            } else {
                console.log('[GET /all-projects] Successfully retrieved', projects.length, 'projects');
            }
            res.status(200).send(projects);
        })
        .catch((err) => {
            console.error('[GET /all-projects] Error getting projects:', err);
            res.status(400).send({ 'Error getting projects': err });
        });
});

router.post('/create-project', authenticateTokenMiddleware, (req, res) => {
    const { name, description, status, start_date, due_date } = req.body;
    const userId = req.user.id;
    console.log('[POST /create-project] Creating new project:', { name, userId });

    if (!name) {
        console.warn('[POST /create-project] Project name missing in request');
        return res.status(400).send('Project name is required');
    }

    const projectId = crypto.randomUUID();
    console.log('[POST /create-project] Generated project ID:', projectId);

    const query = `
        INSERT INTO projects (id, name, description, status, start_date, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [projectId, name, description, status, start_date, due_date], function (err) {
        if (err) {
            console.error('[POST /create-project] Error inserting project:', err);
            return res.status(400).send('Error creating project');
        }

        console.log('[POST /create-project] Project created successfully');
        const projectUserQuery = `
            INSERT INTO project_user (user_id, project_id, role)
            VALUES (?, ?, ?)
        `;

        db.run(projectUserQuery, [userId, projectId, 'admin'], function (err) {
            if (err) {
                console.error('[POST /create-project] Error linking project to user:', err);
                return res.status(400).send('Error creating project-user');
            }

            console.log('[POST /create-project] Project-user relationship created successfully');
            res.status(201).send({ id: projectId, name, description, status, start_date, due_date });
        });
    });
});




module.exports = router;
