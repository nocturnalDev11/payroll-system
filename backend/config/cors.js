const corsOptions = {
    //  for testing
    // origin: ['http://localhost:5173'],

    // uncomment if deployed at production
    origin: 'https://payroll-system-frontend-pied.vercel.app',

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role', 'user-id'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = corsOptions;
