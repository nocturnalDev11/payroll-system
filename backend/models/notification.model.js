const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recipientModel',
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Employee'],
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel',
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Employee'],
    },
    type: {
        type: String,
        required: true,
        enum: ['LeaveRequest', 'LeaveApproval', 'LeaveDisapproval', 'PayslipGenerated', 'General', 'leave_request'],
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Unread', 'Read'],
        default: 'Unread',
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel',
        default: null,
    },
    relatedModel: {
        type: String,
        enum: ['LeaveRequest', 'Payslip', null],
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);