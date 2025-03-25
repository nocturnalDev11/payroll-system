const express = require('express');
const router = express.Router();
const Position = require('../models/position.model.js');

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
    if (req.headers['user-role'] !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Get all positions (public access)
router.get('/', async (req, res) => {
    try {
        const positions = await Position.find();
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching positions', error: error.message });
    }
});

// Create a new position (admin only)
router.post('/', checkAdmin, async (req, res) => {
    try {
        const { name, salary } = req.body;
        if (!name || salary === undefined) {
            return res.status(400).json({ message: 'Position name and salary are required' });
        }

        const position = new Position({
            name,
            salary
        });

        const savedPosition = await position.save();
        res.status(201).json(savedPosition);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Position name already exists' });
        } else {
            res.status(500).json({ message: 'Error creating position', error: error.message });
        }
    }
});

module.exports = router;