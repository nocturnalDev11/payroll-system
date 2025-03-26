require('dotenv').config();
const cors = require('cors');
const path = require('path');
const express = require('express');
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

const app = express();

// Connect to the database
connectDB();

// Set CORS headers for all responses
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://payroll-system-frontend-pied.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, user-role');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// Log environment variables
console.log('Environment Variables:');
console.log('PORT:', process.env.PORT || 7777);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

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
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', uptime: process.uptime() });
});

// Root Route (Moved before the 404 handler)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Payroll System API' });
});

// Default Route (404) - Must be after all other routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler - Must be last
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use(express.static('public'));

// Export the app for Vercel
module.exports = app;