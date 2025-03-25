const cors = require('cors');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const connectDB = require('./config/database');
const corsOptions = require('./config/cors');
const adminRoutes = require('./routes/admin.routes.js');
const payslipRoutes = require('./routes/paySlip.routes.js');
const payheadRoutes = require('./routes/payHead.routes');
const positionRoutes = require('./routes/position.routes.js');
const employeeRoutes = require('./routes/employee.routes.js');
const attendanceRoutes = require('./routes/attendance.routes.js');
const leaveRequestRoutes = require('./routes/leaveRequest.routes.js');
const contributionRoutes = require('./routes/contribution.routes.js');
const employeeRecordRoutes = require('./routes/employeeRecords.routes.js');
const pendingRequestRoutes = require('./routes/pendingRequests.routes.js');
const positionHistoryRoutes = require('./routes/position.routes.js');

const PORT = process.env.PORT || 7777;
const app = express();

connectDB();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Log environment variables
console.log('Environment Variables:');
console.log('PORT:', process.env.PORT || 7777);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
console.log('USE_ATLAS:', process.env.USE_ATLAS ? 'Set' : 'Not set');

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRequestRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payheads', payheadRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/pending-requests', pendingRequestRoutes);
app.use('/api/positionHistory', positionHistoryRoutes);
app.use('/api/employee-contributions', contributionRoutes);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', uptime: process.uptime() });
});

// Default Route (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use(express.static('public'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')));

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});