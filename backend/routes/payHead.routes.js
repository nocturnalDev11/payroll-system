const express = require('express');
const router = express.Router();
const PayHead = require('../models/payHead.model.js');

const isAdmin = (req, res, next) => {
    console.log('All request headers for payheads:', req.headers);
    const userRole = req.headers['user-role'] || 'employee';
    if (userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required', headers: req.headers });
    }
    next();
};

// Get all pay heads (Admin access only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const payheads = await PayHead.find().sort({ id: 1 });
        console.log('Fetched pay heads:', payheads.length);
        res.status(200).json(payheads);
    } catch (error) {
        console.error('Error fetching pay heads:', error);
        res.status(500).json({ error: 'Failed to fetch pay heads', message: error.message });
    }
});

// Create a new pay head (Admin access only)
router.post('/', isAdmin, async (req, res) => {
    try {
        console.log('Received pay head data:', req.body);
        const requiredFields = ['name', 'amount', 'type'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
        }

        // Find the highest existing ID and increment it
        const maxIdPayhead = await PayHead.findOne().sort({ id: -1 }).select('id');
        const newId = maxIdPayhead ? maxIdPayhead.id + 1 : 1;

        const payhead = new PayHead({ ...req.body, id: newId });
        await payhead.save();
        console.log('Saved pay head:', payhead);
        res.status(201).json(payhead);
    } catch (error) {
        console.error('Error creating pay head:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation failed', message: error.message, details: error.errors });
        } else if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate ID detected', message: error.message });
        } else {
            res.status(500).json({ error: 'Failed to create pay head', message: error.message });
        }
    }
});

// Update a pay head (Admin access only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const payhead = await PayHead.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true, runValidators: true }
        );
        if (!payhead) {
            console.error(`Pay head not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Pay head not found' });
        }
        console.log('Updated pay head:', payhead);
        res.status(200).json(payhead);
    } catch (error) {
        console.error('Error updating pay head:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation failed', message: error.message, details: error.errors });
        } else if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate ID detected', message: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update pay head', message: error.message });
        }
    }
});

// Delete a pay head (Admin access only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const result = await PayHead.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            console.error(`Pay head not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Pay head not found' });
        }
        console.log(`Deleted pay head with ID: ${req.params.id}`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting pay head:', error);
        res.status(500).json({ error: 'Failed to delete pay head', message: error.message });
    }
});

module.exports = router;