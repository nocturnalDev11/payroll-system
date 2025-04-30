const PayHead = require('../../models/payHead.model.js');

const getPayHeads = async (req, res) => {
    try {
        const query = {};
        if (req.query.isAttendanceAffected === 'true') {
            query.isAttendanceAffected = true;
        }
        if (req.query.type) {
            query.type = req.query.type;
        }
        const payheads = await PayHead.find(query).select('id name amount type description isRecurring isAttendanceAffected');
        res.status(200).json(payheads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pay heads', message: error.message });
    }
};

const createPayHead = async (req, res) => {
    try {
        const { name, amount, type, isRecurring, isAttendanceAffected } = req.body;
        if (!name || !amount || !type) {
            return res.status(400).json({ 
                error: `Missing required fields: ${[!name && 'name', !amount && 'amount', !type && 'type'].filter(Boolean).join(', ')}` 
            });
        }

        const maxIdPayhead = await PayHead.findOne().sort({ id: -1 }).select('id');
        const newId = maxIdPayhead ? maxIdPayhead.id + 1 : 1;

        const payhead = new PayHead({ 
            id: newId,
            name,
            amount,
            type,
            isRecurring: isRecurring || false,
            isAttendanceAffected: isAttendanceAffected || false
        });
        await payhead.save();
        res.status(201).json(payhead);
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation failed', message: error.message });
        } else if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate ID detected' });
        } else {
            res.status(500).json({ error: 'Failed to create pay head', message: error.message });
        }
    }
};

const updatePayHead = async (req, res) => {
    try {
        const payhead = await PayHead.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { 
                ...req.body, 
                isRecurring: req.body.isRecurring || false,
                isAttendanceAffected: req.body.isAttendanceAffected || false
            },
            { new: true, runValidators: true }
        );
        if (!payhead) return res.status(404).json({ error: 'Pay head not found' });
        res.status(200).json(payhead);
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation failed', message: error.message });
        } else if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate ID detected' });
        } else {
            res.status(500).json({ error: 'Failed to update pay head', message: error.message });
        }
    }
};

const deletePayHead = async (req, res) => {
    try {
        const result = await PayHead.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Pay head not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete pay head', message: error.message });
    }
};

module.exports = { getPayHeads, createPayHead, updatePayHead, deletePayHead };