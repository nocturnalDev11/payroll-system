import express from 'express';
import { verifyEmployeeToken } from '../middleware/employeeAuth.js';
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
        const fileName = `${req.employeeId}-${Date.now()}${fileExtension}`;
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
router.get('/pending', getPendingEmployees);
router.post('/login', loginEmployee);
router.post('/register', registerEmployee);
router.get('/:id/salary', verifyEmployeeToken, getEmployeeSalarySlip);
router.get('/profile', verifyEmployeeToken, getProfile);
router.get('/:id', getEmployeeById);
router.put('/update/:id', verifyEmployeeToken, updateEmployeeDetails);
router.post('/profile-picture', verifyEmployeeToken, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/:id', deleteEmployee);

export default router;