const corsOptions = {
    origin: [
        'https://payroll-system-frontend-pied.vercel.app',
        'https://payroll-system-api-topaz.vercel.app',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 200
};
