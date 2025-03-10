import { PayHead } from '../../models/payHead.model.js';

export const getAllPayHeads = async (req, res) => {
    try {
        const payHeads = await PayHead.find().populate('employeeId', 'firstName lastName');
        res.status(200).json(payHeads);
    } catch (error) {
        console.error('Error fetching payheads:', error);
        res.status(500).json({ message: 'Failed to fetch payheads' });
    }
};

export const createPayHead = async (req, res) => {
    const { employeeId, name, amount, type } = req.body;

    try {
        const payHead = new PayHead({ employeeId, name, amount, type });
        await payHead.save();
        res.status(201).json(payHead);
    } catch (error) {
        console.error('Error creating payhead:', error);
        res.status(500).json({ message: 'Failed to create payhead' });
    }
};

export const updatePayHead = async (req, res) => {
    const { id } = req.params;
    const { name, amount, type } = req.body;

    // Validate id
    if (!id || id === 'undefined') {
        return res.status(400).json({ message: 'Invalid payhead ID provided' });
    }

    try {
        const payHead = await PayHead.findByIdAndUpdate(
            id,
            { name, amount, type },
            { new: true, runValidators: true }
        );
        if (!payHead) {
            return res.status(404).json({ message: 'Payhead not found' });
        }
        res.status(200).json(payHead);
    } catch (error) {
        console.error('Error updating payhead:', error);
        res.status(500).json({ message: 'Failed to update payhead: ' + error.message });
    }
};

export const deletePayHead = async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        return res.status(400).json({ message: 'Invalid payhead ID provided' });
    }

    try {
        const payHead = await PayHead.findByIdAndDelete(id);
        if (!payHead) {
            return res.status(404).json({ message: 'Payhead not found' });
        }
        res.status(200).json({ message: 'Payhead deleted successfully' });
    } catch (error) {
        console.error('Error deleting payhead:', error);
        res.status(500).json({ message: 'Failed to delete payhead: ' + error.message });
    }
};