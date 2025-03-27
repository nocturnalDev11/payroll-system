const corsOptions = {
    origin: 'https://payroll-system-frontend-pied.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = corsOptions;