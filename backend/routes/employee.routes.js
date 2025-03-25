import express from 'express';
import { verifyAuthToken, verifyAdminOnly } from '../middleware/authMiddleware.js';
import { loginEmployee, registerEmployee } from '../controllers/employees/auth/employeeAuth.controller.js';
import { 
    getEmployeeById, 
    updateEmployeeDetails, 
    getProfile, 
    getTotalEmployees, 
    getAllEmployees, 
    deleteEmployee, 
    getPendingEmployees,
    getEmployeeSalarySlip,
    uploadProfilePicture
} from '../controllers/employees/employee.controller.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/profile-pictures');
    },
    filename: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${req.employeeId || req.adminId}-${Date.now()}${fileExtension}`; // Use adminId if available
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG/JPG/PNG images are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.get('/total', getTotalEmployees);
router.get('/', getAllEmployees);
router.post('/login', loginEmployee);
router.post('/register', registerEmployee);

router.get('/pending', verifyAuthToken, getPendingEmployees); 
router.get('/:id/salary', verifyAuthToken, getEmployeeSalarySlip);
router.get('/profile', verifyAuthToken, getProfile);
router.get('/:id', getEmployeeById);
router.put('/update/:id', verifyAuthToken, updateEmployeeDetails);
router.post('/profile-picture', verifyAuthToken, upload.single('profilePicture'), uploadProfilePicture); // Accessible by employees
router.delete('/:id', verifyAdminOnly, deleteEmployee);

export default router;