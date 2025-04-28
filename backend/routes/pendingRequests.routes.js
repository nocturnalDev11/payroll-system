const express = require('express');
const router = express.Router();
const {
    getMaxId,
    getPendingRequests,
    createPendingRequest,
    updatePendingRequest,
    approvePendingRequest,
    rejectPendingRequest,
    deletePendingRequest
} = require('../controllers/employee/pendingRequest.controller');

const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required', headersSent: req.headers });
    }
    next();
};

router.get('/max-id', getMaxId);
router.get('/', isAdmin, getPendingRequests);
router.post('/', createPendingRequest);
router.put('/:id', isAdmin, updatePendingRequest);
router.put('/:id/approve', isAdmin, approvePendingRequest);
router.put('/:id/reject', isAdmin, rejectPendingRequest);
router.delete('/:id', isAdmin, deletePendingRequest);

module.exports = router;