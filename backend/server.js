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
const attendanceSettingsRoutes = require('./routes/attendanceSettings.routes.js');

const app = express();

// Connect to the database (used in both local and production)
connectDB();

/* LOCAL DEVELOPMENT ONLY */
// Start the server locally when not running on Vercel.
// Vercel handles the server start in production, so this is skipped there.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/* PRODUCTION ONLY (optional manual CORS) */
// Uncomment this block if corsOptions in config/cors.js is insufficient for production.
// In local dev, corsOptions handles CORS dynamically.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://payroll-system-frontend-pied.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, user-role, user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Middleware (used in both local and production)
app.use(express.json());
// CORS config from config/cors.js, adjustable per environment
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// Log environment variables for debugging (useful in both environments)
console.log('Environment Variables:');
console.log('PORT:', process.env.PORT || 7777);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');

// Routes (used in both local and production)
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
app.use('/api/attendance-settings', attendanceSettingsRoutes);

// Health Check Route (useful for monitoring in both environments)
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', uptime: process.uptime() });
});

// Root Route (general welcome message, used in both environments)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Payroll System API' });
});

// 404 Handler (catch-all for undefined routes, used in both environments)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler (catch unhandled errors, used in both environments)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Serve static files (used in both environments if 'public' folder exists)
app.use(express.static('public'));

// Export the app for Vercel (required for production deployment)
module.exports = app;