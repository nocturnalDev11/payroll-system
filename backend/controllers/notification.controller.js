const asyncHandler = require('express-async-handler');
const Notification = require('../models/notification.model.js');

const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.adminId || req.employeeId;
    const userModel = req.role === 'admin' ? 'Admin' : 'Employee';

    const notifications = await Notification.find({
        recipientId: userId,
        recipientModel: userModel,
    })
        .populate('senderId', 'firstName lastName username')
        .sort({ createdAt: -1 });

    res.status(200).json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
    const userId = req.adminId || req.employeeId;
    const userModel = req.role === 'admin' ? 'Admin' : 'Employee';
    const { id } = req.params;

    const notification = await Notification.findOne({
        _id: id,
        recipientId: userId,
        recipientModel: userModel,
    });

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    notification.status = 'Read';
    await notification.save();

    res.status(200).json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.adminId || req.employeeId;
    const userModel = req.role === 'admin' ? 'Admin' : 'Employee';

    await Notification.updateMany(
        {
            recipientId: userId,
            recipientModel: userModel,
            status: 'Unread',
        },
        { status: 'Read' }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
    const userId = req.adminId || req.employeeId;
    const userModel = req.role === 'admin' ? 'Admin' : 'Employee';
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: id,
        recipientId: userId,
        recipientModel: userModel,
    });

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    res.status(204).json({ message: 'Notification deleted' });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};