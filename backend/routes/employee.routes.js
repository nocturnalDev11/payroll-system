const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, restrictToAdmin } = require('../middlewares/authMiddleware.js');
const { 
    loginEmployee, 
    registerEmployee,
    forgotPassword,
    resetPassword,
} = require('../controllers/employee/auth/employeeAuth.controller');
const { 
    getTotalEmployees,
    getProfile,
    uploadProfilePicture,
    updateEmployeeDetails,
    deleteEmployee,
    getArchivedEmployees,
    restoreEmployee,
    permanentDeleteEmployee,
    getAllEmployees,
    getEmployeeById,
    getSalaryData,
    createEmployee,
    updatePendingRequest,
    deleteEmployeeById,
    getPendingEmployees,
    deletePendingRequest,
    updatePendingRequestStatus,
    updateEmployeePassword
} = require('../controllers/employee/employee.controller');

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only JPEG/JPG/PNG images are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Auth routes
router.post('/login', loginEmployee);
router.post('/register', registerEmployee);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/update-password/:id', verifyToken, updateEmployeePassword);
router.get('/pending-requests', verifyToken, getPendingEmployees);

// Employee routes
router.get('/total', getTotalEmployees);
router.get('/profile', verifyToken, getProfile);
router.post('/profile-picture', verifyToken, upload.single('profilePicture'), uploadProfilePicture);
router.get('/', verifyToken, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.get('/:id/salary', verifyToken, getSalaryData);

// Admin-only routes
router.post('/', restrictToAdmin, createEmployee);
router.put('/update/:id', verifyToken, updateEmployeeDetails);
router.get('/archive', restrictToAdmin, getArchivedEmployees);
router.put('/:id/archive', restrictToAdmin, deleteEmployee);
router.delete('/:id', restrictToAdmin, deleteEmployeeById);
router.put('/pending-requests/:id', restrictToAdmin, updatePendingRequest);
router.put('/pending-requests/:id/reject', restrictToAdmin, updatePendingRequestStatus);
router.put('/archive/:id/restore', restrictToAdmin, restoreEmployee);
router.delete('/archive/:id', restrictToAdmin, permanentDeleteEmployee);

module.exports = router; 