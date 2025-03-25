import express from 'express';
import path from 'path';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import connectDB from './config/database.js';
import adminRoutes from './routes/admin.routes.js';
import paySlipRoutes from './routes/paySlip.routes.js';
import payHeadRoutes from './routes/payHead.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRequestRoutes from './routes/leaveRequest.routes.js';

const PORT = process.env.PORT || 5000;
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRequestRoutes);
app.use('/api/payslips', paySlipRoutes);
console.log('paySlipRoutes routes:', paySlipRoutes.stack.map(r => `${r.route.method} ${r.route.path}`));
app.use('/api/payheads', payHeadRoutes);
app.use('/uploads', express.static('public/uploads'));

app.use(express.static('public'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log('Registered routes:');
    app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
        } else if (r.regexp) {
            console.log(`Middleware: ${r.regexp}`);
        }
    });
});