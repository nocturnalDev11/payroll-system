const corsOptions = {
    //  for testing
    origin: ['http://localhost:5173'],

    // for production
    // origin: 'https://payroll-system-frontend-pied.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role', 'user-id'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = corsOptions;
